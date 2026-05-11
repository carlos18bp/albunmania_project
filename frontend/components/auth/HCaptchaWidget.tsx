'use client';

import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useEffect, useRef, useState } from 'react';

const HCAPTCHA_TEST_SITEKEY = '10000000-ffff-ffff-ffff-000000000001';

type Props = {
  /** Callback fired when the user resolves the challenge. */
  onVerify: (token: string) => void;
  /** Callback fired when the token expires (>2 min). */
  onExpire?: () => void;
  /** Callback fired on hCaptcha error. */
  onError?: (event: string) => void;
  /** Override the sitekey (otherwise reads NEXT_PUBLIC_HCAPTCHA_SITEKEY). */
  sitekey?: string;
};

/** Wrapper around the official hCaptcha React component.
 *
 * Falls back to the official hCaptcha test sitekey when no env value is set,
 * so dev and CI flows always render a widget that auto-resolves.
 */
export default function HCaptchaWidget({ onVerify, onExpire, onError, sitekey }: Props) {
  const widgetRef = useRef<HCaptcha | null>(null);
  const [resolvedSitekey, setResolvedSitekey] = useState<string>('');

  useEffect(() => {
    setResolvedSitekey(
      sitekey
        || process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY
        || HCAPTCHA_TEST_SITEKEY,
    );
  }, [sitekey]);

  if (!resolvedSitekey) return null;

  return (
    <div data-testid="hcaptcha-widget">
      <HCaptcha
        ref={widgetRef}
        sitekey={resolvedSitekey}
        onVerify={onVerify}
        onExpire={() => {
          onExpire?.();
          widgetRef.current?.resetCaptcha();
        }}
        onError={(event) => {
          onError?.(event);
        }}
      />
    </div>
  );
}
