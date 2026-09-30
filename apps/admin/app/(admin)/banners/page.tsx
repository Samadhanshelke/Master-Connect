'use client';

import { Button, Card, EmptyState, PageHeader } from '@/components/ui';
import { adminApi } from '@/lib/admin-api';
import { formatDate } from '@/lib/city';
import { useApiList } from '@/lib/hooks';

type Banner = {
  id: string;
  ownerName: string;
  date: string;
  imageUri: string;
  status: string;
  paymentStatus: string;
  price: number;
  createdAt: string;
};

export default function BannersPage() {
  const { items: banners, loading, reload } = useApiList<Banner>('/v1/banners');

  return (
    <div>
      <PageHeader
        title="Banners"
        description="Approve, reject, or remove home-screen banner bookings from the app."
      />
      {loading ? (
        <Card><p className="text-sm text-slate-500">Loading banners...</p></Card>
      ) : banners.length === 0 ? (
        <Card><EmptyState title="No banners" description="Banner bookings from the app will appear here." /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {banners.map((banner) => (
            <Card key={banner.id}>
              {banner.imageUri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={banner.imageUri} alt="" className="mb-3 h-24 w-full rounded-lg object-cover" />
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{banner.ownerName}</p>
                  <p className="text-sm text-slate-500">
                    {banner.date} • {banner.status} • {banner.paymentStatus} • ₹{banner.price}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(banner.createdAt)}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {banner.status === 'pending' ? (
                  <>
                    <Button onClick={async () => { await adminApi.setBannerStatus(banner.id, 'approved'); await reload(); }}>Approve</Button>
                    <Button variant="danger" onClick={async () => { await adminApi.setBannerStatus(banner.id, 'rejected'); await reload(); }}>Reject</Button>
                  </>
                ) : null}
                <Button variant="secondary" onClick={async () => { await adminApi.deleteBanner(banner.id); await reload(); }}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
