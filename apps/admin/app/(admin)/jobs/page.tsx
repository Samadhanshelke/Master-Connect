'use client';

import { Button, Card, EmptyState, Input, PageHeader } from '@/components/ui';
import { adminApi } from '@/lib/admin-api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/city';
import { useApiList } from '@/lib/hooks';
import { FormEvent, useMemo, useState } from 'react';

type Job = {
  id: string;
  orgName: string;
  position: string;
  contact: string;
  address: string;
  city: string;
  status: string;
  createdAt: string;
};

export default function JobsPage() {
  const { user } = useAuth();
  const { items: jobs, loading, reload } = useApiList<Job>('/v1/jobs');
  const { items: cities } = useApiList<{ id: string; name: string }>('/v1/cities');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ orgName: '', position: '', contact: '', city: '' });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter((job) => [job.orgName, job.position, job.city, job.status].join(' ').toLowerCase().includes(q));
  }, [jobs, search]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !form.orgName.trim() || !form.position.trim() || !form.city) return;
    setSaving(true);
    try {
      await adminApi.createJob({
        orgName: form.orgName.trim(),
        position: form.position.trim(),
        contact: form.contact.trim(),
        city: form.city,
      });
      setForm({ ...form, orgName: '', position: '', contact: '' });
      await reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="All job listings. App users only see jobs for the city they selected during signup."
        action={<Input value={search} onChange={setSearch} placeholder="Search jobs" />}
      />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card>
          <h2 className="mb-4 font-semibold">Create job</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <Input label="Organization" value={form.orgName} onChange={(orgName) => setForm({ ...form, orgName })} required />
            <Input label="Position" value={form.position} onChange={(position) => setForm({ ...form, position })} required />
            <Input label="Contact" value={form.contact} onChange={(contact) => setForm({ ...form, contact })} />
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
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Post job'}</Button>
          </form>
        </Card>
        <Card>
          {loading ? (
            <p className="text-sm text-slate-500">Loading jobs...</p>
          ) : filtered.length === 0 ? (
            <EmptyState title="No jobs" description="Create a job or wait for users to post one." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">City</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Created</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((job) => (
                    <tr key={job.id} className="border-t border-slate-100">
                      <td className="py-3">
                        <p className="font-medium">{job.position}</p>
                        <p className="text-xs text-slate-500">{job.orgName} • {job.contact || 'No contact'}</p>
                      </td>
                      <td className="py-3">{job.city}</td>
                      <td className="py-3 capitalize">{job.status}</td>
                      <td className="py-3 text-slate-500">{formatDate(job.createdAt)}</td>
                      <td className="py-3 text-right space-x-2">
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            await adminApi.setJobStatus(job.id, job.status === 'closed' ? 'active' : 'closed');
                            await reload();
                          }}
                        >
                          {job.status === 'closed' ? 'Reopen' : 'Close'}
                        </Button>
                        <Button variant="danger" onClick={async () => { await adminApi.deleteJob(job.id); await reload(); }}>Delete</Button>
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
