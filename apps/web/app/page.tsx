'use client';

import { Shell } from '@/components/Shell';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PostRecord } from '@master-connect/shared';
import { FormEvent, useCallback, useEffect, useState } from 'react';

export default function FeedPage() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    const data = await apiFetch<PostRecord[]>('/v1/posts');
    setPosts(data);
  }, [token]);

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Could not load posts'));
  }, [load]);

  const publish = async (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    await apiFetch('/v1/posts', {
      method: 'POST',
      body: JSON.stringify({ content: content.trim(), visibility: 'global', location: user?.location || '' }),
    });
    setContent('');
    await load();
  };

  return (
    <Shell>
      <h1 className="mb-4 text-2xl font-semibold">Community feed</h1>
      <form onSubmit={publish} className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Share something with your city"
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
          rows={3}
        />
        <button type="submit" className="mt-3 rounded-lg bg-[#009688] px-4 py-2 text-sm text-white">
          Publish
        </button>
      </form>
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      <div className="space-y-4">
        {posts.map((post) => (
          <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-semibold">{post.authorName}</p>
            <p className="text-xs text-slate-500">{post.visibility} · {post.location || 'No city'}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{post.content}</p>
            <p className="mt-2 text-xs text-slate-500">{post.likesCount} likes · {post.comments.length} comments</p>
          </article>
        ))}
        {posts.length === 0 ? <p className="text-sm text-slate-500">No posts yet.</p> : null}
      </div>
    </Shell>
  );
}
