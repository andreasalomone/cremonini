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
import { addDocuments } from '@/features/documents/actions/documents.actions';
import { DOCUMENT_TYPE_OPTIONS } from '@/features/documents/constants';
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
      const res = await addDocuments(
        claimId,
        results.map(r => ({
          path: r.path,
          filename: r.path.split('/').pop(),
          type: docType,
        })),
      );

      if (res.success) {
        toast.success(res.count > 1 ? 'Documenti caricati' : 'Documento caricato');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error('[DocumentUploader] Failed:', res.error);
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
        onAllUploadsComplete={handleUploadComplete}
        onUploadError={(error) => {
          console.error('Upload error:', error);
        }}
      />
    </div>
  );
};
