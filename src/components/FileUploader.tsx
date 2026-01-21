'use client';

import { CheckCircle2, FileText, RotateCcw, UploadCloud, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { uploadFile } from '@/features/storage/actions/storage.actions';
import { cn } from '@/utils/Helpers';

type FileStatus = {
  id: string;
  file: File;
  progress: number;
  status: 'queued' | 'uploading' | 'complete' | 'error';
  path?: string;
  error?: string;
};

type FileUploaderProps = {
  folder: 'claims' | 'documents' | 'procura';
  accept?: string;
  onUploadComplete: (res: { path: string }[]) => void;
  onUploadError?: (error: Error) => void;
};

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * File Uploader with drag-and-drop support
 * Uses Supabase Storage via server actions
 */
export function FileUploader({
  folder,
  accept = '.pdf,.png,.jpg,.jpeg,.gif,.webp',
  onUploadComplete,
  onUploadError,
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<FileStatus[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Upload a single file
  const uploadSingleFile = useCallback(
    async (fileItem: FileStatus) => {
      setFiles(prev =>
        prev.map(f => (f.id === fileItem.id ? { ...f, status: 'uploading' as const, progress: 30 } : f)),
      );

      try {
        // Client-side validation
        if (!ALLOWED_TYPES.includes(fileItem.file.type)) {
          throw new Error('Tipo file non valido (solo immagini o PDF)');
        }
        if (fileItem.file.size > MAX_FILE_SIZE) {
          throw new Error('File supera il limite di 50MB');
        }

        setFiles(prev =>
          prev.map(f => (f.id === fileItem.id ? { ...f, progress: 50 } : f)),
        );

        // Create FormData and upload via server action
        const formData = new FormData();
        formData.append('file', fileItem.file);

        const result = await uploadFile(formData, folder);

        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id
              ? { ...f, status: 'complete' as const, progress: 100, path: result.path }
              : f,
          ),
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload fallito';
        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id ? { ...f, status: 'error' as const, error: errorMessage } : f,
          ),
        );
        onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    },
    [folder, onUploadError],
  );

  // Handle new files
  const handleFiles = useCallback(
    (newFiles: File[]) => {
      if (!newFiles.length) {
        return;
      }

      const fileItems: FileStatus[] = newFiles.map(f => ({
        id: crypto.randomUUID(),
        file: f,
        progress: 0,
        status: 'queued' as const,
      }));

      setFiles(prev => [...prev, ...fileItems]);

      // Start uploads
      fileItems.forEach(item => uploadSingleFile(item));

      // Check completion and notify parent
      const checkCompletion = setInterval(() => {
        setFiles((current) => {
          const statusMap = new Map(current.map(f => [f.id, f]));
          const relevantFiles = fileItems.map(item => statusMap.get(item.id)).filter(Boolean);
          const allDone = relevantFiles.every(
            f => f!.status === 'complete' || f!.status === 'error',
          );

          if (allDone) {
            clearInterval(checkCompletion);
            const completedPaths = relevantFiles
              .filter(f => f!.status === 'complete' && f!.path)
              .map(f => ({ path: f!.path! }));

            if (completedPaths.length > 0) {
              onUploadComplete(completedPaths);
            }

            // Clear completed files after delay
            setTimeout(() => {
              setFiles(prev => prev.filter(f => f.status !== 'complete'));
            }, 1500);
          }
          return current;
        });
      }, 500);
    },
    [uploadSingleFile, onUploadComplete],
  );

  // Retry failed upload
  const handleRetry = useCallback(
    (fileItem: FileStatus) => {
      setFiles(prev =>
        prev.map(f =>
          f.id === fileItem.id ? { ...f, status: 'queued' as const, progress: 0, error: undefined } : f,
        ),
      );
      uploadSingleFile(fileItem);
    },
    [uploadSingleFile],
  );

  // Drag handlers
  const handleDrag = useCallback((e: React.DragEvent, active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(active);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files?.length) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    },
    [handleFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        handleFiles(Array.from(e.target.files));
        e.target.value = '';
      }
    },
    [handleFiles],
  );

  return (
    <div className="w-full space-y-4">
      {/* Dropzone */}
      <motion.div
        role="button"
        tabIndex={0}
        aria-label="Trascina documenti qui o premi per selezionare file"
        layout
        className={cn(
          'relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-8 transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          dragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30',
        )}
        onDragEnter={e => handleDrag(e, true)}
        onDragLeave={e => handleDrag(e, false)}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        whileTap={{ scale: 0.98 }}
      >
        <Input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept={accept}
          onChange={handleInputChange}
          data-testid="file-upload-input"
        />

        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <motion.div
            animate={dragActive ? { y: -8, scale: 1.1 } : { y: 0, scale: 1 }}
            className="rounded-full bg-background p-4 shadow-lg ring-1 ring-border/50"
          >
            <UploadCloud
              className={cn(
                'size-8 transition-colors',
                dragActive ? 'text-primary' : 'text-muted-foreground',
              )}
            />
          </motion.div>

          <div className="space-y-1">
            <p className="text-lg font-medium tracking-tight text-foreground">
              Carica documenti
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, PNG, JPG (max 50MB)
            </p>
          </div>
        </div>
      </motion.div>

      {/* File List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {files.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              layout
              className={cn(
                'relative overflow-hidden rounded-2xl border bg-card p-3 shadow-sm',
                item.status === 'error' ? 'border-destructive/50' : 'border-border/50',
              )}
            >
              {/* Progress Bar */}
              {item.status !== 'error' && (
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary/5"
                  initial={{ width: '0%' }}
                  animate={{ width: `${item.progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              )}

              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/50 ring-1 ring-border/20">
                    <FileText className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-none">
                      {item.file.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(item.file.size / 1024).toFixed(0)}
                      {' '}
                      KB •
                      {' '}
                      {item.status === 'complete'
                        ? 'Caricato'
                        : item.status === 'error'
                          ? 'Errore'
                          : `${item.progress}%`}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {item.status === 'complete' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle2 className="size-5 text-green-500" />
                    </motion.div>
                  )}
                  {item.status === 'uploading' && (
                    <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  )}
                  {item.status === 'error' && (
                    <>
                      <XCircle className="size-5 text-destructive" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetry(item);
                        }}
                        className="rounded-full p-1 transition-colors hover:bg-muted"
                        title="Riprova"
                      >
                        <RotateCcw className="size-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
