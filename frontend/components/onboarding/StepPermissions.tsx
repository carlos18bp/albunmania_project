'use client';

import { useOnboardingStore } from '@/lib/stores/onboardingStore';

/**
 * Step 3 of the onboarding wizard — push & WhatsApp opt-ins.
 *
 * Push opt-in only flips the `push_optin` flag in Profile. The actual
 * Service-Worker subscription registration happens in Epic 9.
 *
 * WhatsApp opt-in is a per-user default; per-trade WhatsApp opt-in lives
 * on Match (Epic 4).
 */

export default function StepPermissions() {
  const pushOptin = useOnboardingStore((s) => s.pushOptin);
  const setPushOptin = useOnboardingStore((s) => s.setPushOptin);
  const whatsappOptin = useOnboardingStore((s) => s.whatsappOptin);
  const setWhatsAppOptin = useOnboardingStore((s) => s.setWhatsAppOptin);
  const whatsappE164 = useOnboardingStore((s) => s.whatsappE164);
  const setWhatsAppE164 = useOnboardingStore((s) => s.setWhatsAppE164);

  return (
    <section aria-labelledby="onboarding-step3-title" className="space-y-4">
      <h2 id="onboarding-step3-title" className="text-2xl font-semibold tracking-tight">
        Notificaciones y contacto
      </h2>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={pushOptin}
          onChange={(e) => setPushOptin(e.target.checked)}
          data-testid="push-optin-toggle"
          className="mt-1"
        />
        <span className="text-sm">
          <span className="block font-semibold">Notificaciones push de match</span>
          <span className="text-muted-foreground">
            Te avisamos al instante cuando aparece un match nuevo o un cromo buscado cerca.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={whatsappOptin}
          onChange={(e) => setWhatsAppOptin(e.target.checked)}
          data-testid="whatsapp-optin-toggle"
          className="mt-1"
        />
        <span className="text-sm">
          <span className="block font-semibold">Cierre por WhatsApp opt-in</span>
          <span className="text-muted-foreground">
            Solo si la otra persona también acepta. Tu número solo se comparte trade por trade.
          </span>
        </span>
      </label>

      {whatsappOptin && (
        <label className="block">
          <span className="block text-sm font-medium mb-1">Tu WhatsApp en formato internacional</span>
          <input
            type="tel"
            value={whatsappE164}
            onChange={(e) => setWhatsAppE164(e.target.value.trim())}
            placeholder="+573001234567"
            pattern="^\+?\d{8,15}$"
            data-testid="whatsapp-e164-input"
            className="w-full border border-border rounded-lg px-3 py-2 bg-background"
          />
        </label>
      )}
    </section>
  );
}
