'use client';

import { useState } from 'react';

import type { CrossResult } from '@/lib/stores/qrStore';
import { useQRStore } from '@/lib/stores/qrStore';

type Props = {
  cross: CrossResult;
  meId: number;
  otherId: number;
  onConfirmed: (matchId: number) => void;
};

export default function QRCrossResults({ cross, meId, otherId, onConfirmed }: Props) {
  const confirm = useQRStore((s) => s.confirm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCount = cross.a_to_b.length + cross.b_to_a.length;

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const items = [
        ...cross.a_to_b.map((c) => ({ from_user: meId, to_user: otherId, sticker_id: c.sticker_id })),
        ...cross.b_to_a.map((c) => ({ from_user: otherId, to_user: meId, sticker_id: c.sticker_id })),
      ];
      const res = await confirm(otherId, items);
      onConfirmed(res.match_id);
    } catch {
      setError('confirm_failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (totalCount === 0) {
    return (
      <p data-testid="cross-empty" className="text-center text-muted-foreground py-6">
        No tienen cromos compatibles esta vez. ¡Intenten más adelante!
      </p>
    );
  }

  return (
    <div data-testid="cross-results" className="space-y-4">
      <section>
        <h3 className="font-medium">Tú das ({cross.a_to_b.length})</h3>
        <ul className="text-sm text-muted-foreground">
          {cross.a_to_b.map((c) => (
            <li key={`give-${c.sticker_id}`}>#{c.sticker_id}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="font-medium">Recibes ({cross.b_to_a.length})</h3>
        <ul className="text-sm text-muted-foreground">
          {cross.b_to_a.map((c) => (
            <li key={`get-${c.sticker_id}`}>#{c.sticker_id}</li>
          ))}
        </ul>
      </section>

      {error && <p className="text-sm text-red-600">No pudimos confirmar. Intenta de nuevo.</p>}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={submitting}
        data-testid="cross-confirm"
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Confirmando…' : 'Confirmar trade'}
      </button>
    </div>
  );
}
