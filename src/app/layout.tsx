import type { Metadata } from 'next';
import { IBM_Plex_Serif, Nunito } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/react';
import MobileWarning from '@/components/shared/mobile-warning';

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Goalaris',
  description: 'Write impactful performance review. Achieve all career goals!',
  keywords: ['goals', 'career', 'AI', 'productivity', 'tracking'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSerif.variable} ${nunito.variable}`}>
        <MobileWarning />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
