'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { FileUploader } from '@/components/FileUploader';
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

type DocumentUploadDialogProps = {
  claimId: string;
};

export function DocumentUploadDialog({ claimId }: DocumentUploadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [documentType, setDocumentType] = useState<NewDocument['type']>('CMR_DDT');

  const handleUploadComplete = async (files: { path: string }[]) => {
    try {
      for (const file of files) {
        const filename = file.path.split('/').pop() || 'documento';
        await addDocument(claimId, documentType, file.path, filename);
      }
      toast.success(`${files.length} documento/i caricato/i`);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Errore durante il salvataggio del documento');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 size-4" />
          Aggiungi Documento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Carica documento</DialogTitle>
          <DialogDescription>
            Seleziona il tipo di documento e carica i file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="document-type" className="text-sm font-medium">Tipo documento</label>
            <Select
              value={documentType}
              onValueChange={value => setDocumentType(value as NewDocument['type'])}
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
            onUploadComplete={handleUploadComplete}
            onUploadError={error => toast.error(error.message)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
