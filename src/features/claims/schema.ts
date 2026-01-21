import { z } from 'zod';

export const CreateClaimSchema = z.object({
  type: z.enum(['TRANSPORT', 'STOCK', 'DEPOSIT']),
  eventDate: z.date({
    required_error: 'Data sinistro obbligatoria',
  }),
  location: z.string().min(1, 'Luogo evento obbligatorio'),
  ddtCmrNumber: z.string().optional(),
  hasThirdPartyResponsible: z.boolean().default(false),
  carrierName: z.string().optional(),
  estimatedValue: z.string().optional(),
  verifiedDamage: z.string().optional(),
  claimedAmount: z.string().optional(),
  recoveredAmount: z.string().optional(),
  description: z.string().optional(),
  documentPath: z.string().optional(),
});

export type CreateClaimFormValues = z.infer<typeof CreateClaimSchema>;
