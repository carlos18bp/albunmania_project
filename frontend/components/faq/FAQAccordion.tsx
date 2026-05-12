'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { FAQ_ITEMS, FAQ_AUDIENCE_LABELS, type FaqAudience, type FaqItem } from '@/lib/faq/content';

type Props = {
  /** Override the items (mainly for tests); defaults to the full FAQ. */
  items?: FaqItem[];
};

const AUDIENCE_FILTERS: ('todos' | FaqAudience)[] = [
  'todos', 'general', 'coleccionista', 'comerciante', 'anunciante',
];

export default function FAQAccordion({ items = FAQ_ITEMS }: Props) {
  const [audience, setAudience] = useState<'todos' | FaqAudience>('todos');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = audience === 'todos' ? items : items.filter((it) => it.audience === audience);

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <div className="space-y-4" data-testid="faq-accordion">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por audiencia">
        {AUDIENCE_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            data-testid={`faq-filter-${f}`}
            aria-pressed={audience === f}
            onClick={() => { setAudience(f); setOpenId(null); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              audience === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {f === 'todos' ? 'Todos' : FAQ_AUDIENCE_LABELS[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p data-testid="faq-empty" className="text-sm text-muted-foreground py-8 text-center">
          No hay preguntas para esta categoría.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((it) => {
            const isOpen = openId === it.id;
            return (
              <li key={it.id} className="rounded-xl border border-border bg-card">
                <button
                  type="button"
                  data-testid={`faq-question-${it.id}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${it.id}`}
                  onClick={() => toggle(it.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-foreground"
                >
                  <span>{it.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div
                    id={`faq-answer-${it.id}`}
                    data-testid={`faq-answer-${it.id}`}
                    className="border-t border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    {it.a}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
