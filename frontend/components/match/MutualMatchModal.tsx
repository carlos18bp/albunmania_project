'use client';

import Link from 'next/link';

type Props = {
  matchId: number;
  onClose: () => void;
};

export default function MutualMatchModal({ matchId, onClose }: Props) {
  return (
    <div
      role="dialog"
      aria-label="Match mutuo"
      data-testid="mutual-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-card p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold">¡Match!</h2>
        <p className="mt-2 text-muted-foreground">
          Ambos quieren intercambiar — abre el trade para coordinar.
        </p>
        <Link
          href={`/match/${matchId}`}
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white"
          onClick={onClose}
        >
          Ver intercambio
        </Link>
        <button
          type="button"
          onClick={onClose}
          data-testid="mutual-close"
          className="mt-3 block w-full text-sm text-muted-foreground"
        >
          Seguir explorando
        </button>
      </div>
    </div>
  );
}
