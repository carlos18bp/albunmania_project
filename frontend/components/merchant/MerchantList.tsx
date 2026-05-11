'use client';

import type { Merchant } from '@/lib/stores/merchantStore';

type Props = {
  merchants: Merchant[];
  onSelect?: (m: Merchant) => void;
};

export default function MerchantList({ merchants, onSelect }: Props) {
  if (merchants.length === 0) {
    return (
      <p data-testid="merchant-list-empty" className="text-sm text-muted-foreground">
        No hay comerciantes activos en esta zona todavía.
      </p>
    );
  }

  return (
    <ul data-testid="merchant-list" className="space-y-2">
      {merchants.map((m) => (
        <li
          key={m.user_id}
          className="rounded-lg border border-border p-3 hover:bg-muted cursor-pointer"
          onClick={() => onSelect?.(m)}
        >
          <p className="font-medium">{m.business_name}</p>
          <p className="text-xs text-muted-foreground">{m.business_type}</p>
          <p className="text-xs text-muted-foreground">{m.address}</p>
        </li>
      ))}
    </ul>
  );
}
