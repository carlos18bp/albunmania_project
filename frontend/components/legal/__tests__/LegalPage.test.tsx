/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import LegalPage from '../LegalPage';
import type { LegalSection } from '../../../lib/legal/content';
import { LEGAL_DRAFT_NOTICE } from '../../../lib/legal/content';

const sections: LegalSection[] = [
  { heading: '1. Qué es Albunmanía', body: ['Es una plataforma comunitaria.', 'No está afiliada a la FIFA.'] },
  { heading: '2. Cuenta y elegibilidad', body: ['Registro con Google verificado >30 días.'] },
];

describe('LegalPage', () => {
  it('renders the title as the page heading', () => {
    render(<LegalPage title="Términos y Condiciones" sections={sections} testId="terms-page" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Términos y Condiciones' })).toBeInTheDocument();
    expect(screen.getByTestId('terms-page')).toBeInTheDocument();
  });

  it('renders the draft-notice banner', () => {
    render(<LegalPage title="X" sections={sections} testId="x-page" />);

    expect(screen.getByTestId('legal-draft-notice')).toHaveTextContent(LEGAL_DRAFT_NOTICE);
  });

  it('renders one section heading per section', () => {
    render(<LegalPage title="X" sections={sections} testId="x-page" />);

    expect(screen.getByRole('heading', { level: 2, name: '1. Qué es Albunmanía' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '2. Cuenta y elegibilidad' })).toBeInTheDocument();
  });

  it('renders every paragraph of every section', () => {
    render(<LegalPage title="X" sections={sections} testId="x-page" />);

    expect(screen.getByText('Es una plataforma comunitaria.')).toBeInTheDocument();
    expect(screen.getByText('No está afiliada a la FIFA.')).toBeInTheDocument();
    expect(screen.getByText('Registro con Google verificado >30 días.')).toBeInTheDocument();
  });
});
