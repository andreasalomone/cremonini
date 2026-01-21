import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { getProcura } from '@/features/procura/actions/procura.actions';
import { ProcuraForm } from '@/features/procura/components/ProcuraForm';

// Prevent static pre-rendering - this page requires runtime database access
export const dynamic = 'force-dynamic';

export default async function ProcuraPage() {
  const { orgId } = await auth();

  if (!orgId) {
    redirect('/sign-in');
  }

  const existingProcura = await getProcura();

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestione Procura</h1>
        <p className="text-muted-foreground">
          Carica e gestisci la procura alle liti per la tua società.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <ProcuraForm existingProcura={existingProcura} />
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="text-lg font-semibold">Informazioni sulla Procura</h3>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>
                La **Procura alle liti** è il documento con cui la società autorizza S&A ad agire legalmente e a incassare per conto della società.
              </p>
              <ul className="list-disc space-y-2 pl-4">
                <li>Deve essere firmata dal legale rappresentante.</li>
                <li>Una volta caricata, si applica a tutti i sinistri aperti e futuri.</li>
                <li>S&A potrà visualizzare lo stato della procura per ogni pratica.</li>
              </ul>
            </div>
          </div>

          {!existingProcura && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-yellow-800">Attenzione</h3>
              <p className="mt-2 text-sm text-yellow-700">
                Non hai ancora caricato nessuna procura. Carica il documento per permettere a S&A di gestire le tue pratiche legalmente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
