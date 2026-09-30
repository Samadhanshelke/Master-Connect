'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const NAV = [
  { href: '/', label: 'Feed' },
  { href: '/shops', label: 'Shops' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/news', label: 'News' },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#009688]">Master Connect</p>
            <p className="font-semibold">{user.name}</p>
          </div>
          <nav className="flex gap-2 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1 ${pathname === item.href ? 'bg-[#009688] text-white' : 'bg-slate-100'}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button onClick={() => { logout(); router.replace('/login'); }} className="text-sm text-slate-600">
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  );
}
