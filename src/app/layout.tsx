import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Goalaris',
  description: 'AI-powered career goal tracking for enterprise professionals',
  keywords: ['goals', 'career', 'AI', 'productivity', 'tracking'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
