'use client';

import { Button, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

export default function LoginPage() {
  const { user, loading, isAdmin, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.replace('/');
    }
  }, [loading, user, isAdmin, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f2f2c] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <p className="text-xs uppercase tracking-[0.25em] text-[#009688]">Master Connect</p>
        <h1 className="mt-2 text-2xl font-semibold">Admin sign in</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">
          Local seed: admin@masterconnect.local / admin123
        </p>
        <div className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={setEmail} required />
          <Input label="Password" type="password" value={password} onChange={setPassword} required />
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {!loading && user && !isAdmin ? (
          <p className="mt-3 text-sm text-red-600">This account is signed in but is not an admin.</p>
        ) : null}
        <div className="mt-6">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
      </form>
    </div>
  );
}
