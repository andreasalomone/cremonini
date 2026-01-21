import { buttonVariants } from '@/components/ui/buttonVariants';
import { CenteredHero } from '@/features/landing/CenteredHero';
import { Section } from '@/features/landing/Section';

export const Hero = () => {
  return (
    <Section className="py-20 lg:py-32">
      <CenteredHero
        banner={null}
        title={(
          <>
            S&A x
            {' '}
            <span className="text-primary">Gruppo Cremonini</span>
            {' '}
            Claims Platform
          </>
        )}
        description="Gestione sinistri in franchigia aggregata e recuperi per Gruppo Cremonini."
        buttons={(
          <div className="flex flex-col items-center justify-center gap-x-4 gap-y-3 sm:flex-row">
            <a
              className={buttonVariants({ size: 'lg' })}
              href="/sign-in"
            >
              Accedi
            </a>

            <a
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
              href="/sign-up"
            >
              Registrati
            </a>
          </div>
        )}
      />
    </Section>
  );
};
