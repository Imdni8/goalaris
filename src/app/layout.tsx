import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/react';
import MobileWarning from '@/components/shared/mobile-warning';

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
      <body>
        <MobileWarning />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
