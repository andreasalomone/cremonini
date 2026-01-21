'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FileUploader } from '@/components/FileUploader';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createClaim } from '@/features/claims/actions/claims.actions';
import type { CreateClaimFormValues } from '@/features/claims/schema';
import { CreateClaimSchema } from '@/features/claims/schema';
import { calculateDeadlines } from '@/libs/deadline-logic';
import { cn } from '@/utils/Helpers';

export const ClaimForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateClaimFormValues>({
    resolver: zodResolver(CreateClaimSchema),
    defaultValues: {
      type: 'TRANSPORT',
      location: '',
      ddtCmrNumber: '',
      hasThirdPartyResponsible: false,
      carrierName: '',
      estimatedValue: '',
      description: '',
    },
  });

  const watchType = form.watch('type');
  const watchDate = form.watch('eventDate');

  const deadlines = watchDate ? calculateDeadlines(watchDate, watchType) : null;

  async function onSubmit(data: CreateClaimFormValues) {
    setIsSubmitting(true);
    try {
      await createClaim(data);
      toast.success('Sinistro creato con successo');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // ✅ AUDIT FIX: Fail loud - show user feedback
      console.error('[ClaimForm] Failed:', error);
      toast.error('Errore durante la creazione del sinistro');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Type Selection */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipologia *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipologia" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="TRANSPORT">Trasporto</SelectItem>
                  <SelectItem value="STOCK">Stock in transit</SelectItem>
                  <SelectItem value="DEPOSIT">Deposito / giacenza</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Picker */}
        <FormField
          control={form.control}
          name="eventDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data sinistro *</FormLabel>
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
                        ? (
                            format(field.value, 'PPP')
                          )
                        : (
                            <span>Seleziona data</span>
                          )}
                      <CalendarIcon className="ml-auto size-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={date =>
                      date > new Date() || date < new Date('1900-01-01')}
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {deadlines && (
                <div className="mt-2 space-y-1 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                  <p>
                    📅 Scadenza Riserva:
                    {' '}
                    {deadlines.reserveDeadline ? format(deadlines.reserveDeadline, 'PPP') : 'N/A'}
                  </p>
                  <p>
                    ⚖️ Prescrizione:
                    {' '}
                    {format(deadlines.prescriptionDeadline, 'PPP')}
                  </p>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location - NEW REQUIRED FIELD */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Luogo evento *</FormLabel>
              <FormControl>
                <Input placeholder="es. Milano, Autostrada A1 km 123..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* DDT/CMR Number - NEW FIELD */}
        <FormField
          control={form.control}
          name="ddtCmrNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero DDT / CMR</FormLabel>
              <FormControl>
                <Input placeholder="es. DDT-2026-001234" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Carrier Name */}
        <FormField
          control={form.control}
          name="carrierName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vettore / Depositario</FormLabel>
              <FormControl>
                <Input placeholder="DHL, FedEx, Bartolini..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Has Third Party Responsible - NEW FIELD */}
        <FormField
          control={form.control}
          name="hasThirdPartyResponsible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Presenza terzi responsabili</FormLabel>
                <FormDescription>
                  Spuntare se sono presenti terzi potenzialmente responsabili del danno
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Estimated Value */}
        <FormField
          control={form.control}
          name="estimatedValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valore stimato del danno (€)</FormLabel>
              <FormControl>
                <Input placeholder="1.000,00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrizione dell'evento</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrivi la dinamica del sinistro..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload */}
        <FormField
          control={form.control}
          name="documentPath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Documento di supporto (PDF/Immagine)</FormLabel>
              <FormControl>
                <FileUploader
                  folder="claims"
                  onUploadComplete={(res) => {
                    const path = res?.[0]?.path;
                    if (path) {
                      field.onChange(path);
                    }
                  }}
                  onUploadError={(error) => {
                    console.error(error);
                  }}
                />
              </FormControl>
              {field.value && (
                <div className="text-sm text-green-600">
                  ✓ File caricato con successo
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Crea Sinistro
        </Button>
      </form>
    </Form>
  );
};
