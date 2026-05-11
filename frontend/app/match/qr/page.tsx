'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import QRCrossResults from '@/components/match/QRCrossResults';
import QRDisplay from '@/components/match/QRDisplay';
import QRScanner from '@/components/match/QRScanner';
import { useAuthStore } from '@/lib/stores/authStore';
import { useInventoryStore } from '@/lib/stores/inventoryStore';
import { useQRStore } from '@/lib/stores/qrStore';

export default function MatchQRPage() {
  const router = useRouter();
  const me = useAuthStore((s) => s.user);
  const inventoryEntries = useInventoryStore((s) => s.entries);

  const cacheMyInventory = useQRStore((s) => s.cacheMyInventory);
  const scan = useQRStore((s) => s.scan);
  const computeCrossOffline = useQRStore((s) => s.computeCrossOffline);
  const lastCross = useQRStore((s) => s.lastCross);
  const scannedUserId = useQRStore((s) => s.scannedUserId);

  const [mode, setMode] = useState<'mine' | 'scan'>('mine');
  const [theirInventory] = useState<{ sticker_id: number; count: number }[]>([]);

  useEffect(() => {
    const snapshot = Object.values(inventoryEntries).map((e) => ({
      sticker_id: e.sticker, count: e.count,
    }));
    void cacheMyInventory(snapshot);
  }, [inventoryEntries, cacheMyInventory]);

  const handleScanned = async (token: string) => {
    await scan(token);
    // For V1, the offline cross uses an empty placeholder for the other side
    // until we wire a Bluetooth/peer-to-peer inventory exchange. The server
    // sanity-check will catch any malicious item before persisting.
    await computeCrossOffline(theirInventory);
  };

  const handleConfirmed = (matchId: number) => {
    router.push(`/match/${matchId}`);
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Match presencial</h1>

      <nav className="mb-6 flex gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setMode('mine')}
          data-testid="tab-mine-qr"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            mode === 'mine' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-muted-foreground'
          }`}
        >
          Mi QR
        </button>
        <button
          type="button"
          onClick={() => setMode('scan')}
          data-testid="tab-scan"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            mode === 'scan' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-muted-foreground'
          }`}
        >
          Escanear
        </button>
      </nav>

      {mode === 'mine' && <QRDisplay />}

      {mode === 'scan' && !scannedUserId && <QRScanner onScan={handleScanned} />}

      {mode === 'scan' && scannedUserId && lastCross && me && (
        <div className="mt-6">
          <QRCrossResults
            cross={lastCross}
            meId={me.id}
            otherId={scannedUserId}
            onConfirmed={handleConfirmed}
          />
        </div>
      )}
    </main>
  );
}
