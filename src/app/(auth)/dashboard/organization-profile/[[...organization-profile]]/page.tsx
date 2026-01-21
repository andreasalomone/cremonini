'use client';

import { OrganizationProfile } from '@clerk/nextjs';

import { TitleBar } from '@/features/dashboard/TitleBar';

const OrganizationProfilePage = () => {
  return (
    <>
      <TitleBar
        title="Azienda"
        description="Gestione dati aziendali"
      />

      <OrganizationProfile
        routing="path"
        path="/dashboard/organization-profile"
        afterLeaveOrganizationUrl="/onboarding/organization-selection"
        appearance={{
          elements: {
            rootBox: 'w-full',
            cardBox: 'w-full flex',
          },
        }}
      />
    </>
  );
};

export default OrganizationProfilePage;
