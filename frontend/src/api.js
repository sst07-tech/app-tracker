import axios from 'axios';
import { Amplify } from 'aws-amplify';
import {
  fetchAuthSession,
  getCurrentUser,
  fetchUserAttributes,
  signInWithRedirect,
  signOut,
} from 'aws-amplify/auth';

// Validate required environment variables
const requiredEnvVars = {
  COG_DOMAIN: import.meta.env.VITE_COGNITO_DOMAIN,
  COG_REGION: import.meta.env.VITE_COGNITO_REGION,
  COG_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  COG_CLIENT_ID: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: VITE_${key.replace('COG_', 'COGNITO_')}`);
  }
}

const COG_DOMAIN = requiredEnvVars.COG_DOMAIN;
const COG_REGION = requiredEnvVars.COG_REGION;
const COG_POOL_ID = requiredEnvVars.COG_POOL_ID;
const COG_CLIENT_ID = requiredEnvVars.COG_CLIENT_ID;
const REDIRECT = window.location.origin;

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: COG_POOL_ID,
      userPoolClientId: COG_CLIENT_ID,
      region: COG_REGION,
      loginWith: {
        oauth: {
          domain: COG_DOMAIN,
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [REDIRECT],
          redirectSignOut: [REDIRECT],
          responseType: 'code',
        },
      },
    },
  },
});

// Axios instance that attaches the ID token
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use(async (config) => {
  try {
    const { tokens } = await fetchAuthSession();
    const idToken = tokens?.idToken?.toString();
    if (idToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${idToken}`;
    }
  } catch { }
  return config;
});

// ------- Hosted UI helpers -------
function buildHostedUiUrl(path = '/login', extra = {}) {
  const base = `https://${COG_DOMAIN}${path}`;
  const params = new URLSearchParams({
    client_id: COG_CLIENT_ID,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: REDIRECT,
    ...extra, // prompt=login, screen_hint=signup, etc.
  });
  return `${base}?${params.toString()}`;
}

async function hostedUiLogoutThen(redirectUrl) {
  try { 
    await signOut({ global: true }); 
  } catch { }
  
  // Clear all cached data except the redirect URL
  const afterLogoutRedirect = '__afterHostedUiLogoutRedirect__';
  sessionStorage.clear();
  localStorage.clear();
  
  const logout = new URL(`https://${COG_DOMAIN}/logout`);
  logout.search = new URLSearchParams({
    client_id: COG_CLIENT_ID,
    logout_uri: REDIRECT, // must be in App Client "Sign-out URLs"
  }).toString();
  
  sessionStorage.setItem(afterLogoutRedirect, redirectUrl);
  window.location.href = logout.toString();
}

export function runPostLogoutRedirect() {
  const next = sessionStorage.getItem('__afterHostedUiLogoutRedirect__');
  if (next) {
    sessionStorage.removeItem('__afterHostedUiLogoutRedirect__');
    window.location.replace(next);
  }
}

// ------- Ensure code->token exchange completes on first load -------
async function ensureSession({ retries = 3, delayMs = 1000 } = {}) {
  for (let i = 0; i < retries; i++) {
    try {
      const sess = await fetchAuthSession({ forceRefresh: i === 0 });
      const id = sess?.tokens?.idToken;
      if (id) return sess; // success
    } catch (err) {
      if (i === retries - 1) throw err; // throw on final attempt
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

// ------- Auth facade used by the app -------
export const auth = {
  getCurrentUser,

  // Prefer email from ID token payload; then user attributes; then username
  getDisplayEmail: async () => {
    try {
      const { tokens } = await fetchAuthSession();
      const emailFromToken = tokens?.idToken?.payload?.email;
      if (emailFromToken) return emailFromToken;
    } catch { }

    try {
      const attrs = await fetchUserAttributes();
      if (attrs?.email) return attrs.email;
    } catch { }

    try {
      const user = await getCurrentUser();
      return user?.signInDetails?.loginId || user?.username || 'Signed-in user';
    } catch {
      return null;
    }
  },

  signIn: () => signInWithRedirect(),

  signInWithDifferentAccount: async () => {
    const url = buildHostedUiUrl('/login', { prompt: 'login' });
    await hostedUiLogoutThen(url);
  },

  signUp: () => signInWithRedirect({ provider: { custom: 'COGNITO' } }),

  signOut: async () => {
    await hostedUiLogoutThen(buildHostedUiUrl('/login', { prompt: 'login' }));
  },
};

export { api, ensureSession };
