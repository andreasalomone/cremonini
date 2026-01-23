import * as React from 'react';

type DeadlineAlertProps = {
  claimId: string;
  daysLeft: number;
  type: 'Riserva' | 'Prescrizione';
  claimUrl: string;
};

const COLORS = {
  BRAND_RED: '#ef4444',
  BRAND_ORANGE: '#f97316',
  TEXT_MAIN: '#111827',
  TEXT_MUTED: '#6b7280',
  WHITE: '#ffffff',
  BORDER_LIGHT: '#e5e7eb',
} as const;

export const DeadlineAlert: React.FC<DeadlineAlertProps> = ({
  claimId,
  daysLeft,
  type,
  claimUrl,
}: DeadlineAlertProps) => {
  const isUrgent = daysLeft <= 3;
  const color = isUrgent ? COLORS.BRAND_RED : COLORS.BRAND_ORANGE;

  return (
    <div style={{ fontFamily: 'sans-serif', lineHeight: '1.5', color: COLORS.TEXT_MAIN }}>
      <div style={{
        border: `1px solid ${color}`,
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '500px',
        margin: '0 auto',
        backgroundColor: COLORS.WHITE,
      }}
      >
        <h2 style={{
          marginTop: 0,
          color,
          fontSize: '20px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        >
          ⚠️ Azione Richiesta: Scadenza
          {' '}
          {type}
        </h2>

        <p style={{ fontSize: '16px' }}>
          Il claim
          {' '}
          <strong style={{ color: COLORS.TEXT_MAIN }}>
            #
            {claimId.slice(0, 8)}
          </strong>
          {' '}
          scade tra
          {' '}
          <strong>
            {daysLeft}
            {' '}
            giorni
          </strong>
          .
        </p>

        <p style={{ color: COLORS.TEXT_MUTED, fontSize: '14px', marginBottom: '24px' }}>
          È necessario intervenire prima della scadenza per evitare la decadenza del diritto.
        </p>

        <a
          href={claimUrl}
          style={{
            display: 'inline-block',
            backgroundColor: color,
            color: COLORS.WHITE,
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
            textAlign: 'center',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          Valuta Claim
        </a>

        <hr style={{ margin: '24px 0', borderColor: COLORS.BORDER_LIGHT }} />

        <p style={{ fontSize: '12px', color: COLORS.TEXT_MUTED, textAlign: 'center' }}>
          Questa è una notifica automatica da Cremonini Claims Platform.
        </p>
      </div>
    </div>
  );
};
