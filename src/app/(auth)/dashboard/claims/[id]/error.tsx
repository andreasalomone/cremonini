'use client';

import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[ClaimDetailError] Unhandled error:', error);
  }, [error]);

  return (
    <div className="container flex h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md border-destructive/20 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <CardTitle className="text-xl font-bold text-destructive">
            Si è verificato un errore
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Impossibile caricare i dettagli del sinistro. Questo potrebbe essere dovuto a un problema temporaneo o a dati mancanti.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-muted/50 p-3 text-left">
              <p className="mb-1 text-xs font-semibold text-foreground">Dettagli tecnici:</p>
              <code className="text-[10px] text-muted-foreground">
                {error.message || 'Errore sconosciuto'}
              </code>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => reset()} className="w-full sm:w-auto">
            <RotateCcw className="mr-2 size-4" />
            Riprova
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/claims">
              <Home className="mr-2 size-4" />
              Torna alla lista
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
