'use client';

import { Shell } from '@/components/Shell';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { JobRecord } from '@master-connect/shared';
import { useEffect, useState } from 'react';

export default function JobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<JobRecord[]>([]);

  useEffect(() => {
    if (!token) return;
    apiFetch<JobRecord[]>('/v1/jobs').then(setJobs).catch(() => setJobs([]));
  }, [token]);

  return (
    <Shell>
      <h1 className="mb-4 text-2xl font-semibold">Jobs</h1>
      <div className="space-y-3">
        {jobs.map((job) => (
          <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-semibold">{job.position}</p>
            <p className="text-sm text-slate-500">{job.orgName} · {job.city} · {job.status}</p>
            <p className="mt-1 text-sm">{job.contact || 'No contact'}</p>
          </article>
        ))}
        {jobs.length === 0 ? <p className="text-sm text-slate-500">No jobs yet.</p> : null}
      </div>
    </Shell>
  );
}
