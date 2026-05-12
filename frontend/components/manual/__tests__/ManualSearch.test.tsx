/// <reference types="jest" />
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { BookOpen } from 'lucide-react';

import ManualSearch from '../ManualSearch';
import type { ManualSection } from '../../../lib/manual/types';

const sections: ManualSection[] = [
  {
    id: 'collector',
    title: { es: 'Coleccionista', en: 'Collector' },
    icon: BookOpen,
    processes: [
      {
        id: 'match-swipe',
        title: { es: 'Match por swipe', en: 'Swipe match' },
        summary: { es: 'Desliza para encontrar coleccionistas cerca.', en: 'Swipe to find nearby collectors.' },
        why: { es: '', en: '' },
        steps: { es: ['Abre /match'], en: ['Open /match'] },
        route: '/match',
        keywords: ['match', 'swipe', 'proximidad'],
      },
      {
        id: 'qr-presencial',
        title: { es: 'QR presencial', en: 'In-person QR' },
        summary: { es: 'Escanea el QR del otro coleccionista.', en: 'Scan the other collector QR.' },
        why: { es: '', en: '' },
        steps: { es: ['Abre /match/qr'], en: ['Open /match/qr'] },
        route: '/match/qr',
        keywords: ['qr', 'presencial', 'offline'],
      },
    ],
  },
];

let originalScrollIntoView: typeof Element.prototype.scrollIntoView;

beforeEach(() => {
  originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
  Element.prototype.scrollIntoView = originalScrollIntoView;
});

describe('ManualSearch', () => {
  it('renders a searchbox with no results dropdown initially', () => {
    render(<ManualSearch locale="es" sections={sections} />);

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows matching processes once the user types a query', async () => {
    render(<ManualSearch locale="es" sections={sections} />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'swipe' } });

    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByText('Match por swipe')).toBeInTheDocument();
  });

  it('shows the empty state for a query that matches nothing', async () => {
    render(<ManualSearch locale="es" sections={sections} />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzzz' } });

    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByText('Sin resultados')).toBeInTheDocument();
  });

  it('clears the query (and the dropdown) when a result is selected', async () => {
    render(<ManualSearch locale="es" sections={sections} />);
    const searchbox = screen.getByRole('searchbox') as HTMLInputElement;
    fireEvent.change(searchbox, { target: { value: 'swipe' } });

    const option = await screen.findByRole('option', { name: /Match por swipe/i });
    fireEvent.click(option);

    expect(searchbox.value).toBe('');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).not.toBeUndefined();
  });

  it('clears the query via the clear button', () => {
    render(<ManualSearch locale="es" sections={sections} />);
    const searchbox = screen.getByRole('searchbox') as HTMLInputElement;
    fireEvent.change(searchbox, { target: { value: 'qr' } });

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));

    expect(searchbox.value).toBe('');
  });
});
