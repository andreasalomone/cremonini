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
          <li>
            <Link className={cn(buttonVariants({ size: 'sm' }), 'px-5')} href="/sign-in">
              Accedi
            </Link>
          </li>
        )}
      >
        <li>
          <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
            Salomone & Associati - Gruppo Cremonini
          </Link>
        </li>
      </CenteredMenu>
    </Section>
  );
};
