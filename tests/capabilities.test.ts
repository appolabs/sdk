import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initializeBridge, handleNativeMessage } from '../src/bridge';
import {
  getCapabilities,
  supports,
  resetCapabilitiesCache,
  PROTOCOL_VERSION,
  BASELINE_FEATURES,
} from '../src/capabilities';

beforeEach(() => {
  (globalThis as any).window = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    ReactNativeWebView: null,
    appo: undefined,
  };
  resetCapabilitiesCache();
});

afterEach(() => {
  vi.useRealTimers();
});

function setupNativeEnv() {
  const postMessageSpy = vi.fn();
  (globalThis as any).window.ReactNativeWebView = { postMessage: postMessageSpy };
  return postMessageSpy;
}

function simulateNativeResponse(response: {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}) {
  handleNativeMessage(new MessageEvent('message', { data: JSON.stringify(response) }));
}

describe('capabilities', () => {
  describe('browser environment', () => {
    it('returns an empty feature set with no native host', async () => {
      const caps = await getCapabilities();

      expect(caps.handshakeSupported).toBe(false);
      expect(caps.protocolVersion).toBe(0);
      expect(caps.nativeVersion).toBe('web');
      expect(caps.features).toEqual([]);
    });

    it('supports() returns false for any feature in a browser', async () => {
      expect(await supports('push')).toBe(false);
      expect(await supports('storage')).toBe(false);
    });
  });

  describe('modern native host', () => {
    it('sends system.getCapabilities with the SDK protocol version', async () => {
      const postMessageSpy = setupNativeEnv();
      initializeBridge();

      const promise = getCapabilities();
      const sent = JSON.parse(postMessageSpy.mock.calls[0][0]);

      expect(sent.type).toBe('system.getCapabilities');
      expect(sent.payload).toEqual({ protocolVersion: PROTOCOL_VERSION });

      simulateNativeResponse({ id: sent.id, success: true, data: { features: [] } });
      await promise;
    });

    it('resolves the reported capabilities', async () => {
      const postMessageSpy = setupNativeEnv();
      initializeBridge();

      const promise = getCapabilities();
      const sent = JSON.parse(postMessageSpy.mock.calls[0][0]);

      simulateNativeResponse({
        id: sent.id,
        success: true,
        data: { protocolVersion: 2, nativeVersion: '3.4.5', features: ['push', 'clipboard'] },
      });

      const caps = await promise;
      expect(caps.handshakeSupported).toBe(true);
      expect(caps.protocolVersion).toBe(2);
      expect(caps.nativeVersion).toBe('3.4.5');
      expect(caps.features).toEqual(['push', 'clipboard']);
    });

    it('supports() matches an exact feature and a namespace prefix', async () => {
      const postMessageSpy = setupNativeEnv();
      initializeBridge();

      const promise = getCapabilities();
      const sent = JSON.parse(postMessageSpy.mock.calls[0][0]);
      simulateNativeResponse({
        id: sent.id,
        success: true,
        data: { features: ['push', 'clipboard'] },
      });
      await promise;

      expect(await supports('clipboard')).toBe(true);
      expect(await supports('push.getToken')).toBe(true);
      expect(await supports('biometrics')).toBe(false);
    });

    it('falls back to baseline when the response payload is malformed', async () => {
      const postMessageSpy = setupNativeEnv();
      initializeBridge();

      const promise = getCapabilities();
      const sent = JSON.parse(postMessageSpy.mock.calls[0][0]);
      simulateNativeResponse({ id: sent.id, success: true, data: { features: 'nope' } });

      const caps = await promise;
      expect(caps.handshakeSupported).toBe(false);
      expect(caps.features).toEqual([...BASELINE_FEATURES]);
    });
  });

  describe('legacy native host', () => {
    it('assumes the baseline feature set when the handshake times out', async () => {
      vi.useFakeTimers();
      setupNativeEnv();
      initializeBridge();

      const promise = getCapabilities(50);
      await vi.advanceTimersByTimeAsync(50);

      const caps = await promise;
      expect(caps.handshakeSupported).toBe(false);
      expect(caps.protocolVersion).toBe(0);
      expect(caps.nativeVersion).toBe('unknown');
      expect(caps.features).toEqual([...BASELINE_FEATURES]);
    });

    it('supports() reflects the baseline on a legacy host', async () => {
      vi.useFakeTimers();
      setupNativeEnv();
      initializeBridge();

      const promise = getCapabilities(50);
      await vi.advanceTimersByTimeAsync(50);
      await promise;

      expect(await supports('push')).toBe(true);
      expect(await supports('device')).toBe(true);
      expect(await supports('clipboard')).toBe(false);
    });

    it('assumes the baseline when the host returns a native error', async () => {
      const postMessageSpy = setupNativeEnv();
      initializeBridge();

      const promise = getCapabilities();
      const sent = JSON.parse(postMessageSpy.mock.calls[0][0]);
      simulateNativeResponse({ id: sent.id, success: false, error: 'unknown type' });

      const caps = await promise;
      expect(caps.handshakeSupported).toBe(false);
      expect(caps.features).toEqual([...BASELINE_FEATURES]);
    });
  });

  describe('caching', () => {
    it('probes the native host only once across calls', async () => {
      const postMessageSpy = setupNativeEnv();
      initializeBridge();

      const promise = getCapabilities();
      const sent = JSON.parse(postMessageSpy.mock.calls[0][0]);
      simulateNativeResponse({ id: sent.id, success: true, data: { features: ['push'] } });
      await promise;

      await getCapabilities();
      await supports('push');

      expect(postMessageSpy).toHaveBeenCalledOnce();
    });

    it('dedupes concurrent probes into a single request', async () => {
      const postMessageSpy = setupNativeEnv();
      initializeBridge();

      const first = getCapabilities();
      const second = getCapabilities();

      const sent = JSON.parse(postMessageSpy.mock.calls[0][0]);
      simulateNativeResponse({ id: sent.id, success: true, data: { features: ['push'] } });

      await Promise.all([first, second]);
      expect(postMessageSpy).toHaveBeenCalledOnce();
    });

    it('re-probes after the cache is reset', async () => {
      const postMessageSpy = setupNativeEnv();
      initializeBridge();

      const promise = getCapabilities();
      const sent = JSON.parse(postMessageSpy.mock.calls[0][0]);
      simulateNativeResponse({ id: sent.id, success: true, data: { features: ['push'] } });
      await promise;

      resetCapabilitiesCache();
      const promise2 = getCapabilities();
      const sent2 = JSON.parse(postMessageSpy.mock.calls[1][0]);
      simulateNativeResponse({ id: sent2.id, success: true, data: { features: ['push'] } });
      await promise2;

      expect(postMessageSpy).toHaveBeenCalledTimes(2);
    });
  });
});
