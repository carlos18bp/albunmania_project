/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import ProcessCard from '../ProcessCard';
import type { ManualProcess } from '../../../lib/manual/types';

const fullProcess: ManualProcess = {
  id: 'match-swipe',
  title: { es: 'Match por swipe', en: 'Swipe match' },
  summary: { es: 'Desliza para encontrar coleccionistas cerca.', en: 'Swipe to find nearby collectors.' },
  why: { es: 'Acelera los intercambios por proximidad.', en: 'Speeds up proximity trades.' },
  steps: { es: ['Abre /match', 'Desliza a la derecha', 'Espera el match mutuo'], en: ['Open /match', 'Swipe right', 'Wait for the mutual match'] },
  route: '/match',
  tips: { es: ['Activa la geolocalización', 'Revisa la reputación en la card'], en: ['Enable geolocation', 'Check the reputation on the card'] },
  keywords: ['match', 'swipe', 'proximidad'],
};

const minimalProcess: ManualProcess = {
  id: 'about',
  title: { es: 'Sobre Albunmanía', en: 'About Albunmanía' },
  summary: { es: 'Qué es la plataforma.', en: 'What the platform is.' },
  why: { es: 'Contexto general.', en: 'General context.' },
  steps: { es: ['Lee la introducción'], en: ['Read the intro'] },
  keywords: ['intro'],
};

describe('ProcessCard', () => {
  it('renders the localized title and summary', () => {
    render(<ProcessCard process={fullProcess} locale="es" />);

    expect(screen.getByRole('heading', { name: 'Match por swipe' })).toBeInTheDocument();
    expect(screen.getByText('Desliza para encontrar coleccionistas cerca.')).toBeInTheDocument();
  });

  it('renders every step in order', () => {
    const { container } = render(<ProcessCard process={fullProcess} locale="es" />);

    expect(screen.getByText('Abre /match')).toBeInTheDocument();
    expect(screen.getByText('Desliza a la derecha')).toBeInTheDocument();
    expect(screen.getByText('Espera el match mutuo')).toBeInTheDocument();
    expect(container.querySelector('ol')?.querySelectorAll('li')).toHaveLength(3);
  });

  it('shows the route block when the process has a route', () => {
    render(<ProcessCard process={fullProcess} locale="es" />);

    expect(screen.getByText('/match')).toBeInTheDocument();
  });

  it('shows the tips block when the process has tips', () => {
    render(<ProcessCard process={fullProcess} locale="es" />);

    expect(screen.getByText('Activa la geolocalización')).toBeInTheDocument();
  });

  it('omits the route and tips blocks when the process has neither', () => {
    render(<ProcessCard process={minimalProcess} locale="es" />);

    expect(screen.queryByText('Dónde encontrarlo')).not.toBeInTheDocument();
    expect(screen.queryByText('Tips útiles')).not.toBeInTheDocument();
  });

  it('renders the English copy when locale is en', () => {
    render(<ProcessCard process={fullProcess} locale="en" />);

    expect(screen.getByRole('heading', { name: 'Swipe match' })).toBeInTheDocument();
    expect(screen.getByText('Open /match')).toBeInTheDocument();
  });
});
