import { SignUp } from '@clerk/nextjs';

export const metadata = {
  title: 'Registrati',
  description: 'Registrazione nuovo account.',
};

const SignUpPage = () => (
  <SignUp path="/sign-up" />
);

export default SignUpPage;
