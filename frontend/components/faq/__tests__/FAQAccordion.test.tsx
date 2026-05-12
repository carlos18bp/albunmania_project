/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

import FAQAccordion from '../FAQAccordion';
import type { FaqItem } from '../../../lib/faq/content';

const items: FaqItem[] = [
  { id: 'q1', q: '¿Qué es Albunmanía?', a: 'Una comunidad de intercambio de cromos.', audience: 'general' },
  { id: 'q2', q: '¿Cómo marco mis cromos?', a: 'Tocá la lámina: 1, 2+, long-press borra.', audience: 'coleccionista' },
  { id: 'q3', q: '¿Cómo aparezco en el mapa?', a: 'El equipo da de alta a los comerciantes.', audience: 'comerciante' },
];

describe('FAQAccordion', () => {
  it('renders one collapsible question per item, all closed by default', () => {
    render(<FAQAccordion items={items} />);

    expect(screen.getByTestId('faq-question-q1')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('faq-question-q2')).toBeInTheDocument();
    expect(screen.getByTestId('faq-question-q3')).toBeInTheDocument();
    expect(screen.queryByTestId('faq-answer-q1')).not.toBeInTheDocument();
  });

  it('opens an answer when its question is clicked', () => {
    render(<FAQAccordion items={items} />);

    fireEvent.click(screen.getByTestId('faq-question-q1'));

    expect(screen.getByTestId('faq-question-q1')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('faq-answer-q1')).toHaveTextContent('Una comunidad de intercambio de cromos.');
  });

  it('keeps only one answer open at a time', () => {
    render(<FAQAccordion items={items} />);

    fireEvent.click(screen.getByTestId('faq-question-q1'));
    fireEvent.click(screen.getByTestId('faq-question-q2'));

    expect(screen.queryByTestId('faq-answer-q1')).not.toBeInTheDocument();
    expect(screen.getByTestId('faq-answer-q2')).toBeInTheDocument();
  });

  it('closes an open answer when its question is clicked again', () => {
    render(<FAQAccordion items={items} />);
    const q = screen.getByTestId('faq-question-q1');

    fireEvent.click(q);
    fireEvent.click(q);

    expect(screen.queryByTestId('faq-answer-q1')).not.toBeInTheDocument();
  });

  it('filters the list by audience', () => {
    render(<FAQAccordion items={items} />);

    fireEvent.click(screen.getByTestId('faq-filter-comerciante'));

    expect(screen.getByTestId('faq-question-q3')).toBeInTheDocument();
    expect(screen.queryByTestId('faq-question-q1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('faq-question-q2')).not.toBeInTheDocument();
  });

  it('shows the empty state when no item matches the audience filter', () => {
    render(<FAQAccordion items={[items[1]]} />); // only a coleccionista item

    fireEvent.click(screen.getByTestId('faq-filter-anunciante'));

    expect(screen.getByTestId('faq-empty')).toBeInTheDocument();
  });
});
