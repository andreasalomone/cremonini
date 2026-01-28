'use client';

import { CheckCircle2, FileText, RotateCcw, Trash2, UploadCloud, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import {
  deleteDocument as deleteDocumentAction,
  uploadFile as uploadFileAction,
} from '@/features/storage/actions/storage.actions';
import { useIsMounted } from '@/hooks/useIsMounted';
import { validateFile } from '@/libs/storage-constants';
import type { StorageFolder } from '@/libs/supabase-storage';
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
  folder: StorageFolder;
  accept?: string;
  targetOrgId?: string; // Optional target organization for SuperAdmins
  maxFiles?: number;
  onUploadStart?: () => void;
  onUploadComplete: (res: { path: string }[]) => void;
  onUploadError?: (error: Error) => void;
  onFileRemove?: (path: string) => void; // Callback when user removes a completed file
  // Dependency Injection for testing
  uploadAction?: typeof uploadFileAction;
  deleteAction?: typeof deleteDocumentAction;
  disabled?: boolean;
};

/**
 * File Uploader with drag-and-drop support
 * Uses Supabase Storage via server actions
 */
export function FileUploader({
  folder,
  accept = '.pdf,.png,.jpg,.jpeg,.gif,.webp,.eml,.xls,.xlsx,.doc,.docx,.txt,.avif,.heic,.heif',
  targetOrgId,
  maxFiles = 25,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  onFileRemove,
  uploadAction = uploadFileAction,
  deleteAction = deleteDocumentAction,
  disabled = false,
}: FileUploaderProps) {
  const isMounted = useIsMounted();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<FileStatus[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadSingleFile = useCallback(
    async (fileItem: FileStatus) => {
      if (!isMounted.current) {
        return null;
      }

      setFiles(prev =>
        prev.map(f => (f.id === fileItem.id ? { ...f, status: 'uploading' as const, progress: 30 } : f)),
      );

      try {
        // Client-side validation
        const validation = validateFile(fileItem.file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        if (isMounted.current) {
          setFiles(prev =>
            prev.map(f => (f.id === fileItem.id ? { ...f, progress: 50 } : f)),
          );
        }

        // Create FormData and upload via server action
        const formData = new FormData();
        formData.append('file', fileItem.file);

        // Call the injected action
        const result = await uploadAction(formData, folder, targetOrgId);

        if (isMounted.current) {
          setFiles(prev =>
            prev.map(f =>
              f.id === fileItem.id
                ? { ...f, status: 'complete' as const, progress: 100, path: result.path }
                : f,
            ),
          );
        }
        return result.path;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload fallito';
        if (isMounted.current) {
          setFiles(prev =>
            prev.map(f =>
              f.id === fileItem.id ? { ...f, status: 'error' as const, error: errorMessage } : f,
            ),
          );
        }
        onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
        return null;
      }
    },
    [folder, targetOrgId, onUploadError, uploadAction, isMounted],
  );

  const handleFiles = useCallback(
    async (newFiles: File[]) => {
      if (disabled || !newFiles.length || !isMounted.current) {
        return;
      }

      // Check max files limit
      const currentActiveFiles = files.length;
      const availableSlots = maxFiles - currentActiveFiles;

      if (availableSlots <= 0) {
        toast.error(`Hai raggiunto il limite massimo di ${maxFiles} file.`);
        return;
      }

      let filesToProcess = newFiles;
      if (newFiles.length > availableSlots) {
        toast.warning(`Sono stati caricati solo iprimi ${availableSlots} file per rispettare il limite.`);
        filesToProcess = newFiles.slice(0, availableSlots);
      }

      const fileItems: FileStatus[] = filesToProcess.map(f => ({
        id: crypto.randomUUID(),
        file: f,
        progress: 0,
        status: 'queued' as const,
      }));

      setFiles(prev => [...prev, ...fileItems]);
      onUploadStart?.();

      // Start uploads and wait for all to finish
      const uploadPromises = fileItems.map(item => uploadSingleFile(item));
      const results = await Promise.all(uploadPromises);

      const completedPaths = results
        .filter((path): path is string => path !== null)
        .map(path => ({ path }));

      if (completedPaths.length > 0 && isMounted.current) {
        onUploadComplete(completedPaths);
      }

      // We do NOT automatically clear completed files anymore, to allow user to see what they uploaded
      // Only clear them if success is meant to be ephemeral (can be added as prop later if needed)
    },
    [uploadSingleFile, onUploadComplete, onUploadStart, maxFiles, files.length, isMounted, disabled],
  );

  // Remove a file (and delete from storage if complete)
  const handleRemoveItem = useCallback(async (item: FileStatus) => {
    if (disabled) {
      return;
    }
    if (item.status === 'complete' && item.path) {
      try {
        await deleteAction(item.path);
        onFileRemove?.(item.path);
      } catch (error) {
        console.error('Failed to delete file from storage', error);
        toast.error('Errore durante la rimozione del file');
        // We still remove from UI even if strage delete fails?
        // Ideally yes, to not block the user.
      }
    }

    if (isMounted.current) {
      setFiles(prev => prev.filter(f => f.id !== item.id));
    }
  }, [deleteAction, onFileRemove, isMounted, disabled]);

  const handleRetry = useCallback(
    (fileItem: FileStatus) => {
      if (disabled || !isMounted.current) {
        return;
      }
      setFiles(prev =>
        prev.map(f =>
          f.id === fileItem.id ? { ...f, status: 'queued' as const, progress: 0, error: undefined } : f,
        ),
      );
      uploadSingleFile(fileItem);
    },
    [uploadSingleFile, isMounted, disabled],
  );

  const handleDrag = useCallback((e: React.DragEvent, active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || !isMounted.current) {
      return;
    }
    setDragActive(active);
  }, [isMounted, disabled]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled || !isMounted.current) {
        return;
      }
      setDragActive(false);
      if (e.dataTransfer.files?.length) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    },
    [handleFiles, isMounted, disabled],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) {
        return;
      }
      if (e.target.files?.length) {
        handleFiles(Array.from(e.target.files));
        e.target.value = '';
      }
    },
    [handleFiles, disabled],
  );

  return (
    <div className="w-full space-y-4">
      {/* Dropzone */}
      <motion.div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Trascina documenti qui o premi per selezionare file"
        aria-disabled={disabled}
        layout
        className={cn(
          'relative group overflow-hidden rounded-2xl border-2 border-dashed p-8 transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          dragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : disabled
              ? 'border-muted cursor-not-allowed opacity-60 bg-muted/10'
              : 'cursor-pointer border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30',
        )}
        onDragEnter={e => handleDrag(e, true)}
        onDragLeave={e => handleDrag(e, false)}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
      >
        <Input
          ref={inputRef}
          type="file"
          multiple
          disabled={disabled}
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
              PDF, PNG, JPG, DOC, XLS, TXT (max
              {' '}
              {maxFiles}
              {' '}
              file)
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
              initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)', transition: { duration: 0.2 } }}
              layout
              className={cn(
                'relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-md p-3 shadow-sm transition-all hover:shadow-md hover:bg-card/80',
                item.status === 'error' ? 'border-destructive/30' : 'border-border/40',
              )}
            >
              {/* Progress Bar (refined) */}
              {item.status !== 'error' && item.progress < 100 && (
                <motion.div
                  className="absolute inset-y-0 left-0 border-r border-primary/20 bg-primary/10"
                  initial={{ width: '0%' }}
                  animate={{ width: `${item.progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
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
                    <XCircle className="size-5 text-destructive" />
                  )}

                  {/* Actions: Retry or Delete */}
                  {item.status === 'error'
                    ? (
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
                      )
                    : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item);
                          }}
                          className="rounded-full p-1 transition-colors hover:bg-muted hover:text-destructive"
                          title="Rimuovi"
                        >
                          <Trash2 className="size-4" />
                        </button>
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
