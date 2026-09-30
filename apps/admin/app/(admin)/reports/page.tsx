'use client';

import { Button, Card, EmptyState, PageHeader } from '@/components/ui';
import { adminApi } from '@/lib/admin-api';
import { formatDate } from '@/lib/city';
import { useApiList } from '@/lib/hooks';

type Report = {
  id: string;
  postId: string;
  reporterId: string;
  authorId: string;
  content: string;
  status: string;
  createdAt: string;
};

export default function ReportsPage() {
  const { items: reports, loading, reload } = useApiList<Report>('/v1/reports');

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Review reported posts, mark them resolved, or delete the original post."
      />
      {loading ? (
        <Card><p className="text-sm text-slate-500">Loading reports...</p></Card>
      ) : reports.length === 0 ? (
        <Card><EmptyState title="No reports" description="Reported posts from the app will appear here." /></Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{report.content || 'Reported post'}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Status {report.status} • Post {report.postId} • Reporter {report.reporterId}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(report.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.status !== 'resolved' ? (
                    <Button onClick={async () => { await adminApi.resolveReport(report.id); await reload(); }}>
                      Resolve
                    </Button>
                  ) : null}
                  {report.postId ? (
                    <Button variant="danger" onClick={async () => { await adminApi.resolveReport(report.id, true); await reload(); }}>
                      Delete post
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
