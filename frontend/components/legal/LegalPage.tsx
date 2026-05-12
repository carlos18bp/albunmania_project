import type { LegalSection } from '@/lib/legal/content';
import { LEGAL_DRAFT_NOTICE, LEGAL_LAST_UPDATED } from '@/lib/legal/content';

type Props = {
  title: string;
  sections: LegalSection[];
  testId: string;
};

/** Generic renderer for a legal document made of {heading, body[]} sections. */
export default function LegalPage({ title, sections, testId }: Props) {
  return (
    <main data-testid={testId} className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">Última actualización: {LEGAL_LAST_UPDATED}</p>
      </header>

      <p
        data-testid="legal-draft-notice"
        role="note"
        className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
      >
        {LEGAL_DRAFT_NOTICE}
      </p>

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.heading} className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
            {section.body.map((paragraph, idx) => (
              <p key={idx} className="text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
