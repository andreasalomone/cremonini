'use client';

import { FileText, Trash2 } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { deleteDocument } from '@/features/documents/actions/documents.actions';
import { DOCUMENT_TYPE_OPTIONS } from '@/features/documents/constants';
import type { Document } from '@/models/Schema';

type DocumentListProps = {
  documents: Document[];
  canDelete?: boolean;
};

const getTypeLabel = (type: Document['type']) => {
  return DOCUMENT_TYPE_OPTIONS.find(opt => opt.value === type)?.label ?? type;
};

export const DocumentList = ({ documents, canDelete = true }: DocumentListProps) => {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (documentId: string) => {
    startTransition(async () => {
      try {
        await deleteDocument(documentId);
        toast.success('Documento eliminato');
      } catch {
        toast.error('Errore durante l\'eliminazione');
      }
    });
  };

  if (documents.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
        Nessun documento caricato
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map(doc => (
        <div
          key={doc.id}
          className="flex items-center justify-between rounded-md border p-3"
        >
          <div className="flex items-center gap-3">
            <FileText className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {doc.filename || 'Documento'}
              </p>
              <p className="text-xs text-muted-foreground">
                {getTypeLabel(doc.type)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                Apri
              </a>
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={() => handleDelete(doc.id)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
