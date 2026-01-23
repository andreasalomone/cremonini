'use client';

import { useUser } from '@clerk/nextjs';
import { Download } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { exportReportData } from '@/features/reports/actions/export.actions';
import { AVAILABLE_COLUMNS, DATA_EXPORT_COLUMNS } from '@/features/reports/constants';
import { checkIsSuperAdmin } from '@/libs/auth-utils';

export function ReportExportDialog() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // State
  const [scope, setScope] = useState<'GLOBAL' | 'SINGLE_ORG'>('SINGLE_ORG');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DATA_EXPORT_COLUMNS);

  // Derive Admin status
  const orgId = user?.organizationMemberships[0]?.organization?.id;
  const isSuperAdmin = checkIsSuperAdmin(orgId);

  const handleSelectAll = (checked: boolean) => {
    setSelectedColumns(checked ? DATA_EXPORT_COLUMNS : []);
  };

  const handleColumnToggle = (key: string) => {
    setSelectedColumns(prev =>
      prev.includes(key)
        ? prev.filter(c => c !== key)
        : [...prev, key],
    );
  };

  const handleExport = () => {
    if (selectedColumns.length === 0) {
      toast.error('Seleziona almeno una colonna da esportare.');
      return;
    }

    startTransition(async () => {
      try {
        const base64 = await exportReportData({
          scope: isSuperAdmin ? scope : 'SINGLE_ORG',
          columns: selectedColumns,
          orgIdFilter: scope === 'SINGLE_ORG' ? orgId : undefined,
        });

        // Trigger Download
        const link = document.createElement('a');
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
        link.download = `Report_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Export completato con successo!');
        setOpen(false);
      } catch (error) {
        console.error(error);
        toast.error('Errore durante l\'export dei dati.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="size-4" />
          Esporta Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Esporta Report</DialogTitle>
          <DialogDescription>
            Seleziona i dati da includere nel file Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Admin Scope Selection */}
          {isSuperAdmin && (
            <div className="space-y-4">
              <Label className="text-base">Ambito Export</Label>
              <RadioGroup
                defaultValue="SINGLE_ORG"
                value={scope}
                onValueChange={v => setScope(v as any)}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SINGLE_ORG" id="scope-single" />
                  <Label htmlFor="scope-single">Questa Organizzazione</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="GLOBAL" id="scope-global" />
                  <Label htmlFor="scope-global">Tutto il Gruppo Cremonini (Global)</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Columns Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Dati da Includere</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedColumns.length === DATA_EXPORT_COLUMNS.length}
                  onCheckedChange={c => handleSelectAll(!!c)}
                />
                <Label htmlFor="select-all" className="cursor-pointer text-sm font-normal text-muted-foreground">
                  Seleziona tutti
                </Label>
              </div>
            </div>

            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="grid grid-cols-2 gap-4">
                {DATA_EXPORT_COLUMNS.map(key => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`col-${key}`}
                      checked={selectedColumns.includes(key)}
                      onCheckedChange={() => handleColumnToggle(key)}
                    />
                    <Label htmlFor={`col-${key}`} className="cursor-pointer text-sm font-normal">
                      {AVAILABLE_COLUMNS[key as keyof typeof AVAILABLE_COLUMNS]}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annulla</Button>
          <Button onClick={handleExport} disabled={isPending}>
            {isPending ? 'Generazione...' : 'Scarica Excel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
