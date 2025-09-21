import React, { useEffect, useMemo, useState } from 'react';
import { api, auth, runPostLogoutRedirect, ensureSession } from './api';
import { signOut } from 'aws-amplify/auth';
import ApplicationList from './components/ApplicationList.jsx';
import ApplicationForm from './components/ApplicationForm.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import Toast from './components/Toast.jsx';

function StatBadge({ label, value }) {
  return (
    <div className="px-4 py-3 rounded-2xl bg-white border shadow-sm flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export default function App() {
  const [me, setMe] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('All');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const statuses = ['All', 'Applied', 'Interview', 'Offer', 'Rejected', 'On Hold'];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    runPostLogoutRedirect();
    
    // Check if we're returning from OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code')) {
      setIsAuthenticating(true);
    }
  }, []);

  const filtered = useMemo(
    () => (filter === 'All' ? apps : apps.filter((a) => a.status === filter)),
    [apps, filter]
  );

  const stats = useMemo(() => {
    const base = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0, 'On Hold': 0 };
    for (const a of apps) base[a.status] = (base[a.status] || 0) + 1;
    return { total: apps.length, ...base };
  }, [apps]);

  useEffect(() => {
    let mounted = true;
    let timeoutId;
    
    (async () => {
      try {
        setError(null);
        
        // Check if we have an OAuth code to process
        const urlParams = new URLSearchParams(window.location.search);
        const hasAuthCode = urlParams.has('code');
        
        let email = null;
        
        if (hasAuthCode) {
          // Set a timeout for authentication
          timeoutId = setTimeout(() => {
            if (mounted) {
              setError('Authentication is taking too long. Please try signing in again.');
              setLoading(false);
              setIsAuthenticating(false);
            }
          }, 15000); // 15 second timeout
          
          // Wait for Hosted UI code -> token exchange
          await ensureSession();
          
          if (timeoutId) clearTimeout(timeoutId);
          
          // Give a moment for the session to be fully established
          await new Promise(r => setTimeout(r, 500));
        }

        email = await auth.getDisplayEmail();
        if (!email) throw new Error('not signed in');
        if (!mounted) return;
        
        setMe({ email });
        setIsAuthenticating(false);

        const { data } = await api.get('/applications');
        if (!mounted) return;
        setApps(data || []);
        
        // Clean up URL after successful auth
        const url = new URL(window.location);
        if (url.searchParams.has('code') || url.searchParams.has('error')) {
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          url.searchParams.delete('error');
          window.history.replaceState({}, document.title, url.toString());
        }
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        if (mounted) {
          setMe(null);
          setIsAuthenticating(false);
          console.error('Auth error:', err);
          
          // Clear URL params on auth failure to prevent infinite loop
          const url = new URL(window.location);
          if (url.searchParams.has('code') || url.searchParams.has('error')) {
            url.searchParams.delete('code');
            url.searchParams.delete('state');
            url.searchParams.delete('error');
            window.history.replaceState({}, document.title, url.toString());
          }
          
          if (err.message !== 'not signed in') {
            setError('Sign in failed. Please try again.');
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    
    return () => { 
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const createApp = async (payload) => {
    try {
      const { data } = await api.post('/applications', payload);
      setApps((prev) => [data, ...prev]);
      setError(null);
      showToast('Application added successfully!');
    } catch (err) {
      setError('Failed to create application. Please try again.');
      showToast('Failed to add application', 'error');
      throw err;
    }
  };

  const updateApp = async (appId, patch) => {
    try {
      const { data } = await api.patch(`/applications/${appId}`, patch);
      setApps((prev) => prev.map((a) => (a.appId === appId ? data : a)));
      setError(null);
      showToast('Application updated successfully!');
    } catch (err) {
      setError('Failed to update application. Please try again.');
      showToast('Failed to update application', 'error');
      throw err;
    }
  };

  const deleteApp = async (appId) => {
    try {
      await api.delete(`/applications/${appId}`);
      setApps((prev) => prev.filter((a) => a.appId !== appId));
      setError(null);
      showToast('Application deleted successfully!');
    } catch (err) {
      setError('Failed to delete application. Please try again.');
      showToast('Failed to delete application', 'error');
      throw err;
    }
  };

  const handleSignIn = () => {
    auth.signIn();
  };

  const handleSignUp = () => {
    auth.signUp();
  };

  const handleDifferentAccount = async () => {
    setIsAuthenticating(true);
    try {
      await auth.signInWithDifferentAccount();
    } catch (err) {
      setError('Failed to switch account. Please try again.');
      setIsAuthenticating(false);
    }
  };

  if (loading || isAuthenticating) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <div className="text-slate-600 font-medium">{isAuthenticating ? 'Signing in…' : 'Loading…'}</div>
        </div>
      </div>
    );
  }

  // Don't show sign-in buttons if we're processing OAuth callback
  const urlParams = new URLSearchParams(window.location.search);
  const isOAuthCallback = urlParams.has('code') || urlParams.has('error');

  if (!me) {
    if (isOAuthCallback) {
      return (
        <div className="min-h-screen grid place-items-center bg-gradient-to-b from-slate-50 to-slate-100">
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-4" />
            <div className="text-slate-600 font-medium">Completing sign in…</div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="max-w-md w-full p-8 rounded-2xl shadow-lg bg-white border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3 text-slate-900">ApplyTrackr</h1>
            <p className="text-slate-600">Track your job applications in one organized place</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleSignIn}
              className="w-full rounded-xl px-6 py-3 shadow-sm bg-black text-white hover:bg-slate-800 font-medium transition-colors"
            >
              Sign In
            </button>

            <button
              onClick={handleSignUp}
              className="w-full rounded-xl px-6 py-3 shadow-sm border border-slate-300 hover:bg-slate-50 font-medium transition-colors"
            >
              Create Account
            </button>

            <button
              onClick={handleDifferentAccount}
              className="w-full rounded-xl px-6 py-3 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              title="Sign in with a different account"
            >
              Use a different account
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              Secure authentication powered by AWS Cognito
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">ApplyTrackr</h1>
            <p className="text-slate-600">Track your job applications in one place</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{me?.email || 'User'}</p>
              <p className="text-xs text-slate-500">Signed in</p>
            </div>
            <button
              onClick={() => auth.signOut()}
              className="rounded-xl px-4 py-2 shadow-sm border bg-white hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatBadge label="Total" value={stats.total} />
          <StatBadge label="Applied" value={stats.Applied} />
          <StatBadge label="Interview" value={stats.Interview} />
          <StatBadge label="Offer" value={stats.Offer} />
          <StatBadge label="Rejected" value={stats.Rejected} />
          <StatBadge label="On Hold" value={stats['On Hold']} />
        </section>

        {/* Create */}
        <section className="mb-6">
          <ApplicationForm onSubmit={createApp} />
        </section>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full border shadow-sm text-sm transition-colors ${
                filter === s ? 'bg-black text-white' : 'bg-white hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center text-slate-600">
            No applications in <span className="font-medium">{filter}</span>. Add your first one above.
          </div>
        ) : (
          <ApplicationList
            data={filtered}
            onDelete={(item) => deleteApp(item.appId)}
            onEdit={(item, patch) => updateApp(item.appId, patch)}
          />
        )}
        
        {/* Toast Notifications */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
