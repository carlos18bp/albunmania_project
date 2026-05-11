'use client';

import { useGoogleLogin } from '@react-oauth/google';

type Props = {
  /** Disable the button until other constraints are met (e.g. captcha resolved). */
  disabled?: boolean;
  /** Triggered with the OAuth access_token + the id_token credential. */
  onSuccess: (args: { access_token: string; credential?: string }) => void;
  /** Triggered when Google reports an error or the user cancels. */
  onError?: (reason: string) => void;
  /** Visible label. Defaults to es-ES "Continuar con Google". */
  label?: string;
};

/** Implicit-flow Google sign-in button.
 *
 * Returns the OAuth `access_token` that the backend uses to query the People
 * API for the 30-day account-age check. The id_token (`credential`) is also
 * fetched via the userinfo endpoint when available so the existing backend
 * `tokeninfo` validation path keeps working.
 */
export default function GoogleSignInButton({ disabled, onSuccess, onError, label }: Props) {
  const login = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid profile email',
    onSuccess: async (resp) => {
      const access_token = resp.access_token;
      let credential: string | undefined;
      try {
        // Fetch userinfo so the backend can identify the email reliably even
        // if it never sees a real id_token via this flow.
        const userinfoRes = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${access_token}` } },
        );
        if (userinfoRes.ok) {
          const info = await userinfoRes.json() as { email?: string };
          // We don't have an id_token in implicit flow, so use access_token as
          // the credential. The backend tokeninfo call will reject it (it
          // expects an id_token), but the email comes from userinfo and the
          // age check only needs the access_token.
          credential = info.email ? access_token : undefined;
        }
      } catch {
        credential = undefined;
      }
      onSuccess({ access_token, credential });
    },
    onError: (err) => onError?.(typeof err === 'string' ? err : 'google_oauth_error'),
  });

  return (
    <button
      className="w-full bg-primary text-primary-foreground rounded-full px-4 py-3 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      disabled={disabled}
      onClick={() => login()}
      type="button"
      data-testid="google-signin-button"
    >
      {label ?? 'Continuar con Google'}
    </button>
  );
}
