'use client';

import { useEffect, useState } from 'react';

import { useMerchantStore } from '@/lib/stores/merchantStore';

const BUSINESS_TYPES = [
  { value: 'papeleria', label: 'Papelería' },
  { value: 'kiosco', label: 'Kiosco' },
  { value: 'libreria', label: 'Librería' },
  { value: 'distribuidor', label: 'Distribuidor oficial' },
  { value: 'otro', label: 'Otro' },
];

export default function MerchantDashboardForm() {
  const dashboard = useMerchantStore((s) => s.dashboard);
  const fetchDashboard = useMerchantStore((s) => s.fetchDashboard);
  const updateDashboard = useMerchantStore((s) => s.updateDashboard);
  const loading = useMerchantStore((s) => s.loading);

  useEffect(() => {
    if (!dashboard) void fetchDashboard();
  }, [dashboard, fetchDashboard]);

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [address, setAddress] = useState('');
  const [declaredStock, setDeclaredStock] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!dashboard) return;
    setBusinessName(dashboard.business_name || '');
    setBusinessType(dashboard.business_type || '');
    setAddress(dashboard.address || '');
    setDeclaredStock(dashboard.declared_stock || '');
  }, [dashboard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(false);
    await updateDashboard({
      business_name: businessName,
      business_type: businessType,
      address,
      declared_stock: declaredStock,
    });
    setSubmitted(true);
  };

  if (!dashboard) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  const isActive = dashboard.subscription_status === 'active';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="merchant-dashboard-form">
      <header className="flex items-center justify-between">
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}
          data-testid="merchant-subscription-badge"
        >
          {isActive ? 'Suscripción activa' : 'Suscripción inactiva'}
        </span>
        {dashboard.subscription_expires_at && (
          <span className="text-xs text-muted-foreground">
            Vence: {new Date(dashboard.subscription_expires_at).toLocaleDateString()}
          </span>
        )}
      </header>

      <label className="block text-sm">
        Nombre del negocio
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="mt-1 block w-full rounded border border-input bg-background px-3 py-2"
          data-testid="merchant-business-name"
        />
      </label>

      <label className="block text-sm">
        Tipo
        <select
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          className="mt-1 block w-full rounded border border-input bg-background px-3 py-2"
          data-testid="merchant-business-type"
        >
          <option value="">Seleccionar…</option>
          {BUSINESS_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        Dirección
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mt-1 block w-full rounded border border-input bg-background px-3 py-2"
          data-testid="merchant-address"
        />
      </label>

      <label className="block text-sm">
        Stock declarado
        <textarea
          value={declaredStock}
          onChange={(e) => setDeclaredStock(e.target.value)}
          className="mt-1 block w-full rounded border border-input bg-background px-3 py-2 min-h-[100px]"
          data-testid="merchant-declared-stock"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        data-testid="merchant-submit"
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Guardando…' : 'Guardar cambios'}
      </button>

      {submitted && (
        <p data-testid="merchant-saved" className="text-sm text-emerald-600">
          Cambios guardados.
        </p>
      )}
    </form>
  );
}
