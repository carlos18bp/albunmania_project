'use client';

import { BrowserQRCodeReader } from '@zxing/browser';
import { useEffect, useRef, useState } from 'react';

type Props = {
  onScan: (token: string) => void;
};

export default function QRScanner({ onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const codeReader = new BrowserQRCodeReader();

    codeReader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, _err, controls) => {
        if (cancelled) return;
        if (result) {
          onScan(result.getText());
          controls.stop();
        }
      })
      .then((controls) => {
        if (cancelled) controls.stop();
        else controlsRef.current = controls;
      })
      .catch(() => {
        if (!cancelled) setError('camera_unavailable');
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [onScan]);

  if (error) {
    return (
      <p data-testid="scanner-error" className="text-center text-sm text-red-600">
        No pudimos acceder a la cámara. Permite el acceso o usa HTTPS.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <video
        ref={videoRef}
        data-testid="scanner-video"
        className="w-full max-w-sm aspect-square rounded-lg bg-black"
        muted
        playsInline
      />
      <p className="text-xs text-muted-foreground">Apunta al QR del otro coleccionista.</p>
    </div>
  );
}
