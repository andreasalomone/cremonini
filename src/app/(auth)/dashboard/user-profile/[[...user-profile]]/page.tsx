'use client';

import { UserProfile } from '@clerk/nextjs';

import { TitleBar } from '@/features/dashboard/TitleBar';

const UserProfilePage = () => {
  return (
    <>
      <TitleBar
        title="Profilo Utente"
        description="Gestisci le tue informazioni personali"
      />

      <UserProfile
        routing="path"
        path="/dashboard/user-profile"
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

export default UserProfilePage;
