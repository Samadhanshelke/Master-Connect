'use client';

import { Card, PageHeader } from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { OverviewStats } from '@master-connect/shared';
import { Flag, ImageIcon, MapPin, MessageCircle, Newspaper, ShoppingBag, Store, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const empty: OverviewStats = {
  cities: 0,
  users: 0,
  posts: 0,
  rooms: 0,
  shops: 0,
  jobs: 0,
  pendingBanners: 0,
  openReports: 0,
};

export default function OverviewPage() {
  const { token } = useAuth();
  const [statsData, setStatsData] = useState<OverviewStats>(empty);

  useEffect(() => {
    if (!token) return;
    apiFetch<OverviewStats>('/v1/admin/overview').then(setStatsData).catch(() => setStatsData(empty));
  }, [token]);

  const stats = [
    { href: '/cities', label: 'Cities', value: statsData.cities, icon: MapPin },
    { href: '/users', label: 'Users', value: statsData.users, icon: Users },
    { href: '/posts', label: 'Posts', value: statsData.posts, icon: Newspaper },
    { href: '/chat', label: 'Chat rooms', value: statsData.rooms, icon: MessageCircle },
    { href: '/shops', label: 'Shops', value: statsData.shops, icon: Store },
    { href: '/jobs', label: 'Jobs', value: statsData.jobs, icon: ShoppingBag },
    { href: '/banners', label: 'Pending banners', value: statsData.pendingBanners, icon: ImageIcon },
    { href: '/reports', label: 'Open reports', value: statsData.openReports, icon: Flag },
  ];

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Counts from the Nest API."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.href} href={stat.href}>
              <Card className="h-full transition hover:border-[#009688]">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <Icon size={18} className="text-[#009688]" />
                </div>
                <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
