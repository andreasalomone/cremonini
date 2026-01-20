import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SocietyReport } from '@/features/reports/actions/reports.actions';

export const SocietyReportTable = ({ data }: { data: SocietyReport[] }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Società (Org ID)</TableHead>
          <TableHead className="text-right">Sinistri Totali</TableHead>
          <TableHead className="text-right">Valore Stimato (€)</TableHead>
          <TableHead className="text-right">Recuperato (€)</TableHead>
          <TableHead className="text-right">Ratio di Recupero</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0
          ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nessun dato disponibile.
                </TableCell>
              </TableRow>
            )
          : (
              data.map(row => (
                <TableRow key={row.orgId}>
                  <TableCell className="font-medium">{row.orgId}</TableCell>
                  <TableCell className="text-right">{row.totalClaims}</TableCell>
                  <TableCell className="text-right">
                    {row.estimatedTotal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.recoveredTotal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold ${row.recoveryRate > 0.5 ? 'text-green-600' : 'text-orange-600'}`}>
                      {(row.recoveryRate * 100).toFixed(1)}
                      %
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
      </TableBody>
    </Table>
  );
};
