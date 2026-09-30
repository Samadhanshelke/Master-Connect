'use client';

import { useAuth } from '@/lib/auth';
import {
  Flag,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageCircle,
  Newspaper,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/cities', label: 'Cities', icon: MapPin },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/posts', label: 'Posts', icon: Newspaper },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/shops', label: 'Shops', icon: Store },
  { href: '/jobs', label: 'Jobs', icon: ShoppingBag },
  { href: '/banners', label: 'Banners', icon: ImageIcon },
  { href: '/reports', label: 'Reports', icon: Flag },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user: profile, loading, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !profile) {
      router.replace('/login');
    }
  }, [loading, profile, router]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading admin panel...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-semibold">Admin access required</h1>
        <p className="max-w-md text-slate-500">
          Signed in as {profile?.email}. This account needs the admin role. Sign in with the seeded
          admin, or ask an existing admin to change your role.
        </p>
        <button
          onClick={() => {
            logout();
            router.replace('/login');
          }}
          className="rounded-lg bg-[#009688] px-4 py-2 text-white"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f7f6] text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0f2f2c] text-white md:flex">
        <div className="border-b border-white/10 px-6 py-6">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-200">Master Connect</p>
          <h1 className="mt-1 text-xl font-semibold">Admin Panel</h1>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                  active ? 'bg-[#009688] text-white' : 'text-teal-50/80 hover:bg-white/10'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium">{profile?.name}</p>
          <p className="truncate text-xs text-teal-100/70">{profile?.email}</p>
          <button
            onClick={() => {
            logout();
            router.replace('/login');
          }}
            className="mt-3 flex items-center gap-2 text-sm text-teal-100 hover:text-white"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <p className="font-semibold">Master Connect Admin</p>
          <div className="mt-2 flex gap-2 overflow-x-auto text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-3 py-1 ${
                  pathname === item.href ? 'bg-[#009688] text-white' : 'bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
