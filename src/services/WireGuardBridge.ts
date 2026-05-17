/**
 * JS bridge to the native Android WireGuard module.
 * The native module (WireGuardModule.kt) exposes:
 *   - connect(config: string): Promise<void>
 *   - disconnect(): Promise<void>
 *   - isConnected(): Promise<boolean>
 */
import { NativeModules, Platform } from 'react-native';

const { WireGuardModule } = NativeModules;

function noop() {}

// Fallback stub when running on iOS or in tests
const stub = {
  connect: async (_config: string) => { noop(); },
  disconnect: async () => { noop(); },
  isConnected: async (): Promise<boolean> => false,
};

const bridge = Platform.OS === 'android' && WireGuardModule
  ? WireGuardModule
  : stub;

export const WireGuard = {
  connect: (config: string): Promise<void> => bridge.connect(config),
  disconnect: (): Promise<void> => bridge.disconnect(),
  isConnected: (): Promise<boolean> => bridge.isConnected(),
};
