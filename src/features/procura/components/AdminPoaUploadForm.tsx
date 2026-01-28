'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UploadCloud } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createProcura } from '@/features/procura/actions/procura.actions';
import { GLOBAL_CREMONINI_ID, GLOBAL_CREMONINI_NAME } from '@/features/procura/constants';

const FileUploader = dynamic(() => import('@/components/FileUploader').then(mod => mod.FileUploader), {
  ssr: false,
});

const AdminPoaFormSchema = z.object({
  orgId: z.string().min(1, 'Selezionare una società o il gruppo'),
  documentPath: z.string().min(1, 'Caricare un documento'),
});

type AdminPoaFormValues = z.infer<typeof AdminPoaFormSchema>;

type AdminPoaUploadFormProps = {
  organizations: { id: string; name: string }[];
  onSuccess?: () => void;
};

export const AdminPoaUploadForm = ({ organizations, onSuccess }: AdminPoaUploadFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdminPoaFormValues>({
    resolver: zodResolver(AdminPoaFormSchema),
    defaultValues: {
      orgId: '',
      documentPath: '',
    },
  });

  async function onSubmit(data: AdminPoaFormValues) {
    setIsSubmitting(true);
    try {
      await createProcura({
        orgId: data.orgId,
        documentPath: data.documentPath,
        documentUrl: data.documentPath, // Keep for backwards compat
        expiryDate: null,
        saAuthorizedToAct: true, // Defaulting to true for admin uploads
        saAuthorizedToCollect: true,
      });
      toast.success('Procura caricata con successo');
      form.reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('[AdminPoaUploadForm] Failed:', error);
      toast.error('Errore durante il caricamento');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <UploadCloud className="size-5 text-blue-600" />
        <h2 className="text-lg font-semibold">Carica Nuova Procura</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="orgId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Società di destinazione</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona società..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={GLOBAL_CREMONINI_ID} className="font-bold text-blue-700">
                      {GLOBAL_CREMONINI_NAME}
                    </SelectItem>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="documentPath"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Allegato (PDF, Immagini, Office)</FormLabel>
                <FormControl>
                  <FileUploader
                    folder="procura"
                    onUploadComplete={(res) => {
                      const path = res?.[0]?.path;
                      if (path) {
                        field.onChange(path);
                      }
                    }}
                    onUploadError={() => toast.error('Upload fallito')}
                  />
                </FormControl>
                {field.value && (
                  <p className="text-xs text-green-600">✓ Documento pronto</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting
              ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Caricamento...
                  </>
                )
              : (
                  'Salva Procura'
                )}
          </Button>
        </form>
      </Form>
    </div>
  );
};
