import { Button } from '@/components/ui/button';
import { CenteredHero } from '@/features/landing/CenteredHero';
import { Section } from '@/features/landing/Section';

export const Hero = () => {
  return (
    <Section variant="textured" className="py-24 lg:py-36">
      <CenteredHero
        banner={null}
        title={(
          <>
            S&A x
            {' '}
            <span className="italic text-primary">Gruppo Cremonini</span>
            <br />
            Claims Platform
          </>
        )}
        description="Gestione professionale dei sinistri in franchigia aggregata e recuperi globali per il Gruppo Cremonini."
        buttons={
          <>
            <Button size="lg" asChild className="rounded-full px-8 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
              <a href="/sign-in">Accedi ora</a>
            </Button>

            <Button variant="outline" size="lg" asChild className="rounded-full border-slate-200 bg-white/50 px-8 backdrop-blur-sm transition-all hover:bg-slate-50 hover:scale-105 active:scale-95">
              <a href="/sign-up">Registrati</a>
            </Button>
          </>
        }
      />
    </Section>
  );
};
