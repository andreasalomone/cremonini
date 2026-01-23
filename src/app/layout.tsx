import '@/styles/global.css';

import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Toaster } from 'sonner';

const Agentation = dynamic(() => import('agentation').then(mod => mod.Agentation), {
  ssr: false,
});

export const metadata: Metadata = {
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png',
    },
    {
      rel: 'icon',
      url: '/favicon.ico',
    },
  ],
};

export default function RootLayout(props: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        {/* PRO: Dark mode support for Shadcn UI */}
        {props.children}

        <Toaster />
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </body>
    </html>
  );
}
