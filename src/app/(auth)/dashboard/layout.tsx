import { auth } from '@clerk/nextjs/server';

import { DashboardHeader } from '@/features/dashboard/DashboardHeader';
import { Env } from '@/libs/Env';

export const metadata = {
  title: 'Dashboard - Cremonini Claims',
  description: 'Pannello di controllo gestione sinistri.',
};

export default async function DashboardLayout(props: { children: React.ReactNode }) {
  const { orgId } = await auth();
  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  const menuItems = [
    {
      href: '/dashboard',
      label: 'Home',
    },
    {
      href: '/dashboard/claims',
      label: 'Sinistri',
    },
    {
      href: '/dashboard/procura',
      label: 'Procura',
    },
    {
      href: '/dashboard/organization-profile/organization-members',
      label: 'Utenti',
    },
  ];

  if (isSuperAdmin) {
    menuItems.push({
      href: '/dashboard/reports',
      label: 'Reportistica',
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted">
      <header className="sticky top-0 z-50 bg-background shadow-md">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between p-4">
          <DashboardHeader menu={menuItems} />
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-screen-xl px-4 pb-16 pt-6">
          {props.children}
        </div>
      </main>
    </div>
  );
}

export const dynamic = 'force-dynamic';
