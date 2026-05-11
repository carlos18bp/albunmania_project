'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect } from 'react';

import { useQRStore } from '@/lib/stores/qrStore';

type Props = {
  size?: number;
};

export default function QRDisplay({ size = 220 }: Props) {
  const myToken = useQRStore((s) => s.myToken);
  const fetchMyToken = useQRStore((s) => s.fetchMyToken);
  const loading = useQRStore((s) => s.loading);

  useEffect(() => {
    if (!myToken) void fetchMyToken();
  }, [myToken, fetchMyToken]);

  if (loading && !myToken) {
    return (
      <p data-testid="qr-display-loading" className="text-center text-muted-foreground">
        Generando tu QR…
      </p>
    );
  }

  if (!myToken) return null;

  return (
    <div data-testid="qr-display" className="flex flex-col items-center gap-3">
      <div className="rounded-lg bg-white p-4">
        <QRCodeSVG value={myToken.token} size={size} level="M" includeMargin />
      </div>
      <p className="text-xs text-muted-foreground">
        Otra persona escanea este QR para iniciar un cruce presencial.
      </p>
    </div>
  );
}
