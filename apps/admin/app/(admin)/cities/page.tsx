'use client';

import { Button, Card, EmptyState, Input, PageHeader } from '@/components/ui';
import { adminApi } from '@/lib/admin-api';
import { useAuth } from '@/lib/auth';
import { groupRoomId } from '@/lib/city';
import { useApiList } from '@/lib/hooks';
import { FormEvent, useState } from 'react';

type City = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export default function CitiesPage() {
  const { user } = useAuth();
  const { items: cities, loading, reload } = useApiList<City>('/v1/cities');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await adminApi.createCity(name.trim());
      setName('');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add city');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (city: City) => {
    if (!confirm(`Remove ${city.name}? Existing users keep chatting, but new signups cannot pick it.`)) return;
    await adminApi.deleteCity(city.id);
    await reload();
  };

  return (
    <div>
      <PageHeader
        title="Cities"
        description="Only these cities appear in the app onboarding dropdown. Adding a city also creates its chat group."
      />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <h2 className="mb-4 font-semibold">Add city</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="City name" value={name} onChange={setName} placeholder="Pune" required />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add city'}</Button>
          </form>
        </Card>
        <Card>
          {loading ? (
            <p className="text-sm text-slate-500">Loading cities...</p>
          ) : cities.length === 0 ? (
            <EmptyState title="No cities yet" description="Add the first city so users can complete onboarding." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Slug</th>
                    <th className="pb-3">Chat room</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {cities.map((city) => (
                    <tr key={city.id} className="border-t border-slate-100">
                      <td className="py-3 font-medium">{city.name}</td>
                      <td className="py-3 text-slate-500">{city.slug}</td>
                      <td className="py-3 text-slate-500">{groupRoomId(city.name)}</td>
                      <td className="py-3 text-right">
                        <Button variant="danger" onClick={() => handleDelete(city)}>Delete</Button>
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
