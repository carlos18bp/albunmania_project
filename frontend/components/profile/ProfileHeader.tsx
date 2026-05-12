'use client';

import type { PublicProfile } from '@/lib/stores/profileStore';
import ReviewSummary from '@/components/reviews/ReviewSummary';

type Props = { profile: PublicProfile };

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export default function ProfileHeader({ profile }: Props) {
  const completion = Number(profile.album_completion_pct);
  return (
    <section data-testid="profile-header" className="space-y-4">
      <div className="flex items-center gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="h-16 w-16 rounded-full object-cover border border-border"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground"
          >
            {initials(profile.display_name)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{profile.display_name}</h1>
          {profile.city && <p className="text-sm text-muted-foreground">{profile.city}</p>}
          {profile.bio_short && <p className="mt-1 text-sm">{profile.bio_short}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="profile-metrics">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">% del álbum</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{completion.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Intercambios</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{profile.trades_completed_count}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Reseñas</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{profile.rating_count}</p>
        </div>
      </div>

      <ReviewSummary userId={profile.user_id} />
    </section>
  );
}
