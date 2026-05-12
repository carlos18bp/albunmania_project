import type { Metadata } from 'next';

import FAQAccordion from '@/components/faq/FAQAccordion';

export const metadata: Metadata = {
  title: 'Centro de Ayuda | Albunmanía',
  description: 'Preguntas frecuentes sobre cómo intercambiar cromos, la verificación de cuenta, los no-shows y la moderación en Albunmanía.',
};

export default function AyudaPage() {
  return (
    <main data-testid="help-page" className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Centro de Ayuda</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preguntas frecuentes de coleccionistas, comerciantes y anunciantes. ¿No encuentras lo que buscas? Escríbenos desde el contacto de los Términos.
        </p>
      </header>
      <FAQAccordion />
    </main>
  );
}
