'use client';

import { Card, EmptyState, Input, PageHeader } from '@/components/ui';
import { adminApi } from '@/lib/admin-api';
import { formatDate } from '@/lib/city';
import { useApiList } from '@/lib/hooks';
import { useMemo, useState } from 'react';

type UserRow = {
  id: string;
  name: string;
  email: string;
  location: string;
  role: string;
  bio: string;
  createdAt: string;
};

const ROLES = ['citizen', 'shop_owner', 'admin'];

export default function UsersPage() {
  const { items: users, loading, reload } = useApiList<UserRow>('/v1/users');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((user) =>
      [user.name, user.email, user.location, user.role].join(' ').toLowerCase().includes(q),
    );
  }, [users, search]);

  const changeRole = async (userId: string, role: string) => {
    await adminApi.setUserRole(userId, role);
    await reload();
  };

  return (
    <div>
      <PageHeader
        title="Users"
        description="Change a user's role. The new role is stored on the Nest user record."
        action={<Input value={search} onChange={setSearch} placeholder="Search users" />}
      />
      <Card>
        {loading ? (
          <p className="text-sm text-slate-500">Loading users...</p>
        ) : filtered.length === 0 ? (
          <EmptyState title="No users found" description="Users appear after they sign up in the app." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">City</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="py-3">
                      <p className="font-medium">{user.name || 'Unnamed'}</p>
                      {user.bio ? <p className="text-xs text-slate-500">{user.bio}</p> : null}
                    </td>
                    <td className="py-3 text-slate-600">{user.email}</td>
                    <td className="py-3">{user.location || '—'}</td>
                    <td className="py-3">
                      <select
                        value={user.role}
                        onChange={(event) => changeRole(user.id, event.target.value)}
                        className="rounded-lg border border-slate-200 px-2 py-1"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 text-slate-500">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
