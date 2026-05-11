'use client';

import { useRouter } from 'next/navigation';

import { useOnboardingStore } from '@/lib/stores/onboardingStore';
import StepAlbumSelect from './StepAlbumSelect';
import StepGeolocation from './StepGeolocation';
import StepPermissions from './StepPermissions';

const STEP_LABELS: Record<string, string> = {
  album: 'Álbum',
  geo: 'Ubicación',
  permissions: 'Permisos',
  done: 'Listo',
};

const STEP_ORDER = ['album', 'geo', 'permissions'] as const;

/** Stepper-driven 3-step onboarding wizard. */
export default function OnboardingWizard() {
  const router = useRouter();
  const step = useOnboardingStore((s) => s.step);
  const next = useOnboardingStore((s) => s.next);
  const back = useOnboardingStore((s) => s.back);
  const submit = useOnboardingStore((s) => s.submit);
  const isSubmitting = useOnboardingStore((s) => s.isSubmitting);
  const errorMessage = useOnboardingStore((s) => s.errorMessage);
  const activeAlbumId = useOnboardingStore((s) => s.activeAlbumId);

  const isLastStep = step === 'permissions';
  const canAdvanceFromAlbum = activeAlbumId !== null;

  const handleNext = async () => {
    if (isLastStep) {
      try {
        await submit();
        router.push('/dashboard');
      } catch {
        // submit() set errorMessage already.
      }
      return;
    }
    next();
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-10 space-y-8" data-testid="onboarding-wizard">
      <ol className="flex items-center gap-2 text-xs">
        {STEP_ORDER.map((label, idx) => {
          const isActive = step === label;
          const isPast = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]) > idx;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`inline-flex items-center justify-center h-6 w-6 rounded-full border ${
                  isActive ? 'border-primary bg-primary text-primary-foreground'
                    : isPast ? 'border-primary bg-primary/40'
                    : 'border-border'
                }`}
                aria-current={isActive ? 'step' : undefined}
                data-testid={`step-indicator-${label}`}
              >
                {idx + 1}
              </span>
              <span className="hidden sm:inline">{STEP_LABELS[label]}</span>
              {idx < STEP_ORDER.length - 1 && <span className="text-muted-foreground">›</span>}
            </li>
          );
        })}
      </ol>

      {step === 'album' && <StepAlbumSelect />}
      {step === 'geo' && <StepGeolocation />}
      {step === 'permissions' && <StepPermissions />}
      {step === 'done' && (
        <p className="text-center text-sm text-muted-foreground">
          ¡Listo! Te llevamos a tu tablero…
        </p>
      )}

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive" data-testid="onboarding-error">
          {errorMessage === 'whatsapp_e164_required'
            ? 'Debes ingresar tu número de WhatsApp para activar el opt-in.'
            : 'No pudimos guardar tus preferencias. Intenta de nuevo.'}
        </p>
      )}

      {step !== 'done' && (
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={back}
            disabled={step === 'album'}
            className="text-sm underline disabled:opacity-40"
            data-testid="onboarding-back"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={(step === 'album' && !canAdvanceFromAlbum) || isSubmitting}
            className="bg-primary text-primary-foreground rounded-full px-5 py-2 hover:bg-primary/90 disabled:opacity-50"
            data-testid="onboarding-next"
          >
            {isLastStep ? (isSubmitting ? 'Guardando…' : 'Finalizar') : 'Siguiente'}
          </button>
        </div>
      )}
    </div>
  );
}
