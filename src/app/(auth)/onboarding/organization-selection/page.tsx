import { OrganizationList } from '@clerk/nextjs';

export const metadata = {
  title: 'Dashboard - Cremonini Claims',
  description: 'Pannello di controllo gestione sinistri.',
};

const OrganizationSelectionPage = () => (
  <div className="flex min-h-screen items-center justify-center">
    <OrganizationList
      afterSelectOrganizationUrl="/dashboard"
      afterCreateOrganizationUrl="/dashboard"
      hidePersonal
      skipInvitationScreen
    />
  </div>
);

export const dynamic = 'force-dynamic';

export default OrganizationSelectionPage;
