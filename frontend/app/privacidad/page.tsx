import type { Metadata } from 'next';

import LegalPage from '@/components/legal/LegalPage';
import { PRIVACY_SECTIONS } from '@/lib/legal/content';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Albunmanía',
  description: 'Política de tratamiento de datos personales de Albunmanía (Ley 1581 de 2012).',
};

export default function PrivacidadPage() {
  return <LegalPage title="Política de Privacidad" sections={PRIVACY_SECTIONS} testId="privacy-page" />;
}
