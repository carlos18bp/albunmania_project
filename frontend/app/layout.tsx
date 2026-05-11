import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Providers from './providers';
import SponsorSplash from '@/components/sponsor/SponsorSplash';
import SponsorHeaderBand from '@/components/sponsor/SponsorHeaderBand';

export const metadata: Metadata = {
  title: 'Albunmanía — Intercambio de cromos del Mundial 26',
  description:
    'Plataforma comunitaria PWA para intercambio de cromos del Mundial 26 en Colombia y Latinoamérica. Match dual swipe + QR presencial, cierre por WhatsApp.',
  manifest: '/manifest.webmanifest',
  themeColor: '#0b0b10',
  appleWebApp: {
    capable: true,
    title: 'Albunmanía',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-512.png', sizes: '512x512' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <SponsorSplash />
          <Header />
          <SponsorHeaderBand />
          {children}
          <footer className="border-t border-border mt-16">
            <div className="max-w-6xl mx-auto px-6 py-10 text-sm text-muted-foreground">
              &copy; 2026 Albunmanía · No afiliado oficialmente con FIFA o Panini.
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
