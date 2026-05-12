'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/services/http';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';

/**
 * Step 2 of the onboarding wizard — dual geolocation.
 *
 * On mount we ask the backend for an approximate location from the visitor's
 * IP (GeoIP2); if it resolves, the user can accept that coarse guess with one
 * tap. The precise browser geolocation API stays the primary path and is only
 * fired on an explicit button press, preceded by the explanation text.
 */

type IpHint = { lat: number; lng: number; city: string } | null;

export default function StepGeolocation() {
  const setGeo = useOnboardingStore((s) => s.setGeo);
  const setGeoFromIp = useOnboardingStore((s) => s.setGeoFromIp);
  const latApprox = useOnboardingStore((s) => s.latApprox);
  const browserGeoOptin = useOnboardingStore((s) => s.browserGeoOptin);
  const setBrowserGeoOptin = useOnboardingStore((s) => s.setBrowserGeoOptin);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ipHint, setIpHint] = useState<IpHint>(null);

  useEffect(() => {
    if (latApprox != null) return; // already have a location — skip the IP lookup
    let cancelled = false;
    api
      .get('geo/ip-locate/')
      .then((res) => {
        if (cancelled) return;
        const d = res.data;
        if (d?.available && d?.located && typeof d.lat === 'number' && typeof d.lng === 'number') {
          setIpHint({ lat: d.lat, lng: d.lng, city: d.city || '' });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [latApprox]);

  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setError('Tu navegador no soporta geolocalización.');
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({ lat: position.coords.latitude, lng: position.coords.longitude });
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

      {ipHint && latApprox == null && (
        <div data-testid="ip-location-hint" className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-2">
          <p>
            Por tu conexión, parece que estás cerca de{' '}
            <strong>{ipHint.city || 'tu zona'}</strong>. ¿Usar esta ubicación aproximada por ahora?
          </p>
          <button
            type="button"
            data-testid="use-ip-location"
            onClick={() => setGeoFromIp(ipHint)}
            className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
          >
            Usar ubicación aproximada por IP
          </button>
        </div>
      )}

      <button
        type="button"
        data-testid="geo-request-button"
        onClick={requestLocation}
        disabled={busy}
        className="w-full bg-primary text-primary-foreground rounded-full px-4 py-3 hover:bg-primary/90 disabled:opacity-50"
      >
        {browserGeoOptin ? '✓ Ubicación lista — pedir de nuevo' : busy ? 'Solicitando…' : 'Permitir ubicación precisa'}
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
