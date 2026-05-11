'use client';

import { useEffect, useState } from 'react';

import MerchantList from '@/components/merchant/MerchantList';
import MerchantMap from '@/components/merchant/MerchantMap';
import { useMerchantStore } from '@/lib/stores/merchantStore';

export default function MerchantsPage() {
  const list = useMerchantStore((s) => s.list);
  const fetchList = useMerchantStore((s) => s.fetchList);
  const loading = useMerchantStore((s) => s.loading);

  const [city, setCity] = useState('');

  useEffect(() => {
    void fetchList(city ? { city } : {});
  }, [city, fetchList]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">¿Dónde comprar sobres?</h1>
        <p className="text-sm text-muted-foreground">
          Papelerías, kioscos y distribuidores oficiales con suscripción al día.
        </p>
      </header>

      <input
        type="search"
        placeholder="Filtrar por ciudad…"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        data-testid="merchant-city-filter"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />

      <MerchantMap merchants={list} />

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <MerchantList merchants={list} />
      )}
    </main>
  );
}
