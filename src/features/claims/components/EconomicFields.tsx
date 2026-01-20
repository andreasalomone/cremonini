'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';

const EconomicFieldsSchema = z.object({
  estimatedValue: z.string().optional(),
  verifiedDamage: z.string().optional(),
  claimedAmount: z.string().optional(),
  recoveredAmount: z.string().optional(),
});

type EconomicFieldsValues = z.infer<typeof EconomicFieldsSchema>;

type EconomicFieldsProps = {
  claimId: string;
  initialValues?: Partial<EconomicFieldsValues>;
  onSave: (claimId: string, data: EconomicFieldsValues) => Promise<{ success: boolean }>;
};

export const EconomicFields = ({
  claimId,
  initialValues,
  onSave,
}: EconomicFieldsProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EconomicFieldsValues>({
    resolver: zodResolver(EconomicFieldsSchema),
    defaultValues: {
      estimatedValue: initialValues?.estimatedValue ?? '',
      verifiedDamage: initialValues?.verifiedDamage ?? '',
      claimedAmount: initialValues?.claimedAmount ?? '',
      recoveredAmount: initialValues?.recoveredAmount ?? '',
    },
  });

  async function onSubmit(data: EconomicFieldsValues) {
    setIsSubmitting(true);
    try {
      const result = await onSave(claimId, data);
      if (result.success) {
        toast.success('Dati economici salvati');
      } else {
        toast.error('Errore durante il salvataggio');
      }
    } catch {
      toast.error('Errore imprevisto');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-4 text-sm font-semibold">Gestione Economica</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="estimatedValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Danno stimato (€)</FormLabel>
                  <FormControl>
                    <Input placeholder="1.000,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="verifiedDamage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Danno accertato (€)</FormLabel>
                  <FormControl>
                    <Input placeholder="800,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="claimedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importo reclamato (€)</FormLabel>
                  <FormControl>
                    <Input placeholder="800,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recoveredAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importo recuperato (€)</FormLabel>
                  <FormControl>
                    <Input placeholder="600,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Salva
          </Button>
        </form>
      </Form>
    </div>
  );
};
