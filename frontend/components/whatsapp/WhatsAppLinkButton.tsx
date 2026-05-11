'use client';

import { useEffect, useState } from 'react';

import { useTradeWhatsAppStore } from '@/lib/stores/tradeWhatsAppStore';

type Props = {
  tradeId: number;
  enabled: boolean;
};

export default function WhatsAppLinkButton({ tradeId, enabled }: Props) {
  const fetchLink = useTradeWhatsAppStore((s) => s.fetchLink);
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLink(null);
      return;
    }
    let cancelled = false;
    void fetchLink(tradeId).then((res) => {
      if (!cancelled) setLink(res);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, tradeId, fetchLink]);

  if (!enabled) {
    return (
      <button
        type="button"
        disabled
        data-testid="whatsapp-link-disabled"
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white opacity-50 cursor-not-allowed"
      >
        Coordinar por WhatsApp (esperando opt-in mutuo)
      </button>
    );
  }

  if (!link) {
    return (
      <button
        type="button"
        disabled
        data-testid="whatsapp-link-loading"
        className="w-full rounded-lg bg-muted px-4 py-3 font-medium"
      >
        Generando enlace…
      </button>
    );
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="whatsapp-link"
      className="block w-full rounded-lg bg-emerald-600 px-4 py-3 text-center font-medium text-white"
    >
      Coordinar por WhatsApp
    </a>
  );
}
