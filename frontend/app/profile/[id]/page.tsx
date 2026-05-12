'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/lib/stores/authStore';
import { useProfileStore } from '@/lib/stores/profileStore';
import { useReviewStore, type Review } from '@/lib/stores/reviewStore';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ReviewCard from '@/components/reviews/ReviewCard';

const STAR_FILTERS = [0, 5, 4, 3, 2, 1] as const;
const EMPTY_REVIEWS: readonly Review[] = Object.freeze([]);

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const me = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rawId = params?.id ?? '';
  const isMeRoute = rawId === 'me';
  const targetId: number | null = isMeRoute
    ? (me?.id ?? null)
    : (Number.isNaN(Number(rawId)) ? null : Number(rawId));
  const isSelf = mounted && me != null && targetId != null && targetId === me.id;

  // /profile/me requires being logged in.
  useEffect(() => {
    if (mounted && isMeRoute && !isAuthenticated) router.replace(ROUTES.SIGN_IN);
  }, [mounted, isMeRoute, isAuthenticated, router]);

  const profile = useProfileStore((s) => (targetId != null ? s.publicByUser[targetId] : undefined));
  const fetchPublicProfile = useProfileStore((s) => s.fetchPublicProfile);
  useEffect(() => {
    if (targetId != null && !profile) void fetchPublicProfile(targetId).catch(() => undefined);
  }, [targetId, profile, fetchPublicProfile]);

  // Reviews tab.
  const reviews = useReviewStore((s) => (targetId != null ? s.byUser[targetId] : undefined)) ?? EMPTY_REVIEWS;
  const fetchUserReviews = useReviewStore((s) => s.fetchUserReviews);
  const [starFilter, setStarFilter] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  useEffect(() => {
    if (targetId != null) void fetchUserReviews(targetId, starFilter ? { stars: starFilter } : {}).catch(() => undefined);
  }, [targetId, starFilter, fetchUserReviews]);

  // Account settings (only when viewing your own profile).
  const mySettings = useProfileStore((s) => s.mySettings);
  const fetchMySettings = useProfileStore((s) => s.fetchMySettings);
  const updateMySettings = useProfileStore((s) => s.updateMySettings);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<{ city: string; bio_short: string; push_optin: boolean; whatsapp_optin: boolean; whatsapp_e164: string } | null>(null);
  useEffect(() => {
    if (isSelf && !mySettings) void fetchMySettings().catch(() => undefined);
  }, [isSelf, mySettings, fetchMySettings]);
  useEffect(() => {
    if (mySettings && !form) setForm({ ...mySettings });
  }, [mySettings, form]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaved(false);
    setSaveError(null);
    try {
      await updateMySettings(form);
      setSaved(true);
    } catch {
      setSaveError('No pudimos guardar los cambios. Revisa el número de WhatsApp.');
    }
  };

  if (isMeRoute && mounted && !isAuthenticated) return null;
  if (targetId == null) {
    return <main className="max-w-2xl mx-auto px-6 py-10 text-muted-foreground">Cargando perfil…</main>;
  }
  if (!profile) {
    return <main data-testid="profile-loading" className="max-w-2xl mx-auto px-6 py-10 text-muted-foreground">Cargando perfil…</main>;
  }

  return (
    <main data-testid="profile-page" className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <ProfileHeader profile={profile} />

      {!isSelf && mounted && isAuthenticated && (
        // The "Reportar a este coleccionista" button lands in Bloque D, fase D4.
        <p className="text-xs text-muted-foreground">¿Algún problema con este coleccionista? Pronto podrás reportarlo desde aquí.</p>
      )}

      <section data-testid="profile-reviews" className="space-y-3">
        <h2 className="text-lg font-semibold">Reseñas</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar reseñas por estrellas">
          {STAR_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              data-testid={`profile-reviews-filter-${s}`}
              aria-pressed={starFilter === s}
              onClick={() => setStarFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${starFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
            >
              {s === 0 ? 'Todas' : `${s}★`}
            </button>
          ))}
        </div>
        {reviews.length === 0 ? (
          <p data-testid="profile-reviews-empty" className="text-sm text-muted-foreground">Sin reseñas todavía.</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id}><ReviewCard review={r} /></li>
            ))}
          </ul>
        )}
      </section>

      {isSelf && form && (
        <section data-testid="account-settings" className="space-y-4 rounded-2xl border border-border p-4">
          <h2 className="text-lg font-semibold">Editar mi cuenta</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <label className="block text-sm">
              Ciudad
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                data-testid="account-city"
                className="mt-1 block w-full rounded border border-input bg-background px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Bio corta
              <textarea
                value={form.bio_short}
                onChange={(e) => setForm({ ...form, bio_short: e.target.value })}
                maxLength={280}
                data-testid="account-bio"
                className="mt-1 block w-full rounded border border-input bg-background px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.push_optin}
                onChange={(e) => setForm({ ...form, push_optin: e.target.checked })}
                data-testid="account-push-optin"
              />
              Recibir notificaciones push
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.whatsapp_optin}
                onChange={(e) => setForm({ ...form, whatsapp_optin: e.target.checked })}
                data-testid="account-whatsapp-optin"
              />
              Compartir WhatsApp en intercambios (con doble opt-in)
            </label>
            {form.whatsapp_optin && (
              <label className="block text-sm">
                Tu WhatsApp (formato internacional)
                <input
                  type="tel"
                  value={form.whatsapp_e164}
                  onChange={(e) => setForm({ ...form, whatsapp_e164: e.target.value.trim() })}
                  placeholder="+573001234567"
                  data-testid="account-whatsapp-number"
                  className="mt-1 block w-full rounded border border-input bg-background px-3 py-2"
                />
              </label>
            )}
            <button
              type="submit"
              data-testid="account-save"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Guardar cambios
            </button>
            {saved && <p data-testid="account-saved" className="text-sm text-emerald-600">Cambios guardados.</p>}
            {saveError && <p data-testid="account-error" role="alert" className="text-sm text-destructive">{saveError}</p>}
          </form>
        </section>
      )}
    </main>
  );
}
