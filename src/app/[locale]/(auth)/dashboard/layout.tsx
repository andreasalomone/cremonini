import { auth } from '@clerk/nextjs/server';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { DashboardHeader } from '@/features/dashboard/DashboardHeader';
import { Env } from '@/libs/Env';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Dashboard',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function DashboardLayout(props: { children: React.ReactNode }) {
  const t = useTranslations('DashboardLayout');
  const { orgId } = await auth();
  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  const menuItems = [
    {
      href: '/dashboard',
      label: t('home'),
    },
    {
      href: '/dashboard/claims',
      label: t('claims'),
    },
    {
      href: '/dashboard/procura',
      label: t('procura'),
    },
    {
      href: '/dashboard/organization-profile/organization-members',
      label: t('members'),
    },
    {
      href: '/dashboard/organization-profile',
      label: t('settings'),
    },
  ];

  if (isSuperAdmin) {
    menuItems.push({
      href: '/dashboard/reports',
      label: t('reports'),
    });
  }

  return (
    <>
      <div className="shadow-md">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-3 py-4">
          <DashboardHeader menu={menuItems} />
        </div>
      </div>

      <div className="min-h-[calc(100vh-72px)] bg-muted">
        <div className="mx-auto max-w-screen-xl px-3 pb-16 pt-6">
          {props.children}
        </div>
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';
