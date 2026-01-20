'use client';

import { UploadDropzone } from '@/utils/uploadthing';

type FileUploaderProps = {
  endpoint: 'imageUploader' | 'pdfUploader';
  onClientUploadComplete: (res: { url: string }[]) => void;
  onUploadError: (error: Error) => void;
};

export const FileUploader = ({
  endpoint,
  onClientUploadComplete,
  onUploadError,
}: FileUploaderProps) => {
  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        // Do something with the response
        console.log('Files: ', res);
        if (res) {
          onClientUploadComplete(res as { url: string }[]);
        }
      }}
      onUploadError={(error: Error) => {
        // Do something with the error.
        alert(`ERROR! ${error.message}`);
        onUploadError(error);
      }}
    />
  );
};
