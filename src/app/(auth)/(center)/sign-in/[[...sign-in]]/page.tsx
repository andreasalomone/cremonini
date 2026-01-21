import { SignIn } from '@clerk/nextjs';

export const metadata = {
  title: 'Accedi - Cremonini Claims',
  description: 'Accedi alla piattaforma gestione sinistri.',
};

const SignInPage = () => (
  <SignIn path="/sign-in" />
);

export default SignInPage;
