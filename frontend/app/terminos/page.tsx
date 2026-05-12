import type { Metadata } from 'next';

import LegalPage from '@/components/legal/LegalPage';
import { TERMS_SECTIONS } from '@/lib/legal/content';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Albunmanía',
  description: 'Términos y condiciones de uso de Albunmanía — comunidad de intercambio de cromos.',
};

export default function TerminosPage() {
  return <LegalPage title="Términos y Condiciones" sections={TERMS_SECTIONS} testId="terms-page" />;
}
