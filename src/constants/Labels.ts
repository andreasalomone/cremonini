/**
 * Centralized UI labels and strings.
 * Use these constants instead of hardcoded strings in JSX to ensure consistency
 * and simplify potential future internationalization.
 */
export const LABELS = {
  COMMON: {
    ACTIONS: 'Actions',
    SUBMIT: 'Invia',
    CANCEL: 'Annulla',
    CLOSE: 'Chiudi',
    LOADING: 'Caricamento...',
    NO_DATA: 'Nessun dato trovato',
  },
  PROCURA: {
    ORGANIZATION: 'Organizzazione',
    STATUS: 'Stato Procura',
    EXPIRY: 'Scadenza',
    UPLOADED: 'Caricata',
    MISSING: 'Mancante',
    EXPIRED: 'Scaduta',
    VIEW_DOCUMENT: 'Visualizza Documento',
    NO_ORGS: 'Nessuna organizzazione trovata.',
  },
  CLAIMS: {
    ID: 'ID Claim',
    TYPE: 'Tipologia',
    STATE: 'Stato',
    STATUS: 'Status',
    CARRIER: 'Vettore',
    CREATED_AT: 'Creato il',
    VIEW_DETAIL: 'Dettaglio',
    OPEN: 'Aperto',
    CLOSED: 'Chiuso',
    LIFECYCLE: 'Lifecycle Sinistri',
    OPEN_CLAIMS: 'Sinistri Aperti',
    CLOSED_CLAIMS: 'Sinistri Chiusi',
    ACTIVE_PERCENTAGE: 'dei sinistri totali sono attualmente attivi.',
  },
} as const;
