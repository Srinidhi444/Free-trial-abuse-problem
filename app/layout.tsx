// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'TrialGuard — Device-Aware Trial Protection',
  description: 'A multi-signal risk engine that prevents free-trial abuse.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="bg-[#050505] text-white min-h-screen font-sans antialiased selection:bg-white/20">
        {children}
      </body>
    </html>
  );
}