'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { FileUploader } from '@/components/FileUploader';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  deleteProcura,
  upsertProcura,
} from '@/features/procura/actions/procura.actions';
import type { PowerOfAttorney } from '@/models/Schema';
import { cn } from '@/utils/Helpers';

const ProcuraFormSchema = z.object({
  documentUrl: z.string().min(1, 'Documento obbligatorio'),
  expiryDate: z.date().optional(),
  saAuthorizedToAct: z.boolean().default(false),
  saAuthorizedToCollect: z.boolean().default(false),
});

type ProcuraFormValues = z.infer<typeof ProcuraFormSchema>;

type ProcuraFormProps = {
  existingProcura?: PowerOfAttorney | null;
  onSuccess?: () => void;
};

export const ProcuraForm = ({ existingProcura, onSuccess }: ProcuraFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<ProcuraFormValues>({
    resolver: zodResolver(ProcuraFormSchema),
    defaultValues: {
      documentUrl: existingProcura?.documentUrl ?? '',
      expiryDate: existingProcura?.expiryDate
        ? new Date(existingProcura.expiryDate)
        : undefined,
      saAuthorizedToAct: existingProcura?.saAuthorizedToAct ?? false,
      saAuthorizedToCollect: existingProcura?.saAuthorizedToCollect ?? false,
    },
  });

  async function onSubmit(data: ProcuraFormValues) {
    setIsSubmitting(true);
    try {
      const formatDate = (d: Date): string => d.toISOString().split('T')[0]!;
      await upsertProcura({
        documentUrl: data.documentUrl,
        expiryDate: data.expiryDate ? formatDate(data.expiryDate) : null,
        saAuthorizedToAct: data.saAuthorizedToAct,
        saAuthorizedToCollect: data.saAuthorizedToCollect,
      });
      toast.success('Procura salvata con successo');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('[ProcuraForm] Failed:', error);
      toast.error('Errore durante il salvataggio');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteProcura();
      toast.success('Procura eliminata');
      form.reset({
        documentUrl: '',
        expiryDate: undefined,
        saAuthorizedToAct: false,
        saAuthorizedToCollect: false,
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('[ProcuraForm] Delete failed:', error);
      toast.error('Errore durante l\'eliminazione');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Procura alle liti</h2>
        {existingProcura && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
            Elimina
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Document Upload */}
          <FormField
            control={form.control}
            name="documentUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documento Procura *</FormLabel>
                <FormControl>
                  <FileUploader
                    endpoint="pdfUploader"
                    onClientUploadComplete={(res) => {
                      const url = res?.[0]?.url;
                      if (url) {
                        field.onChange(url);
                      }
                    }}
                    onUploadError={(error) => {
                      console.error('Upload error:', error);
                      toast.error('Errore upload');
                    }}
                  />
                </FormControl>
                {field.value && (
                  <a
                    href={field.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    Visualizza documento caricato
                  </a>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Expiry Date */}
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data scadenza</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        {field.value
                          ? format(field.value, 'PPP')
                          : <span>Seleziona data</span>}
                        <CalendarIcon className="ml-auto size-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Authorization checkboxes */}
          <FormField
            control={form.control}
            name="saAuthorizedToAct"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="size-4 rounded border-gray-300"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>S&A autorizzata ad agire</FormLabel>
                  <FormDescription>
                    Consente a S&A di agire per conto della società in azioni legali
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="saAuthorizedToCollect"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="size-4 rounded border-gray-300"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>S&A autorizzata a incassare</FormLabel>
                  <FormDescription>
                    Consente a S&A di incassare somme per conto della società
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {existingProcura ? 'Aggiorna Procura' : 'Carica Procura'}
          </Button>
        </form>
      </Form>
    </div>
  );
};
