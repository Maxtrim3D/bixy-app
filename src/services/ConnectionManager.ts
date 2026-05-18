/**
 * ConnectionManager — ping local first, fall back to WireGuard.
 *
 * Flow:
 *   1. GET /health on local URL (timeout 500 ms)
 *   2a. Success → mode = 'local', no VPN
 *   2b. Fail    → start WireGuard tunnel → mode = 'vpn'
 *
 * On app background/close → disconnect WireGuard.
 */
import axios from 'axios';
import { LOCAL_BASE_URL, VPN_BASE_URL, API_SUFFIX, PING_TIMEOUT_MS, WG_CONFIG } from '@/constants/config';
import { WireGuard } from './WireGuardBridge';
import { useConnectionStore } from '@/store/connectionStore';

export function getApiBase(): string {
  const mode = useConnectionStore.getState().mode;
  return (mode === 'vpn' ? VPN_BASE_URL : LOCAL_BASE_URL) + API_SUFFIX;
}

async function pingLocal(): Promise<boolean> {
  try {
    // Use /api/health (routed to backend by Traefik PathPrefix('/api')).
    // Accept any HTTP response (including 4xx) — we only care the server is up,
    // not that the path returns 200.
    await axios.get(`${LOCAL_BASE_URL}/api/health`, {
      timeout: PING_TIMEOUT_MS,
      validateStatus: () => true,   // don't throw on non-2xx
    });
    return true;
  } catch {
    // Only reaches here on network-level failure (ECONNREFUSED, timeout…)
    return false;
  }
}

export async function initConnection(): Promise<void> {
  const store = useConnectionStore.getState();
  store.setMode('connecting');

  const isLocal = await pingLocal();

  if (isLocal) {
    // Make sure VPN is off when on local network
    try { await WireGuard.disconnect(); } catch { /* ignore */ }
    store.setMode('local');
    return;
  }

  // Local not reachable → start WireGuard
  try {
    await WireGuard.connect(WG_CONFIG);
    store.setMode('vpn');
  } catch (err) {
    console.error('[ConnectionManager] WireGuard failed:', err);
    store.setMode('offline');
  }
}

export async function teardownConnection(): Promise<void> {
  try {
    await WireGuard.disconnect();
  } catch { /* ignore */ }
  useConnectionStore.getState().setMode('local');
}
