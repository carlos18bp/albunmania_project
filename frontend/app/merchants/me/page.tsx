'use client';

import MerchantDashboardForm from '@/components/merchant/MerchantDashboardForm';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

export default function MerchantDashboardPage() {
  const { isAuthenticated } = useRequireAuth();
  if (!isAuthenticated) return null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Mi negocio</h1>
        <p className="text-sm text-muted-foreground">
          Actualiza la información que verán los coleccionistas en el mapa.
        </p>
      </header>
      <MerchantDashboardForm />
    </main>
  );
}
