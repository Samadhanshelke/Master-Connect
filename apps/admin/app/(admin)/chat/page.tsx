'use client';

import { Button, Card, EmptyState, Input, PageHeader } from '@/components/ui';
import { adminApi } from '@/lib/admin-api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/city';
import { useApiList } from '@/lib/hooks';
import { FormEvent, useMemo, useState } from 'react';

type Room = {
  id: string;
  name: string;
  city: string;
  type: string;
  memberCount: number;
};

type Message = {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
};

export default function ChatPage() {
  const { user } = useAuth();
  const { items: rooms, loading } = useApiList<Room>('/v1/chat/rooms');
  const cityRooms = useMemo(
    () => rooms.filter((room) => room.type !== 'leader').sort((a, b) => a.name.localeCompare(b.name)),
    [rooms],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = cityRooms.find((room) => room.id === selectedId) ?? cityRooms[0] ?? null;
  const { items: messages, reload: reloadMessages } = useApiList<Message>(
    selected ? `/v1/chat/rooms/${selected.id}/messages` : null,
  );
  const { items: members } = useApiList<{ id: string; name: string }>(
    selected ? `/v1/chat/rooms/${selected.id}/members` : null,
  );
  const [text, setText] = useState('');

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !selected || !text.trim()) return;
    await adminApi.sendMessage(selected.id, text.trim(), user?.name || 'Admin');
    setText('');
    await reloadMessages();
  };

  return (
    <div>
      <PageHeader
        title="City chat"
        description="Every city group created from the admin panel or joined by users. Send or delete messages here."
      />
      <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="p-0">
          <div className="border-b border-slate-100 px-4 py-3 font-semibold">Rooms</div>
          {loading ? (
            <p className="p-4 text-sm text-slate-500">Loading rooms...</p>
          ) : cityRooms.length === 0 ? (
            <EmptyState title="No rooms" description="Add a city to create its chat group." />
          ) : (
            <div className="divide-y divide-slate-100">
              {cityRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedId(room.id)}
                  className={`block w-full px-4 py-3 text-left ${selected?.id === room.id ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
                >
                  <p className="font-medium">{room.name}</p>
                  <p className="text-xs text-slate-500">{room.memberCount} members</p>
                </button>
              ))}
            </div>
          )}
        </Card>
        <Card className="flex min-h-[70vh] flex-col p-0">
          {selected ? (
            <>
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="font-semibold">{selected.name}</p>
                <p className="text-xs text-slate-500">
                  {members.length} members{members.length ? `: ${members.map((member) => member.name).join(', ')}` : ''}
                </p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-slate-500">No messages yet.</p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{message.authorName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{formatDate(message.createdAt)}</span>
                          <Button variant="danger" onClick={async () => { await adminApi.deleteMessage(selected.id, message.id); await reloadMessages(); }}>
                            Delete
                          </Button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm">{message.text || '[attachment]'}</p>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-100 p-4">
                <div className="flex-1">
                  <Input value={text} onChange={setText} placeholder="Send a message as admin" />
                </div>
                <Button type="submit">Send</Button>
              </form>
            </>
          ) : (
            <EmptyState title="Select a room" description="City chat groups appear after you add cities." />
          )}
        </Card>
      </div>
    </div>
  );
}
