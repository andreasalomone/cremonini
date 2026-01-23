export const AVAILABLE_COLUMNS: Record<string, string> = {
  id: 'ID Sinistro',
  orgId: 'ID Società',
  status: 'Stato',
  type: 'Tipologia',
  state: 'Stato (Naz/Int)',
  eventDate: 'Data Evento',
  location: 'Luogo',
  carrierName: 'Vettore',
  estimatedValue: 'Valore Stimato',
  verifiedDamage: 'Danno Verificato',
  claimedAmount: 'Importo Reclamato',
  recoveredAmount: 'Recuperato',
  createdAt: 'Data Creazione',
  updatedAt: 'Ultima Modifica',
  description: 'Descrizione',
};

export const DATA_EXPORT_COLUMNS = Object.keys(AVAILABLE_COLUMNS);
