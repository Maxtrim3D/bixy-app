import type { Role, Permission } from '@/types';

const DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [], // bypass — always has everything
  admin: [
    'clients:read','clients:write','clients:merge',
    'orders:read','orders:write','orders:prepare',
    'shipping:read','shipping:create',
    'commissions:read','commissions:write','commissions:presets',
    'tasks:read','tasks:assign',
    'machines:read','machines:control',
    'attendance:read','attendance:write',
    'restock:read','restock:write',
    'users:read','users:write','users:delete',
    'settings:read','settings:write',
  ],
  manager: [
    'clients:read','orders:read','orders:prepare',
    'shipping:read','shipping:create',
    'commissions:read',
    'tasks:read','tasks:assign',
    'machines:read',
    'attendance:read',
    'restock:read','restock:write',
    'settings:read',
  ],
  preparateur: [
    'orders:read','orders:prepare',
    'machines:read',
    'attendance:read_own','attendance:write',
    'tasks:read',
  ],
  commercial: [
    'clients:read_own','orders:read_own',
    'commissions:read_own',
    'tasks:read',
    'attendance:read_own',
  ],
  viewer: [
    'dashboard:read','orders:read','clients:read',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  if (role === 'super_admin') return true;
  const perms = DEFAULT_PERMISSIONS[role] ?? [];
  return perms.includes(permission);
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
