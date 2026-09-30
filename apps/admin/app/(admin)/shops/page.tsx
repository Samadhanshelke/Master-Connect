'use client';

import { Button, Card, EmptyState, Input, PageHeader, TextArea } from '@/components/ui';
import { adminApi } from '@/lib/admin-api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/city';
import { useApiList } from '@/lib/hooks';
import { FormEvent, useMemo, useState } from 'react';

type Shop = {
  id: string;
  name: string;
  ownerName: string;
  category: string;
  city: string;
  location: string;
  contactNumber: string;
  description: string;
  createdAt: string;
};

export default function ShopsPage() {
  const { user } = useAuth();
  const { items: shops, loading, reload } = useApiList<Shop>('/v1/shops');
  const { items: cities } = useApiList<{ id: string; name: string }>('/v1/cities');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'Grocery',
    description: '',
    city: '',
    contactNumber: '',
    openingTime: '9:00 AM',
    closingTime: '8:00 PM',
  });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return shops.filter((shop) => [shop.name, shop.city, shop.category, shop.ownerName].join(' ').toLowerCase().includes(q));
  }, [shops, search]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !form.name.trim() || !form.city) return;
    setSaving(true);
    try {
      await adminApi.createShop({
        ownerName: user?.name || 'Admin',
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        city: form.city,
        contactNumber: form.contactNumber.trim(),
        openingTime: form.openingTime,
        closingTime: form.closingTime,
      });
      setForm({ ...form, name: '', description: '', contactNumber: '' });
      await reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Shops"
        description="All shop listings. App users only see shops for the city they selected during signup."
        action={<Input value={search} onChange={setSearch} placeholder="Search shops" />}
      />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card>
          <h2 className="mb-4 font-semibold">Create shop</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <Input label="Shop name" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
            <Input label="Category" value={form.category} onChange={(category) => setForm({ ...form, category })} />
            <label className="block text-sm">
              <span className="mb-1 block font-medium">City</span>
              <select
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                required
              >
                <option value="">Select city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </label>
            <Input label="Contact" value={form.contactNumber} onChange={(contactNumber) => setForm({ ...form, contactNumber })} />
            <TextArea label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} rows={3} />
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create shop'}</Button>
          </form>
        </Card>
        <Card>
          {loading ? (
            <p className="text-sm text-slate-500">Loading shops...</p>
          ) : filtered.length === 0 ? (
            <EmptyState title="No shops" description="Create a shop or wait for users to add one in the app." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3">Shop</th>
                    <th className="pb-3">City</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Created</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((shop) => (
                    <tr key={shop.id} className="border-t border-slate-100">
                      <td className="py-3">
                        <p className="font-medium">{shop.name}</p>
                        <p className="text-xs text-slate-500">{shop.category} • {shop.ownerName}</p>
                      </td>
                      <td className="py-3">{shop.city}</td>
                      <td className="py-3">{shop.contactNumber || '—'}</td>
                      <td className="py-3 text-slate-500">{formatDate(shop.createdAt)}</td>
                      <td className="py-3 text-right">
                        <Button variant="danger" onClick={async () => { await adminApi.deleteShop(shop.id); await reload(); }}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
