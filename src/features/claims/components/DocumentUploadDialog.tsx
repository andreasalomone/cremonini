'use client';

import { Loader2, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addDocument, DOCUMENT_TYPE_OPTIONS } from '@/features/documents/actions/documents.actions';
import type { NewDocument } from '@/models/Schema';

const FileUploader = dynamic(() => import('@/components/FileUploader').then(mod => mod.FileUploader), {
  ssr: false,
});

type DocumentUploadDialogProps = {
  claimId: string;
  targetOrgId?: string; // Optional target organization for SuperAdmins
  readOnly?: boolean;
};

export function DocumentUploadDialog({ claimId, targetOrgId, readOnly = false }: DocumentUploadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentType, setDocumentType] = useState<NewDocument['type']>('CMR_DDT');

  const handleUploadComplete = async (files: { path: string }[]) => {
    if (files.length === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      // Parallelize DB operations
      const results = await Promise.allSettled(
        files.map((file) => {
          const filename = file.path.split('/').pop() || 'documento';
          return addDocument(claimId, documentType, file.path, filename);
        }),
      );

      let successCount = 0;
      let failCount = 0;

      for (const result of results) {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          failCount++;
          console.error('[DocumentUpload] Failed to link document:', result.reason);
        }
      }

      if (failCount === 0) {
        toast.success(`${successCount} documenti salvati con successo.`);
        setOpen(false);
        router.refresh();
      } else if (successCount > 0) {
        toast.warning(`${successCount} salvati, ma ${failCount} falliti. Controlla la console.`);
        router.refresh();
        // Keep dialog open to allow retry or inspection
      } else {
        toast.error('Impossibile salvare i documenti. Riprova.');
      }
    } catch {
      toast.error('Errore imprevisto durante il salvataggio.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (isProcessing) {
      return;
    } // Prevent closing while processing
    setOpen(newOpen);
  };

  if (readOnly) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={readOnly}>
          <Plus className="mr-2 size-4" />
          Aggiungi Documento
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (isProcessing) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Carica documento</DialogTitle>
          <DialogDescription>
            Seleziona il tipo di documento e carica i file.
          </DialogDescription>
        </DialogHeader>

        <div className="relative space-y-4 py-4">
          {isProcessing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-[1px]">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="mt-2 text-sm font-medium">Salvataggio...</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="document-type" className="text-sm font-medium">Tipo documento</label>
            <Select
              value={documentType}
              onValueChange={value => setDocumentType(value as NewDocument['type'])}
              disabled={isProcessing}
            >
              <SelectTrigger id="document-type">
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FileUploader
            folder="documents"
            targetOrgId={targetOrgId}
            maxFiles={25}
            onUploadComplete={handleUploadComplete}
            onUploadError={error => toast.error(error.message)}
            disabled={isProcessing}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
