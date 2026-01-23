'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ChevronDownIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FileUploader } from '@/components/FileUploader';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
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
import {
  CLAIM_STATE_OPTIONS,
  CLAIM_TYPE_OPTIONS,
} from '@/features/claims/constants';
import type { CreateClaimFormValues } from '@/features/claims/schema';
import { CreateClaimSchema } from '@/features/claims/schema';
import { calculateDeadlines } from '@/libs/deadline-logic';

export const ClaimForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventDatePopoverOpen, setEventDatePopoverOpen] = useState(false);
  const [inboundDatePopoverOpen, setInboundDatePopoverOpen] = useState(false);
  const [outboundDatePopoverOpen, setOutboundDatePopoverOpen] = useState(false);

  const form = useForm<CreateClaimFormValues>({
    resolver: zodResolver(CreateClaimSchema),
    defaultValues: {
      type: 'TERRESTRIAL',
      state: 'NATIONAL',
      location: '',
      documentNumber: '',
      hasThirdPartyResponsible: true, // Default for TERRESTRIAL
      thirdPartyName: '',
      carrierName: '',
      estimatedValue: '',
      estimatedRecovery: '',
      description: '',
      hasGrossNegligence: false,
      hasStockInboundReserve: false,
    },
  });

  const watchType = form.watch('type');
  const watchState = form.watch('state');
  const watchDate = form.watch('eventDate');
  const watchGrossNegligence = form.watch('hasGrossNegligence');
  const watchInboundDate = form.watch('stockInboundDate');
  const watchOutboundDate = form.watch('stockOutboundDate');
  const watchInboundReserve = form.watch('hasStockInboundReserve');
  const watchHasThirdParty = form.watch('hasThirdPartyResponsible');

  const deadlines = watchDate
    ? calculateDeadlines({
      eventDate: watchDate,
      type: watchType,
      state: watchState,
      hasGrossNegligence: watchGrossNegligence,
      stockInboundDate: watchInboundDate,
      stockOutboundDate: watchOutboundDate,
      hasStockInboundReserve: watchInboundReserve,
    })
    : null;

  async function onSubmit(data: CreateClaimFormValues) {
    setIsSubmitting(true);
    try {
      await createClaim(data);
      toast.success('Sinistro creato con successo');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('[ClaimForm] Failed:', error);
      toast.error('Errore durante la creazione del sinistro');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Type Selection */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipologia *</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    // Default logic: CHECKED (Sì) se Trasporto (any besides SIT); UNCHECKED (No) se Stock in Transit.
                    const isTransport = val !== 'STOCK_IN_TRANSIT';
                    form.setValue('hasThirdPartyResponsible', isTransport);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona tipologia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CLAIM_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* State (National/International) */}
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ambito *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona ambito" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CLAIM_STATE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Colpa Grave (for Terrestrial/International) */}
        {watchType === 'TERRESTRIAL' && watchState === 'INTERNATIONAL' && (
          <FormField
            control={form.control}
            name="hasGrossNegligence"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-orange-200 bg-orange-50 p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-orange-900">Sospetta Colpa Grave (Dolo)</FormLabel>
                  <FormDescription className="text-orange-700">
                    Estende la prescrizione a 3 anni (Art. 32 CMR)
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        )}

        {/* Stock in Transit Sub-fields */}
        {watchType === 'STOCK_IN_TRANSIT' && (
          <div className="space-y-4 rounded-md border border-blue-100 bg-blue-50 p-4">
            <h4 className="text-sm font-semibold text-blue-900">Dettagli Giacenza (SIT)</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stockInboundDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Ingresso Magazzino</FormLabel>
                    <Popover open={inboundDatePopoverOpen} onOpenChange={setInboundDatePopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full text-left font-normal"
                          >
                            {field.value ? format(field.value, 'dd/MM/yyyy') : <span>Scegli</span>}
                            <ChevronDownIcon className="ml-auto size-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setInboundDatePopoverOpen(false);
                          }}
                          disabled={date => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stockOutboundDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Uscita Magazzino</FormLabel>
                    <Popover open={outboundDatePopoverOpen} onOpenChange={setOutboundDatePopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full text-left font-normal"
                          >
                            {field.value ? format(field.value, 'dd/MM/yyyy') : <span>Scegli</span>}
                            <ChevronDownIcon className="ml-auto size-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setOutboundDatePopoverOpen(false);
                          }}
                          disabled={date => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="hasStockInboundReserve"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Riserva formulata all'ingresso</FormLabel>
                    <FormDescription className="text-xs">
                      Se non spuntato, il danno si presume avvenuto durante la giacenza (Deposito)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Date Picker */}
        <FormField
          control={form.control}
          name="eventDate"
          render={({ field }) => {
            const errors = form.formState.errors.eventDate
              ? [{ message: String(form.formState.errors.eventDate.message ?? '') }]
              : undefined;

            return (
              <Field data-invalid={!!errors}>
                <FieldLabel htmlFor="eventDate">Data evento (consegna merce) *</FieldLabel>
                <Popover open={eventDatePopoverOpen} onOpenChange={setEventDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="eventDate"
                      type="button"
                      data-empty={!field.value}
                      className="w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
                    >
                      {field.value ? format(field.value, 'dd MMMM yyyy') : <span>Seleziona data</span>}
                      <ChevronDownIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="pointer-events-auto z-[9999] w-auto p-0" align="start">
                    <Calendar
                      captionLayout="label"
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        if (date) {
                          setEventDatePopoverOpen(false);
                        }
                      }}
                      defaultMonth={field.value ?? undefined}
                      disabled={date => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {deadlines && (
                  <FieldDescription className="mt-2 space-y-1 rounded-md bg-muted p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">📅 Scadenza Riserva:</span>
                      <span className="font-medium text-foreground">
                        {deadlines.reserveDeadline ? format(deadlines.reserveDeadline, 'dd/MM/yyyy') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-1">
                      <span className="text-muted-foreground">
                        ⚖️ Scadenza
                        {deadlines.isDecadence ? 'Decadenza' : 'Prescrizione'}
                        :
                      </span>
                      <span className={`font-bold ${deadlines.isDecadence ? 'text-red-600' : 'text-foreground'}`}>
                        {format(deadlines.prescriptionDeadline, 'dd/MM/yyyy')}
                        {deadlines.isDecadence && ' (TERMINE PERENTORIO)'}
                      </span>
                    </div>
                    {deadlines.sitWarning && (
                      <div className="mt-1 border-t pt-1 font-bold text-orange-600">
                        ⚠
                        {' '}
                        {deadlines.sitWarning}
                      </div>
                    )}
                  </FieldDescription>
                )}
                <FieldError errors={errors} />
              </Field>
            );
          }}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Document Number - RENAMED FIELD */}
          <FormField
            control={form.control}
            name="documentNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NUMERO DOCUMENTO</FormLabel>
                <FormControl>
                  <Input placeholder="es. DDT-2026-001234, CMR-456..." {...field} />
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
        </div>

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
                <FormDescription className="text-xs">
                  Spuntare se sono presenti terzi potenzialmente responsabili del danno
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Conditional Third Party Name */}
        {watchHasThirdParty && (
          <FormField
            control={form.control}
            name="thirdPartyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Terzo Responsabile</FormLabel>
                <FormControl>
                  <Input placeholder="Nome della società o persona..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          {/* Estimated Recovery (Stima recupero) */}
          <FormField
            control={form.control}
            name="estimatedRecovery"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stima recupero (€)</FormLabel>
                <FormControl>
                  <Input placeholder="500,00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
