import Link from 'next/link';

import { CenteredFooter } from '@/features/landing/CenteredFooter';
import { Section } from '@/features/landing/Section';

import { Logo } from './Logo';

export const Footer = () => {
  return (
    <Section className="pb-16 pt-0">
      <CenteredFooter
        logo={<Logo />}
        name="Salomone & Associati"
        iconList={null}
        legalLinks={null}
      >
        <li>
          <Link href="/">Gruppo Cremonini</Link>
        </li>
      </CenteredFooter>
    </Section>
  );
};
