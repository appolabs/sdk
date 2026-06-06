import type { Capabilities } from './types';
import { sendMessage, isNativeEnvironment, setUnsupportedCheck } from './bridge';

/**
 * Bridge protocol version this SDK speaks. Sent to the native host during the
 * capability handshake so the host can adapt to older or newer clients.
 */
export const PROTOCOL_VERSION = 1;

/**
 * Feature namespaces that predate the capability handshake. Used as the assumed
 * capability set for legacy native hosts that do not respond to
 * `system.getCapabilities` — those hosts support exactly these features.
 */
export const BASELINE_FEATURES = [
  'push',
  'biometrics',
  'camera',
  'location',
  'haptics',
  'storage',
  'share',
  'network',
  'device',
] as const;

/**
 * Default timeout for the capability probe. Deliberately short so a legacy host
 * that does not implement the handshake fails fast instead of waiting the full
 * 30s request timeout.
 */
const DEFAULT_HANDSHAKE_TIMEOUT = 2000;

let cache: Capabilities | null = null;
let inFlight: Promise<Capabilities> | null = null;

interface CapabilitiesPayload {
  protocolVersion?: number;
  nativeVersion?: string;
  features: string[];
}

/**
 * Validates that a native handshake response carries a usable feature list.
 */
function isCapabilitiesPayload(data: unknown): data is CapabilitiesPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    'features' in data &&
    Array.isArray((data as { features: unknown }).features) &&
    (data as { features: unknown[] }).features.every((feature) => typeof feature === 'string')
  );
}

/**
 * Capabilities assumed for a native host that does not answer the handshake.
 * Such a host predates the protocol, so it supports the baseline features only.
 */
function legacyCapabilities(): Capabilities {
  return {
    protocolVersion: 0,
    nativeVersion: 'unknown',
    features: [...BASELINE_FEATURES],
    handshakeSupported: false,
  };
}

/**
 * Capabilities for a plain browser environment with no native host attached.
 */
function browserCapabilities(): Capabilities {
  return {
    protocolVersion: 0,
    nativeVersion: 'web',
    features: [],
    handshakeSupported: false,
  };
}

/**
 * Checks a feature or method identifier against a resolved capability set,
 * matching an exact identifier (`'push.getToken'`) or its namespace (`'push'`).
 */
function featureInSet(capabilities: Capabilities, feature: string): boolean {
  if (capabilities.features.includes(feature)) {
    return true;
  }
  const namespace = feature.split('.')[0];
  return capabilities.features.includes(namespace);
}

/**
 * Resolves the native host's capabilities, caching the result for the session.
 *
 * Outcomes:
 * - Browser (no native host): empty feature set, `handshakeSupported: false`.
 * - Legacy native host (no handshake response within `timeoutMs`): the baseline
 *   feature set, `handshakeSupported: false`.
 * - Modern native host: the reported capabilities, `handshakeSupported: true`.
 *
 * @param timeoutMs - Maximum wait for the handshake response. Defaults to 2000.
 * @returns The resolved capabilities. Never rejects.
 */
export function getCapabilities(timeoutMs = DEFAULT_HANDSHAKE_TIMEOUT): Promise<Capabilities> {
  if (cache) {
    return Promise.resolve(cache);
  }
  if (inFlight) {
    return inFlight;
  }

  if (!isNativeEnvironment()) {
    cache = browserCapabilities();
    return Promise.resolve(cache);
  }

  inFlight = (async () => {
    try {
      const data = await sendMessage<unknown>(
        'system.getCapabilities',
        { protocolVersion: PROTOCOL_VERSION },
        timeoutMs
      );
      cache = isCapabilitiesPayload(data)
        ? {
            protocolVersion: typeof data.protocolVersion === 'number' ? data.protocolVersion : 0,
            nativeVersion: typeof data.nativeVersion === 'string' ? data.nativeVersion : 'unknown',
            features: data.features,
            handshakeSupported: true,
          }
        : legacyCapabilities();
    } catch {
      cache = legacyCapabilities();
    } finally {
      inFlight = null;
    }
    return cache!;
  })();

  return inFlight;
}

/**
 * Reports whether the native host supports a given feature or method.
 * Matches an exact identifier (e.g. `'push.getToken'`) or its namespace
 * (e.g. `'push'`).
 *
 * @param feature - Feature namespace or method identifier to check.
 * @returns `true` if the host supports the feature.
 */
export async function supports(feature: string): Promise<boolean> {
  const capabilities = await getCapabilities();
  return featureInSet(capabilities, feature);
}

/**
 * Clears the cached capabilities so the next call re-probes. Intended for tests.
 */
export function resetCapabilitiesCache(): void {
  cache = null;
  inFlight = null;
}

/**
 * Registers the fail-fast guard with the bridge. Only acts once capabilities
 * have been resolved (cache warm); it never triggers a probe, so messages are
 * never blocked before the host's capabilities are known and no latency is
 * added to calls made before the handshake completes.
 */
setUnsupportedCheck((type) => (cache ? !featureInSet(cache, type) : false));
