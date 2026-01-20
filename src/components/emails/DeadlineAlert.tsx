import * as React from 'react';

type DeadlineAlertProps = {
  claimId: string;
  daysLeft: number;
  type: 'Riserva' | 'Prescrizione';
  claimUrl: string;
};

export const DeadlineAlert: React.FC<DeadlineAlertProps> = ({
  claimId,
  daysLeft,
  type,
  claimUrl,
}: DeadlineAlertProps) => {
  const isUrgent = daysLeft <= 3;
  const color = isUrgent ? '#ef4444' : '#f97316'; // Red vs Orange

  return (
    <div style={{ fontFamily: 'sans-serif', lineHeight: '1.5', color: '#111827' }}>
      <div style={{
        border: `1px solid ${color}`,
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '500px',
        margin: '0 auto',
        backgroundColor: '#fff',
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
          <strong style={{ color: '#000' }}>
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

        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
          È necessario intervenire prima della scadenza per evitare la decadenza del diritto.
        </p>

        <a
          href={claimUrl}
          style={{
            display: 'inline-block',
            backgroundColor: color,
            color: '#ffffff',
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

        <hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />

        <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
          Questa è una notifica automatica da Cremonini Claims Platform.
        </p>
      </div>
    </div>
  );
};
