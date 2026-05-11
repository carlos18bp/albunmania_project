'use client';

import { useState } from 'react';

import { useTradeWhatsAppStore } from '@/lib/stores/tradeWhatsAppStore';

type Props = {
  tradeId: number;
  initialOptedIn?: boolean;
  onChange?: (state: { opted_in: boolean; both_opted_in: boolean }) => void;
};

export default function WhatsAppOptInToggle({ tradeId, initialOptedIn = false, onChange }: Props) {
  const setOptIn = useTradeWhatsAppStore((s) => s.setOptIn);
  const [optedIn, setOptedInLocal] = useState(initialOptedIn);
  const [submitting, setSubmitting] = useState(false);

  const handleToggle = async () => {
    const next = !optedIn;
    setSubmitting(true);
    try {
      const result = await setOptIn(tradeId, next);
      setOptedInLocal(result.opted_in);
      onChange?.(result);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <label
      data-testid="whatsapp-optin-toggle"
      className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer"
    >
      <input
        type="checkbox"
        className="mt-1"
        checked={optedIn}
        disabled={submitting}
        onChange={handleToggle}
        data-testid="whatsapp-optin-checkbox"
      />
      <div className="flex-1 text-sm">
        <p className="font-medium">Compartir mi WhatsApp para este intercambio</p>
        <p className="text-muted-foreground">
          Tu número solo se comparte si la otra persona también acepta. Vale solo
          para este match — puedes revocarlo en cualquier momento.
        </p>
      </div>
    </label>
  );
}
