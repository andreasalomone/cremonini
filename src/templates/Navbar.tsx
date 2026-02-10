import Link from 'next/link';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { CenteredMenu } from '@/features/landing/CenteredMenu';
import { Section } from '@/features/landing/Section';
import { cn } from '@/utils/Helpers';

import { Logo } from './Logo';

export const Navbar = () => {
  return (
    <Section className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/60 px-3 py-4 backdrop-blur-xl">
      <CenteredMenu
        logo={<Logo />}
        rightMenu={(
          <>
            <li className="ml-1 mr-4" data-fade>
              <Link href="/sign-in" className="text-sm font-medium transition-colors hover:text-primary">
                Accedi
              </Link>
            </li>
            <li>
              <Link className={cn(buttonVariants({ size: 'sm' }), 'px-5')} href="/sign-up">
                Inizia ora
              </Link>
            </li>
          </>
        )}
      >
        <li>
          <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
            Gruppo Cremonini
          </Link>
        </li>
      </CenteredMenu>
    </Section>
  );
};
