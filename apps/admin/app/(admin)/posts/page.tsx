'use client';

import { Button, Card, EmptyState, Input, PageHeader, TextArea } from '@/components/ui';
import { adminApi } from '@/lib/admin-api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/city';
import { useApiList } from '@/lib/hooks';
import { FormEvent, useMemo, useState } from 'react';

type Post = {
  id: string;
  authorName: string;
  content: string;
  visibility: string;
  location: string;
  likesCount: number;
  comments: { user: string; text: string }[];
  createdAt: string;
};

export default function PostsPage() {
  const { user } = useAuth();
  const { items: posts, loading, reload } = useApiList<Post>('/v1/posts');
  const { items: cities } = useApiList<{ id: string; name: string }>('/v1/cities');
  const [search, setSearch] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('local');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return posts.filter((post) => [post.content, post.authorName, post.location].join(' ').toLowerCase().includes(q));
  }, [posts, search]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !content.trim()) return;
    setSaving(true);
    try {
      await adminApi.createPost({
        content: content.trim(),
        visibility,
        location,
        authorName: user?.name || 'Admin',
      });
      setContent('');
      await reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Posts"
        description="Create, review, and delete community posts from the app feed."
        action={<Input value={search} onChange={setSearch} placeholder="Search posts" />}
      />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card>
          <h2 className="mb-4 font-semibold">Create post</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <TextArea label="Content" value={content} onChange={setContent} placeholder="Share an update" />
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Visibility</span>
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value="local">Local</option>
                <option value="global">Anyone</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">City</span>
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value="">Select city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </label>
            <Button type="submit" disabled={saving}>{saving ? 'Posting...' : 'Publish post'}</Button>
          </form>
        </Card>
        <div className="space-y-4">
          {loading ? (
            <Card><p className="text-sm text-slate-500">Loading posts...</p></Card>
          ) : filtered.length === 0 ? (
            <Card><EmptyState title="No posts" description="Posts created in the app will show up here." /></Card>
          ) : (
            filtered.map((post) => (
              <Card key={post.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{post.authorName}</p>
                    <p className="text-xs text-slate-500">
                      {post.visibility} • {post.location || 'No city'} • {formatDate(post.createdAt)}
                    </p>
                  </div>
                  <Button variant="danger" onClick={async () => { await adminApi.deletePost(post.id); await reload(); }}>Delete</Button>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm">{post.content}</p>
                <p className="mt-3 text-xs text-slate-500">{post.likesCount} likes • {post.comments.length} comments</p>
                {post.comments.slice(0, 3).map((comment, index) => (
                  <p key={index} className="mt-1 text-sm text-slate-600">
                    <span className="font-medium">{comment.user}:</span> {comment.text}
                  </p>
                ))}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
