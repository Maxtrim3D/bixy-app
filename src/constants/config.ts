// ── Network ────────────────────────────────────────────────────────────────────
export const LOCAL_BASE_URL  = 'http://192.168.1.38';
export const VPN_BASE_URL    = 'http://10.8.0.1';
export const API_SUFFIX      = '/api/v1';
export const PING_TIMEOUT_MS = 500;

// ── WireGuard (split-tunnel: only server traffic via VPN) ──────────────────────
export const WG_CONFIG = `[Interface]
PrivateKey = gDBvyy8wxPz+Ub0PjvchKv2ForC3zjx19s2+Sj4T9U8=
Address = 10.8.0.8/32
MTU = 1420

[Peer]
PublicKey = yFRCWotlpbArmXgzNR6L5mAdmhgh+xK+iJHScM47Sy0=
PresharedKey = HR/QiexeZt9ScMQS0y6jvfQv+XFnvq0ymmaF247DOJ0=
AllowedIPs = 10.8.0.1/32
PersistentKeepalive = 25
Endpoint = 83.134.139.123:51820
`;

// ── App ────────────────────────────────────────────────────────────────────────
export const APP_NAME = 'Bixy';
export const TOKEN_STORAGE_KEY = 'bixy_token';
export const USER_STORAGE_KEY  = 'bixy_user';
