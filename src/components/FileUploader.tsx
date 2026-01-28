import {
  CheckCircle2,
  FileText,
  RotateCcw,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import {
  deleteDocument as deleteDocumentAction,
  uploadFile as uploadFileAction,
} from '@/features/storage/actions/storage.actions';
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  validateFile,
} from '@/libs/storage-constants';
import type { StorageFolder } from '@/libs/supabase-storage';
import { cn } from '@/utils/Helpers';

type FileItemState =
  | { status: 'queued'; id: string; file: File; progress: number }
  | { status: 'uploading'; id: string; file: File; progress: number; abortController: AbortController }
  | { status: 'complete'; id: string; file: File; progress: 100; path: string }
  | { status: 'error'; id: string; file: File; progress: number; error: string };

type Action =
  | { type: 'ENQUEUE_FILES'; payload: FileItemState[] }
  | { type: 'START_UPLOAD'; payload: { id: string; abortController: AbortController } }
  | { type: 'UPDATE_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'COMPLETE_UPLOAD'; payload: { id: string; path: string } }
  | { type: 'ERROR_UPLOAD'; payload: { id: string; error: string } }
  | { type: 'REMOVE_FILE'; payload: { id: string } }
  | { type: 'RETRY_FILE'; payload: { id: string } };

function uploadReducer(state: FileItemState[], action: Action): FileItemState[] {
  switch (action.type) {
    case 'ENQUEUE_FILES':
      return [...state, ...action.payload];

    case 'START_UPLOAD':
      return state.map(item =>
        item.id === action.payload.id
          ? { ...item, status: 'uploading' as const, progress: 10, abortController: action.payload.abortController }
          : item,
      );

    case 'UPDATE_PROGRESS':
      return state.map(item =>
        item.id === action.payload.id && item.status === 'uploading'
          ? { ...item, progress: action.payload.progress }
          : item,
      );

    case 'COMPLETE_UPLOAD':
      return state.map(item =>
        item.id === action.payload.id
          ? {
              status: 'complete' as const,
              id: item.id,
              file: item.file,
              progress: 100,
              path: action.payload.path,
            }
          : item,
      );

    case 'ERROR_UPLOAD':
      return state.map(item =>
        item.id === action.payload.id
          ? {
              status: 'error' as const,
              id: item.id,
              file: item.file,
              progress: 0,
              error: action.payload.error,
            }
          : item,
      );

    case 'REMOVE_FILE': {
      const itemToRemove = state.find(i => i.id === action.payload.id);
      if (itemToRemove?.status === 'uploading') {
        itemToRemove.abortController.abort();
      }
      return state.filter(item => item.id !== action.payload.id);
    }

    case 'RETRY_FILE':
      return state.map(item =>
        item.id === action.payload.id
          ? { status: 'queued' as const, id: item.id, file: item.file, progress: 0 }
          : item,
      );

    default:
      return state;
  }
}

type FileUploaderProps = {
  folder: StorageFolder;
  accept?: string;
  targetOrgId?: string;
  maxFiles?: number;
  maxConcurrentUploads?: number;
  labels?: {
    dropPlaceholder: string;
    subtitle: string;
    limitReached: string;
    uploadError: string;
  };
  onUploadStart?: () => void;
  /** @deprecated Use onAllUploadsComplete for batch operations */
  onUploadComplete?: (res: { path: string }[]) => void;
  /** Called once when ALL files in the current batch have finished uploading (success or error) */
  onAllUploadsComplete?: (results: { path: string }[]) => void;
  onUploadError?: (error: Error) => void;
  onFileRemove?: (path: string) => void;
  uploadAction?: typeof uploadFileAction;
  deleteAction?: typeof deleteDocumentAction;
  disabled?: boolean;
};

const DEFAULT_LABELS = {
  dropPlaceholder: 'Carica documenti',
  subtitle: 'PDF, PNG, JPG, DOC, XLS, TXT',
  limitReached: 'Limite file raggiunto',
  uploadError: 'Caricamento fallito',
};

const DEFAULT_ACCEPT = [...ALLOWED_MIME_TYPES, ...ALLOWED_EXTENSIONS].join(',');

/**
 * File Uploader with bounded concurrency.
 */
export function FileUploader({
  folder,
  accept = DEFAULT_ACCEPT,
  targetOrgId,
  maxFiles = 25,
  maxConcurrentUploads = 3,
  labels = DEFAULT_LABELS,
  onUploadStart,
  onUploadComplete,
  onAllUploadsComplete,
  onUploadError,
  onFileRemove,
  uploadAction = uploadFileAction,
  deleteAction = deleteDocumentAction,
  disabled = false,
}: FileUploaderProps) {
  const [files, dispatch] = useReducer(uploadReducer, []);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const processingIds = useRef<Set<string>>(new Set());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  // Track batch state for onAllUploadsComplete
  const batchStartedRef = useRef(false);
  const batchCompleteFiredRef = useRef(false);

  useEffect(() => {
    const controllers = abortControllers.current;
    const ids = processingIds.current;
    return () => {
      controllers.forEach(ctrl => ctrl.abort());
      controllers.clear();
      ids.clear();
    };
  }, []);

  // Detect when a batch of uploads is complete and fire onAllUploadsComplete
  useEffect(() => {
    if (!onAllUploadsComplete || files.length === 0) {
      return;
    }

    const hasQueued = files.some(f => f.status === 'queued');
    const hasUploading = files.some(f => f.status === 'uploading');
    const completedFiles = files.filter(f => f.status === 'complete');

    // Batch is complete when: no queued, no uploading, and at least one complete
    const batchComplete = !hasQueued && !hasUploading && completedFiles.length > 0;

    if (batchComplete && batchStartedRef.current && !batchCompleteFiredRef.current) {
      batchCompleteFiredRef.current = true;
      onAllUploadsComplete(completedFiles.map(f => ({ path: f.path })));
    }
  }, [files, onAllUploadsComplete]);

  const processUpload = useCallback(
    async (fileItem: { id: string; file: File }) => {
      if (processingIds.current.has(fileItem.id)) {
        return;
      }
      processingIds.current.add(fileItem.id);

      const controller = new AbortController();
      abortControllers.current.set(fileItem.id, controller);
      dispatch({ type: 'START_UPLOAD', payload: { id: fileItem.id, abortController: controller } });

      try {
        // TODO: Server Actions don't support fine-grained progress.
        // This is a UI-only indicator of activity.
        dispatch({ type: 'UPDATE_PROGRESS', payload: { id: fileItem.id, progress: 50 } });

        const formData = new FormData();
        formData.append('file', fileItem.file);

        const result = await uploadAction(formData, folder, targetOrgId);

        dispatch({ type: 'COMPLETE_UPLOAD', payload: { id: fileItem.id, path: result.path } });
        // Legacy per-file callback (deprecated)
        onUploadComplete?.([{ path: result.path }]);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        const errorMessage = error instanceof Error ? error.message : labels.uploadError;
        dispatch({ type: 'ERROR_UPLOAD', payload: { id: fileItem.id, error: errorMessage } });
        onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
      } finally {
        processingIds.current.delete(fileItem.id);
        abortControllers.current.delete(fileItem.id);
      }
    },
    [folder, targetOrgId, uploadAction, onUploadComplete, onUploadError, labels.uploadError],
  );

  useEffect(() => {
    if (disabled) {
      return;
    }

    const queued = files.filter(f => f.status === 'queued');
    const uploadingCount = files.filter(f => f.status === 'uploading').length;

    if (queued.length > 0 && uploadingCount < maxConcurrentUploads) {
      const slotsToFill = maxConcurrentUploads - uploadingCount;
      const batch = queued.slice(0, slotsToFill);

      batch.forEach(item => processUpload({ id: item.id, file: item.file }));
    }
  }, [files, maxConcurrentUploads, disabled, processUpload]);

  const handleFiles = useCallback(
    (newFiles: File[]) => {
      if (disabled || !newFiles.length) {
        return;
      }

      const availableSlots = maxFiles - files.length;
      if (availableSlots <= 0) {
        toast.error(`Hai raggiunto il limite massimo di ${maxFiles} file.`);
        return;
      }

      let filesToProcess = newFiles;
      if (newFiles.length > availableSlots) {
        toast.warning(`Sono stati caricati solo i primi ${availableSlots} file.`);
        filesToProcess = newFiles.slice(0, availableSlots);
      }

      const fileItems: FileItemState[] = [];
      const invalidFiles: string[] = [];

      filesToProcess.forEach((f) => {
        const validation = validateFile(f);
        if (validation.valid) {
          fileItems.push({
            id: crypto.randomUUID(),
            file: f,
            progress: 0,
            status: 'queued' as const,
          });
        } else {
          invalidFiles.push(`${f.name}: ${validation.error}`);
        }
      });

      if (invalidFiles.length > 0) {
        invalidFiles.forEach(err => toast.error(err));
      }

      if (fileItems.length === 0) {
        return;
      }

      // Mark batch as started and reset completion flag for new batch
      batchStartedRef.current = true;
      batchCompleteFiredRef.current = false;

      onUploadStart?.();
      dispatch({ type: 'ENQUEUE_FILES', payload: fileItems });
    },
    [files.length, maxFiles, disabled, onUploadStart],
  );

  const handleRemove = useCallback(
    async (item: FileItemState) => {
      if (disabled) {
        return;
      }

      if (item.status === 'complete') {
        try {
          await deleteAction(item.path);
          onFileRemove?.(item.path);
        } catch (error) {
          console.error('[Storage] Delete failed:', error);
          toast.error('Errore durante la rimozione del file');
        }
      }

      dispatch({ type: 'REMOVE_FILE', payload: { id: item.id } });
    },
    [deleteAction, onFileRemove, disabled],
  );

  const handleRetry = useCallback(
    (id: string) => {
      if (!disabled) {
        dispatch({ type: 'RETRY_FILE', payload: { id } });
      }
    },
    [disabled],
  );

  const handleDrag = useCallback((e: React.DragEvent, active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragActive(active);
    }
  }, [disabled]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (!disabled && e.dataTransfer.files?.length) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    },
    [handleFiles, disabled],
  );

  return (
    <div className="w-full space-y-4">
      <motion.div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={labels.dropPlaceholder}
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
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(Array.from(e.target.files));
              e.target.value = '';
            }
          }}
          data-testid="file-upload-input"
        />

        <div className="pointer-events-none flex flex-col items-center justify-center space-y-4 text-center">
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
              {labels.dropPlaceholder}
            </p>
            <p className="text-sm text-muted-foreground">
              {labels.subtitle}
              {' '}
              (max
              {' '}
              {maxFiles}
              {' '}
              file)
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {files.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)', transition: { duration: 0.2 } }}
              layout
              className={cn(
                'relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-md p-3 shadow-sm transition-all hover:shadow-md hover:bg-card/80',
                item.status === 'error' ? 'border-destructive/30 bg-destructive/5' : 'border-border/40',
              )}
            >
              {/* Progress Bar */}
              {item.status === 'uploading' && (
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
                      <span className="capitalize">{item.status}</span>
                      {item.status === 'error' && item.error && ` • ${item.error}`}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {item.status === 'complete' && <CheckCircle2 className="size-5 text-green-500" />}
                  {item.status === 'uploading' && (
                    <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  )}

                  {item.status === 'error'
                    ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetry(item.id);
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
                            handleRemove(item);
                          }}
                          className="rounded-full p-1 transition-colors hover:bg-muted hover:text-destructive"
                          title="Rimuovi"
                        >
                          <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
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
