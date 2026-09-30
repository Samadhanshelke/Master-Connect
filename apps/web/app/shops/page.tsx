'use client';

import { Shell } from '@/components/Shell';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ShopRecord } from '@master-connect/shared';
import { useEffect, useState } from 'react';

export default function ShopsPage() {
  const { token } = useAuth();
  const [shops, setShops] = useState<ShopRecord[]>([]);

  useEffect(() => {
    if (!token) return;
    apiFetch<ShopRecord[]>('/v1/shops').then(setShops).catch(() => setShops([]));
  }, [token]);

  return (
    <Shell>
      <h1 className="mb-4 text-2xl font-semibold">Shops</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {shops.map((shop) => (
          <article key={shop.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-semibold">{shop.name}</p>
            <p className="text-sm text-slate-500">{shop.category} · {shop.city}</p>
            <p className="mt-2 text-sm">{shop.description || 'No description'}</p>
            <p className="mt-2 text-xs text-slate-500">{shop.contactNumber || 'No contact'} · {shop.openingTime}–{shop.closingTime}</p>
          </article>
        ))}
        {shops.length === 0 ? <p className="text-sm text-slate-500">No shops yet.</p> : null}
      </div>
    </Shell>
  );
}
