import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TrialGuard Demo',
  description: 'Demo of a multi-signal free-trial abuse prevention algorithm',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">{children}</body>
    </html>
  );
}