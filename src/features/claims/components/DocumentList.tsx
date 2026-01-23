'use client';

import { Download, Eye, FileIcon, FileText, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import type { Document } from '@/models/Schema';

type DocumentListProps = {
  documents: Document[];
  onDownload: (path: string) => Promise<string | null>;
};

export const DocumentList = ({ documents, onDownload }: DocumentListProps) => {
  const handleDownload = async (path: string) => {
    try {
      const url = await onDownload(path);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Impossibile recuperare il file');
      }
    } catch {
      toast.error('Errore durante il download');
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground">
        <p className="text-sm">Nessun documento caricato</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {documents.map((doc) => {
        const isImage = doc.path?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const isPdf = doc.path?.endsWith('.pdf');

        return (
          <div
            key={doc.id}
            className="group flex items-center justify-between gap-4 rounded-lg border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-sm"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                {isImage
                  ? (
                      <ImageIcon className="size-5 text-purple-500" />
                    )
                  : isPdf
                    ? (
                        <FileText className="size-5 text-red-500" />
                      )
                    : (
                        <FileIcon className="size-5 text-blue-500" />
                      )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium" title={doc.filename || 'Senza nome'}>
                  {doc.filename || 'Documento'}
                </span>
                <span className="text-[10px] uppercase text-muted-foreground">
                  {doc.type}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => handleDownload(doc.path!)}
              >
                <Eye className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => handleDownload(doc.path!)}
              >
                <Download className="size-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
