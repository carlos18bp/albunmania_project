'use client';

import { useEffect, useState } from 'react';

import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { useAdminStore } from '@/lib/stores/adminStore';

const ROLES = ['collector', 'merchant', 'web_manager', 'admin'];

export default function AdminUsersPage() {
  const { isAuthenticated } = useRequireAuth();
  const users = useAdminStore((s) => s.users);
  const total = useAdminStore((s) => s.usersTotal);
  const fetchUsers = useAdminStore((s) => s.fetchUsers);
  const assignRole = useAdminStore((s) => s.assignRole);
  const setActive = useAdminStore((s) => s.setActive);

  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchUsers({ q: q.trim() || undefined, role: roleFilter || undefined });
  }, [isAuthenticated, q, roleFilter, fetchUsers]);

  if (!isAuthenticated) return null;

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Usuarios y roles</h1>
        <p className="text-sm text-muted-foreground">{total} usuarios totales</p>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="search"
          placeholder="Buscar por email o nombre…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-testid="admin-users-search"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          data-testid="admin-users-role-filter"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos los roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <table className="w-full text-sm" data-testid="admin-users-table">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2">Email</th>
            <th className="py-2">Rol</th>
            <th className="py-2">Estado</th>
            <th className="py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border" data-testid={`admin-user-row-${u.id}`}>
              <td className="py-2">{u.email}</td>
              <td className="py-2">
                <select
                  value={u.role}
                  onChange={(e) => void assignRole(u.id, e.target.value)}
                  data-testid={`admin-user-role-${u.id}`}
                  className="rounded border border-border bg-background px-2 py-1 text-xs"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
              <td className="py-2">
                <span className={`text-xs ${u.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
                  {u.is_active ? 'Activo' : 'Bloqueado'}
                </span>
              </td>
              <td className="py-2">
                <button
                  type="button"
                  onClick={() => void setActive(u.id, !u.is_active)}
                  data-testid={`admin-user-toggle-${u.id}`}
                  className="text-xs underline"
                >
                  {u.is_active ? 'Bloquear' : 'Desbloquear'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
