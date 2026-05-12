/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { BookOpen } from 'lucide-react';

import ManualSidebar from '../ManualSidebar';
import type { ManualSection } from '../../../lib/manual/types';

const sections: ManualSection[] = [
  {
    id: 'collector',
    title: { es: 'Coleccionista', en: 'Collector' },
    icon: BookOpen,
    processes: [
      { id: 'p1', title: { es: 'Match por swipe', en: 'Swipe match' }, summary: { es: '', en: '' }, why: { es: '', en: '' }, steps: { es: [], en: [] }, keywords: [] },
      { id: 'p2', title: { es: 'QR presencial', en: 'In-person QR' }, summary: { es: '', en: '' }, why: { es: '', en: '' }, steps: { es: [], en: [] }, keywords: [] },
    ],
  },
  {
    id: 'merchant',
    title: { es: 'Comerciante', en: 'Merchant' },
    icon: BookOpen,
    processes: [
      { id: 'p3', title: { es: 'Listing en el mapa', en: 'Map listing' }, summary: { es: '', en: '' }, why: { es: '', en: '' }, steps: { es: [], en: [] }, keywords: [] },
    ],
  },
];

describe('ManualSidebar', () => {
  it('renders one expandable button per section', () => {
    render(<ManualSidebar sections={sections} locale="es" />);

    expect(screen.getByRole('button', { name: /Coleccionista/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Comerciante/i })).toBeInTheDocument();
  });

  it('lists the section processes as anchor links by default', () => {
    render(<ManualSidebar sections={sections} locale="es" />);

    const link = screen.getByRole('link', { name: 'Match por swipe' });
    expect(link).toHaveAttribute('href', '#p1');
    expect(screen.getByRole('link', { name: 'QR presencial' })).toBeInTheDocument();
  });

  it('collapses a section when its button is clicked', () => {
    render(<ManualSidebar sections={sections} locale="es" />);
    const sectionBtn = screen.getByRole('button', { name: /Coleccionista/i });

    expect(sectionBtn).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(sectionBtn);

    expect(sectionBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Match por swipe' })).not.toBeInTheDocument();
  });

  it('renders the English section titles when locale is en', () => {
    render(<ManualSidebar sections={sections} locale="en" />);

    expect(screen.getByRole('button', { name: /Collector/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Swipe match' })).toBeInTheDocument();
  });
});
