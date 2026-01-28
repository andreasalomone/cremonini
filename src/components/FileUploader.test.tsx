import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FileUploader } from './FileUploader';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/features/storage/actions/storage.actions', () => ({
  uploadFile: vi.fn(),
  deleteDocument: vi.fn(),
}));

const mockUploadAction = vi.fn();
const mockDeleteAction = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FileUploader', () => {
  it('renders correctly', () => {
    render(
      <FileUploader
        folder="claims"
        onUploadComplete={() => {}}
        uploadAction={mockUploadAction}
        deleteAction={mockDeleteAction}
      />,
    );

    expect(screen.getByText(/Carica documenti/i)).toBeInTheDocument();
  });

  it('handles multiple file uploads correctly with individual completions', async () => {
    mockUploadAction.mockResolvedValue({ path: 'claims/test.pdf' });
    const onComplete = vi.fn();

    render(
      <FileUploader
        folder="claims"
        onUploadComplete={onComplete}
        uploadAction={mockUploadAction}
        deleteAction={mockDeleteAction}
      />,
    );

    const files = [
      new File(['1'], '1.pdf', { type: 'application/pdf' }),
      new File(['2'], '2.pdf', { type: 'application/pdf' }),
    ];
    const input = screen.getByTestId('file-upload-input');

    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      // Should be called for each file
      expect(onComplete).toHaveBeenCalledTimes(2);
      expect(onComplete).toHaveBeenCalledWith([{ path: 'claims/test.pdf' }]);
    });
  });

  it('respects maxConcurrentUploads limit (Semaphore)', async () => {
    let activeUploads = 0;
    let maxObservedUploads = 0;

    mockUploadAction.mockImplementation(async () => {
      activeUploads++;
      maxObservedUploads = Math.max(maxObservedUploads, activeUploads);
      await new Promise(resolve => setTimeout(resolve, 50));
      activeUploads--;
      return { path: 'path.pdf' };
    });

    render(
      <FileUploader
        folder="claims"
        onUploadComplete={() => {}}
        uploadAction={mockUploadAction}
        deleteAction={mockDeleteAction}
        maxConcurrentUploads={2}
      />,
    );

    const files = Array.from({ length: 5 }, (_, i) =>
      new File(['content'], `${i}.pdf`, { type: 'application/pdf' }));
    const input = screen.getByTestId('file-upload-input');

    fireEvent.change(input, { target: { files } });

    // Wait for all to finish
    await waitFor(() => expect(mockUploadAction).toHaveBeenCalledTimes(5), { timeout: 2000 });

    // Verify limit was never exceeded
    expect(maxObservedUploads).toBeLessThanOrEqual(2);
  });

  it('calls abort() on AbortController when removing an uploading file', async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

    mockUploadAction.mockImplementation(() => new Promise(() => {})); // Hang forever

    render(
      <FileUploader
        folder="claims"
        onUploadComplete={() => {}}
        uploadAction={mockUploadAction}
        deleteAction={mockDeleteAction}
      />,
    );

    const file = new File(['x'], 'file.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-upload-input');
    fireEvent.change(input, { target: { files: [file] } });

    // Find and click remove while uploading
    await waitFor(() => expect(screen.getByTitle('Rimuovi')).toBeInTheDocument());
    fireEvent.click(screen.getByTitle('Rimuovi'));

    expect(abortSpy).toHaveBeenCalled();

    abortSpy.mockRestore();
  });

  it('handles retry logic correctly', async () => {
    mockUploadAction
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValueOnce({ path: 'success.pdf' });

    render(
      <FileUploader
        folder="claims"
        onUploadComplete={() => {}}
        uploadAction={mockUploadAction}
        deleteAction={mockDeleteAction}
      />,
    );

    const file = new File(['x'], 'file.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByTestId('file-upload-input'), { target: { files: [file] } });

    // Wait for error
    await waitFor(() => expect(screen.getByTitle('Riprova')).toBeInTheDocument());

    // Click retry
    fireEvent.click(screen.getByTitle('Riprova'));

    await waitFor(() => {
      expect(mockUploadAction).toHaveBeenCalledTimes(2);
    });
  });

  it('fires onAllUploadsComplete once when entire batch finishes', async () => {
    let uploadCount = 0;
    mockUploadAction.mockImplementation(async () => {
      uploadCount++;
      return { path: `claims/file${uploadCount}.pdf` };
    });

    const onAllComplete = vi.fn();
    const onComplete = vi.fn();

    render(
      <FileUploader
        folder="claims"
        onUploadComplete={onComplete}
        onAllUploadsComplete={onAllComplete}
        uploadAction={mockUploadAction}
        deleteAction={mockDeleteAction}
      />,
    );

    const files = [
      new File(['1'], '1.pdf', { type: 'application/pdf' }),
      new File(['2'], '2.pdf', { type: 'application/pdf' }),
      new File(['3'], '3.pdf', { type: 'application/pdf' }),
    ];
    const input = screen.getByTestId('file-upload-input');

    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      // Individual callback should fire for each file
      expect(onComplete).toHaveBeenCalledTimes(3);

      // Batch callback should fire exactly once with all paths
      expect(onAllComplete).toHaveBeenCalledTimes(1);
      expect(onAllComplete).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ path: expect.stringMatching(/claims\/file\d\.pdf/) }),
        ]),
      );
    });

    // Verify batch contains all 3 files
    const batchResults = onAllComplete.mock.calls[0]![0] as { path: string }[];

    expect(batchResults).toHaveLength(3);
  });
});
