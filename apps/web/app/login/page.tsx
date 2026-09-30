'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

export default function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') await signIn(email, password);
      else await signUp(name, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not continue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f2f2c] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <p className="text-xs uppercase tracking-[0.25em] text-[#009688]">Master Connect</p>
        <h1 className="mt-2 text-2xl font-semibold">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
        <div className="mt-6 space-y-4">
          {mode === 'register' ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Name</span>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Email</span>
            <input type="email" className="w-full rounded-lg border border-slate-200 px-3 py-2" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Password</span>
            <input type="password" className="w-full rounded-lg border border-slate-200 px-3 py-2" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button type="submit" disabled={submitting} className="mt-6 rounded-lg bg-[#009688] px-4 py-2 text-white disabled:opacity-50">
          {submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        <button
          type="button"
          className="mt-4 block text-sm text-slate-500"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already registered? Sign in'}
        </button>
      </form>
    </div>
  );
}
