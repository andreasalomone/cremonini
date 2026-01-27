import { z } from 'zod';

export const CreateClaimSchema = z.object({
  type: z.enum([
    'TERRESTRIAL',
    'MARITIME',
    'AIR',
    'RAIL',
    'STOCK_IN_TRANSIT',
  ]),
  state: z.enum(['NATIONAL', 'INTERNATIONAL']),
  eventDate: z.date({
    message: 'Data sinistro obbligatoria',
  }),
  location: z.string().min(1, 'Luogo evento obbligatorio'),
  documentNumber: z.string().optional(),
  hasThirdPartyResponsible: z.boolean(),
  thirdPartyName: z.string().optional(),
  carrierName: z.string().optional(),
  estimatedValue: z.string().optional(),
  verifiedDamage: z.string().optional(),
  claimedAmount: z.string().optional(),
  recoveredAmount: z.string().optional(),
  estimatedRecovery: z.string().optional(),
  description: z.string().optional(),
  documentPaths: z.array(z.string()).optional(),

  // SIT Fields
  stockInboundDate: z.date().optional(),
  stockOutboundDate: z.date().optional(),
  hasStockInboundReserve: z.boolean().optional(),

  // Legal Fields
  hasGrossNegligence: z.boolean().optional(),
  targetOrgId: z.string().optional(),
}).refine((data) => {
  if (data.type === 'STOCK_IN_TRANSIT' && data.stockInboundDate && data.stockOutboundDate) {
    return data.stockInboundDate <= data.stockOutboundDate;
  }
  return true;
}, {
  message: 'La data di uscita non può essere antecedente alla data di ingresso',
  path: ['stockOutboundDate'],
});

export type CreateClaimFormValues = z.infer<typeof CreateClaimSchema>;
