import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FileUploader } from './FileUploader';

// Mock dependencies
vi.mock('@/hooks/useIsMounted', () => ({
  useIsMounted: () => ({ current: true }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock server actions (module level to avoid import side-effects)
vi.mock('@/features/storage/actions/storage.actions', () => ({
  uploadFile: vi.fn(),
  deleteDocument: vi.fn(),
}));

// Mock server actions (injectable)
// We keep these for explicit prop passing validation if needed,
// but the module mock handles the default props.
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

  it('handles file upload correctly', async () => {
    mockUploadAction.mockResolvedValue({ path: 'claims/test-file.pdf' });
    const onComplete = vi.fn();

    render(
      <FileUploader
        folder="claims"
        onUploadComplete={onComplete}
        uploadAction={mockUploadAction}
        deleteAction={mockDeleteAction}
      />,
    );

    const file = new File(['test content'], 'test-file.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-upload-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUploadAction).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith([{ path: 'claims/test-file.pdf' }]);
    });
  });

  it('respects maxFiles limit', async () => {
    const onComplete = vi.fn();

    render(
      <FileUploader
        folder="claims"
        maxFiles={2}
        onUploadComplete={onComplete}
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
      // Should show warning toast
      // And only upload 2 files
      expect(mockUploadAction).toHaveBeenCalledTimes(2);
    });
  });

  it('handles removal correctly', async () => {
    mockUploadAction.mockResolvedValue({ path: 'claims/file.pdf' });
    const onRemove = vi.fn();

    render(
      <FileUploader
        folder="claims"
        onUploadComplete={() => {}}
        onFileRemove={onRemove}
        uploadAction={mockUploadAction}
        deleteAction={mockDeleteAction}
      />,
    );

    const file = new File(['x'], 'file.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-upload-input');
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for upload to complete (trash icon appears)
    await waitFor(() => expect(screen.getByTitle('Rimuovi')).toBeInTheDocument());

    const removeBtn = screen.getByTitle('Rimuovi');
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(mockDeleteAction).toHaveBeenCalledWith('claims/file.pdf');
      expect(onRemove).toHaveBeenCalledWith('claims/file.pdf');
    });
  });
});
