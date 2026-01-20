import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { CenteredHero } from '@/features/landing/CenteredHero';
import { Section } from '@/features/landing/Section';

export const Hero = () => {
  const t = useTranslations('Hero');

  return (
    <Section className="py-20 lg:py-32">
      <CenteredHero
        banner={null}
        title={t.rich('title', {
          important: chunks => (
            <span className="text-primary">
              {chunks}
            </span>
          ),
        })}
        description={t('description')}
        buttons={(
          <div className="flex flex-col items-center justify-center gap-x-4 gap-y-3 sm:flex-row">
            <a
              className={buttonVariants({ size: 'lg' })}
              href="/sign-in"
            >
              {t('primary_button')}
            </a>

            <a
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
              href="/sign-up"
            >
              {t('secondary_button')}
            </a>
          </div>
        )}
      />
    </Section>
  );
};
