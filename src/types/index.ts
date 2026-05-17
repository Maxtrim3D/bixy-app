// ── Auth ───────────────────────────────────────────────────────────────────────
export type Role =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'preparateur'
  | 'commercial'
  | 'viewer'
  | string; // custom roles

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  display_name: string | null;
  app_name: string;
  role: Role;
  locale: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

// ── Connection ─────────────────────────────────────────────────────────────────
export type ConnectionMode = 'local' | 'vpn' | 'connecting' | 'offline';

// ── RBAC ───────────────────────────────────────────────────────────────────────
export type Permission =
  | 'clients:read' | 'clients:read_own' | 'clients:write' | 'clients:merge'
  | 'orders:read'  | 'orders:read_own'  | 'orders:write'  | 'orders:prepare'
  | 'shipping:read' | 'shipping:create'
  | 'commissions:read' | 'commissions:read_own' | 'commissions:write' | 'commissions:presets'
  | 'tasks:read' | 'tasks:assign'
  | 'machines:read' | 'machines:control'
  | 'attendance:read' | 'attendance:read_own' | 'attendance:write'
  | 'restock:read' | 'restock:write'
  | 'users:read' | 'users:write' | 'users:delete'
  | 'settings:read' | 'settings:write';

// ── Preparation ────────────────────────────────────────────────────────────────
export interface PrepLine {
  id: string;
  product_name: string;
  product_ref: string | null;
  quantity_demanded: number;
  quantity_picked: number;
  is_done: boolean;
  missing_quantity: number | null;
  shortage_note: string | null;
  picked_at: string | null;
}

export interface Preparation {
  id: string;
  odoo_sale_order_name: string | null;
  partner_name: string;
  partner_email: string | null;
  status: 'waiting' | 'in_progress' | 'partial' | 'done' | string;
  preparer_name: string | null;
  order_date: string | null;
  order_amount: number | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  notes: string | null;
  lines: PrepLine[];
}

export interface PendingOrder {
  id: number;
  name: string;
  date_order: string | null;
  partner: string;
  amount_total: number;
  currency: string;
}

// ── Machines ───────────────────────────────────────────────────────────────────
export interface PrinterData {
  id: string;
  name?: string;
  model?: string;
  status?: string;
  state?: string;
  progress?: number;
  current_job_name?: string;
  job_name?: string;
  remaining_time?: number;
  nozzle_temp?: number;
  nozzle_target_temp?: number;
  bed_temp?: number;
  bed_target_temp?: number;
  filament_type?: string;
  print_error?: string;
}
