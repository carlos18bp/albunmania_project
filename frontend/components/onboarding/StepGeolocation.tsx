'use client';

import { useState } from 'react';

import { useOnboardingStore } from '@/lib/stores/onboardingStore';

/**
 * Step 2 of the onboarding wizard — request browser geolocation.
 *
 * Only fired explicitly by the user (button press) so the prompt is
 * preceded by the explanation text. The opt-in is purely informational
 * here; the persistent flag and lat/lng are sent to the backend on
 * submit() in StepPermissions.
 */

export default function StepGeolocation() {
  const setGeo = useOnboardingStore((s) => s.setGeo);
  const browserGeoOptin = useOnboardingStore((s) => s.browserGeoOptin);
  const setBrowserGeoOptin = useOnboardingStore((s) => s.setBrowserGeoOptin);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setError('Tu navegador no soporta geolocalización.');
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setBusy(false);
      },
      (err) => {
        setError(err.message || 'No pudimos leer tu ubicación.');
        setBusy(false);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  return (
    <section aria-labelledby="onboarding-step2-title" className="space-y-4">
      <h2 id="onboarding-step2-title" className="text-2xl font-semibold tracking-tight">
        Permitir geolocalización
      </h2>
      <p className="text-sm text-muted-foreground">
        Tu ubicación aproximada se usa solo para sugerirte intercambios cercanos.
        Nunca compartimos tu ubicación exacta con otros coleccionistas.
      </p>

      <button
        type="button"
        data-testid="geo-request-button"
        onClick={requestLocation}
        disabled={busy}
        className="w-full bg-primary text-primary-foreground rounded-full px-4 py-3 hover:bg-primary/90 disabled:opacity-50"
      >
        {browserGeoOptin ? '✓ Ubicación lista — pedir de nuevo' : busy ? 'Solicitando…' : 'Permitir ubicación'}
      </button>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={browserGeoOptin}
          onChange={(e) => setBrowserGeoOptin(e.target.checked)}
          data-testid="geo-optin-toggle"
        />
        <span>Recordar mi consentimiento de ubicación</span>
      </label>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
