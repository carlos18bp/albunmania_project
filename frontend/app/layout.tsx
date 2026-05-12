import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Providers from './providers';
import SponsorSplash from '@/components/sponsor/SponsorSplash';
import SponsorHeaderBand from '@/components/sponsor/SponsorHeaderBand';
import PresencePinger from '@/components/presence/PresencePinger';

export const metadata: Metadata = {
  title: 'Albunmanía — Intercambio de cromos del Mundial 26',
  description:
    'Plataforma comunitaria PWA para intercambio de cromos del Mundial 26 en Colombia y Latinoamérica. Match dual swipe + QR presencial, cierre por WhatsApp.',
  manifest: '/manifest.webmanifest',
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

// Next.js 16 requires themeColor in the Viewport export, not in
// `metadata` — see https://nextjs.org/docs/app/api-reference/functions/generate-viewport.
export const viewport: Viewport = {
  themeColor: '#0b0b10',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <SponsorSplash />
          <PresencePinger />
          <Header />
          <SponsorHeaderBand />
          {children}
          <footer className="border-t border-border mt-16">
            <div className="max-w-6xl mx-auto px-6 py-10 text-sm text-muted-foreground space-y-3">
              <nav aria-label="Enlaces del pie de página" className="flex flex-wrap gap-x-4 gap-y-2">
                <a href="/terminos" className="hover:text-foreground hover:underline">Términos y Condiciones</a>
                <a href="/privacidad" className="hover:text-foreground hover:underline">Política de Privacidad</a>
                <a href="/ayuda" className="hover:text-foreground hover:underline">Centro de Ayuda</a>
                <a href="/manual" className="hover:text-foreground hover:underline">Manual</a>
              </nav>
              <p>&copy; 2026 Albunmanía · No afiliado oficialmente con FIFA o Panini.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
