'use client';

import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import HCaptchaWidget from '@/components/auth/HCaptchaWidget';
import { api } from '@/lib/services/http';
import { useAuthStore } from '@/lib/stores/authStore';

type GoogleUser = {
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

const COPY = {
  title: 'Entrar a Albunmanía',
  subtitle: 'Inicia sesión con tu cuenta de Google. Solo aceptamos cuentas con más de 30 días de antigüedad.',
  captchaPrompt: 'Verifica que no eres un robot.',
  signingIn: 'Entrando…',
  noAccount: '¿No tienes cuenta?',
  signUp: 'Crear cuenta',
  missingClient: 'Configuración pendiente: NEXT_PUBLIC_GOOGLE_CLIENT_ID no está definido.',
  errors: {
    googleFailed: 'No pudimos validar tu cuenta de Google. Intenta de nuevo.',
    captchaRequired: 'Completa el captcha para continuar.',
    accountTooYoung: 'Tu cuenta de Google es demasiado nueva (mínimo 30 días). Vuelve a intentarlo más adelante.',
    fallback: 'No pudimos entrar. Intenta de nuevo.',
  },
} as const;

export default function SignInPage() {
  const router = useRouter();
  const googleLogin = useAuthStore((s) => s.googleLogin);

  const hasGoogleClientId = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [siteKey, setSiteKey] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    api
      .get('captcha/site-key/')
      .then((res) => setSiteKey(res.data.site_key || ''))
      .catch(() => {
        api
          .get('google-captcha/site-key/')
          .then((res) => setSiteKey(res.data.site_key || ''))
          .catch(() => undefined);
      });
  }, []);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError('');

    if (siteKey && !captchaToken) {
      setError(COPY.errors.captchaRequired);
      return;
    }
    if (!credentialResponse.credential) {
      setError(COPY.errors.googleFailed);
      return;
    }

    setLoading(true);
    try {
      let decoded: GoogleUser | null = null;
      try {
        decoded = jwtDecode<GoogleUser>(credentialResponse.credential);
      } catch {
        decoded = null;
      }

      await googleLogin({
        credential: credentialResponse.credential,
        email: decoded?.email,
        given_name: decoded?.given_name,
        family_name: decoded?.family_name,
        picture: decoded?.picture,
        captcha_token: captchaToken ?? undefined,
      });
      router.replace('/dashboard');
    } catch (err: unknown) {
      const errObj = err as { code?: string; detail?: string };
      if (errObj?.code === 'account_too_young') {
        setError(COPY.errors.accountTooYoung);
      } else if (errObj?.code === 'captcha_failed') {
        setError(errObj.detail || COPY.errors.captchaRequired);
      } else {
        setError(errObj?.detail || COPY.errors.fallback);
      }
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError(COPY.errors.googleFailed);
  };

  return (
    <main className="min-h-[calc(100vh-72px)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{COPY.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{COPY.subtitle}</p>
        </header>

        {siteKey && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{COPY.captchaPrompt}</p>
            <div className="flex justify-center">
              <HCaptchaWidget
                sitekey={siteKey}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
              />
            </div>
          </div>
        )}

        {mounted && hasGoogleClientId ? (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </div>
        ) : mounted ? (
          <p
            data-testid="missing-google-client-id"
            className="text-sm text-destructive text-center"
          >
            {COPY.missingClient}
          </p>
        ) : null}

        {loading && (
          <p data-testid="signin-loading" className="text-sm text-muted-foreground text-center">
            {COPY.signingIn}
          </p>
        )}

        {error && (
          <p data-testid="signin-error" role="alert" className="text-sm text-destructive text-center">
            {error}
          </p>
        )}

        <p className="text-center text-sm">
          <span className="text-muted-foreground">{COPY.noAccount} </span>
          <Link href="/sign-up" className="text-foreground hover:underline">
            {COPY.signUp}
          </Link>
        </p>
      </div>
    </main>
  );
}
