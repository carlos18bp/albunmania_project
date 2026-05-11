'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api } from '@/lib/services/http';

type ShareItem = {
  sticker_id: number;
  number: string;
  name: string;
  team: string;
  image_url: string;
  is_special_edition: boolean;
};

type SharePayload = {
  kind: 'available' | 'wanted';
  collector: { user_id: number; city: string; avatar_url: string };
  items: ShareItem[];
  count: number;
};

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const search = useSearchParams();
  const token = params?.token;
  const kind = (search?.get('kind') ?? 'available') as 'available' | 'wanted';

  const [data, setData] = useState<SharePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .get(`trade/share/${token}/`, { params: { kind } })
      .then((res) => setData(res.data))
      .catch(() => setError('load_failed'));
  }, [token, kind]);

  if (error) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600">El enlace expiró o no es válido.</p>
      </main>
    );
  }

  if (!data) {
    return <main className="max-w-xl mx-auto px-4 py-12 text-center">Cargando…</main>;
  }

  const title = kind === 'available' ? 'Cromos para intercambiar' : 'Cromos buscados';

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Coleccionista en {data.collector.city || 'Colombia'} · {data.count} cromos
        </p>
      </header>

      <ul className="grid grid-cols-3 gap-3 md:grid-cols-5">
        {data.items.map((it) => (
          <li
            key={it.sticker_id}
            className={`rounded-lg border p-2 text-center text-xs ${
              it.is_special_edition ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-border'
            }`}
          >
            <div className="font-mono text-muted-foreground">#{it.number}</div>
            <div className="font-medium">{it.name}</div>
            <div className="text-muted-foreground">{it.team}</div>
          </li>
        ))}
      </ul>

      <Link
        href="/sign-up"
        className="block rounded-lg bg-emerald-600 px-4 py-3 text-center font-medium text-white"
      >
        Únete a Albunmanía y haz match
      </Link>
    </main>
  );
}
