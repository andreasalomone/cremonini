import { z } from 'zod';

export const CreateClaimSchema = z.object({
  type: z.enum(['TRANSPORT', 'STOCK', 'DEPOSIT']),
  eventDate: z.date({
    required_error: 'Date is required',
  }),
  carrierName: z.string().optional(),
  estimatedValue: z.string().optional(), // Stored as string, verified by AI later
  description: z.string().optional(),
  documentUrl: z.string().optional(),
});

export type CreateClaimFormValues = z.infer<typeof CreateClaimSchema>;
