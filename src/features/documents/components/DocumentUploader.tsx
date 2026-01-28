'use client';

import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  addDocument,
  DOCUMENT_TYPE_OPTIONS,
} from '@/features/documents/actions/documents.actions';
import type { NewDocument } from '@/models/Schema';

const FileUploader = dynamic(() => import('@/components/FileUploader').then(mod => mod.FileUploader), {
  ssr: false,
});

type DocumentUploaderProps = {
  claimId: string;
  onSuccess?: () => void;
};

export const DocumentUploader = ({ claimId, onSuccess }: DocumentUploaderProps) => {
  const [docType, setDocType] = useState<NewDocument['type']>('CMR_DDT');
  const [isPending, startTransition] = useTransition();

  const handleUploadComplete = (results: { path: string }[]) => {
    startTransition(async () => {
      try {
        await Promise.all(
          results.map(res => addDocument(claimId, docType, res.path)),
        );
        toast.success(results.length > 1 ? 'Documenti caricati' : 'Documento caricato');
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('[DocumentUploader] Failed:', error);
        toast.error('Errore durante il caricamento dei documenti');
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select
          value={docType}
          onValueChange={val => setDocType(val as NewDocument['type'])}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo documento" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isPending && <Loader2 className="size-4 animate-spin" />}
      </div>

      <FileUploader
        folder="documents"
        onUploadComplete={handleUploadComplete}
        onUploadError={(error) => {
          console.error('Upload error:', error);
        }}
      />
    </div>
  );
};
