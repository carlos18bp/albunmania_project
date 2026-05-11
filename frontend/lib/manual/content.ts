import { BookOpen } from 'lucide-react';

import type { ManualSection } from './types';

/**
 * Manual content for Albunmanía.
 *
 * This is a stub: only the "Getting started" section is populated to keep the
 * /manual page rendering during Bloque A. The full manual (procesos por rol —
 * Coleccionista, Comerciante, Web Manager, Admin — y dependencias de negocio)
 * será autorizada en Epic 14 (Manual interactivo) del Bloque B.
 */
export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'getting-started',
    title: { es: 'Primeros pasos', en: 'Getting started' },
    icon: BookOpen,
    processes: [
      {
        id: 'home-page',
        title: { es: 'Conoce la página de inicio', en: 'Tour the home page' },
        summary: {
          es: 'Descubre qué encontrarás al abrir Albunmanía por primera vez.',
          en: 'Find out what you will see when you first open Albunmanía.',
        },
        why: {
          es: 'La página de inicio te orienta hacia el registro y el manual.',
          en: 'The home page guides you to sign-up and the manual.',
        },
        steps: {
          es: [
            'Abre la URL raíz del sitio en tu navegador.',
            'Lee el resumen de Albunmanía y la propuesta de valor.',
            'Toca "Registrarme con Google" para iniciar tu cuenta verificada.',
            'O toca "¿Cómo funciona?" para abrir este manual.',
          ],
          en: [
            'Open the site root URL in your browser.',
            'Read the Albunmanía summary and value proposition.',
            'Tap "Sign up with Google" to start a verified account.',
            'Or tap "How does it work?" to open this manual.',
          ],
        },
        route: '/',
        tips: {
          es: [
            'Si la página no carga, revisa tu conexión a internet.',
            'El registro requiere una cuenta de Google con más de 30 días de antigüedad.',
          ],
          en: [
            'If the page does not load, check your internet connection.',
            'Sign-up requires a Google account at least 30 days old.',
          ],
        },
        keywords: ['home', 'inicio', 'landing'],
      },
    ],
  },
];
