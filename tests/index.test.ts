import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { initAppo, getAppo, VERSION } from '../src/index';

const expectedVersion = JSON.parse(readFileSync('./package.json', 'utf-8')).version;

// Mock window environment
const mockLocalStorage = {
  _data: {} as Record<string, string>,
  getItem(k: string) { return this._data[k] || null; },
  setItem(k: string, v: string) { this._data[k] = v; },
  removeItem(k: string) { delete this._data[k]; },
  clear() { this._data = {}; },
};

beforeEach(() => {
  // Reset window.appo before each test
  if (typeof window !== 'undefined') {
    (window as any).appo = undefined;
  }

  // Setup minimal window mock
  (globalThis as any).window = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    ReactNativeWebView: null,
    localStorage: mockLocalStorage,
    appo: undefined,
  };
  (globalThis as any).localStorage = mockLocalStorage;
  mockLocalStorage.clear();
});

describe('@appolabs/sdk', () => {
  describe('exports', () => {
    it('exports VERSION matching package.json', () => {
      expect(VERSION).toBe(expectedVersion);
    });

    it('exports initAppo function', () => {
      expect(typeof initAppo).toBe('function');
    });

    it('exports getAppo function', () => {
      expect(typeof getAppo).toBe('function');
    });
  });

  describe('initAppo', () => {
    it('creates appo instance', () => {
      const appo = initAppo();
      expect(appo).toBeDefined();
      expect(appo.version).toBe(expectedVersion);
    });

    it('sets isNative to false when not in native environment', () => {
      const appo = initAppo();
      expect(appo.isNative).toBe(false);
    });

    it('attaches to window.appo', () => {
      const appo = initAppo();
      expect((globalThis as any).window.appo).toBe(appo);
    });

    it('returns existing instance if already initialized', () => {
      const first = initAppo();
      const second = initAppo();
      expect(first).toBe(second);
    });
  });

  describe('getAppo', () => {
    it('initializes and returns appo instance', () => {
      const appo = getAppo();
      expect(appo).toBeDefined();
      expect(appo.version).toBe(expectedVersion);
    });
  });

  describe('APIs availability', () => {
    it('has all expected APIs', () => {
      const appo = initAppo();

      expect(appo.push).toBeDefined();
      expect(appo.biometrics).toBeDefined();
      expect(appo.camera).toBeDefined();
      expect(appo.location).toBeDefined();
      expect(appo.haptics).toBeDefined();
      expect(appo.storage).toBeDefined();
      expect(appo.share).toBeDefined();
      expect(appo.network).toBeDefined();
      expect(appo.device).toBeDefined();
      expect(appo.clipboard).toBeDefined();
      expect(appo.appState).toBeDefined();
    });
  });

  describe('non-native fallbacks', () => {
    it('push.requestPermission returns denied', async () => {
      const appo = initAppo();
      const result = await appo.push.requestPermission();
      expect(result).toBe('denied');
    });

    it('push.getToken returns null', async () => {
      const appo = initAppo();
      const result = await appo.push.getToken();
      expect(result).toBeNull();
    });

    it('push.setBadgeCount resolves without a Badging API', async () => {
      const appo = initAppo();
      await expect(appo.push.setBadgeCount(3)).resolves.toBeUndefined();
    });

    it('push.clearNotifications resolves', async () => {
      const appo = initAppo();
      await expect(appo.push.clearNotifications()).resolves.toBeUndefined();
    });

    it('biometrics.isAvailable returns false', async () => {
      const appo = initAppo();
      const result = await appo.biometrics.isAvailable();
      expect(result).toBe(false);
    });

    it('biometrics.authenticate returns false', async () => {
      const appo = initAppo();
      const result = await appo.biometrics.authenticate('test');
      expect(result).toBe(false);
    });

    it('storage uses localStorage fallback', async () => {
      const appo = initAppo();

      await appo.storage.set('test-key', 'test-value');
      const value = await appo.storage.get('test-key');
      expect(value).toBe('test-value');

      await appo.storage.delete('test-key');
      const deleted = await appo.storage.get('test-key');
      expect(deleted).toBeNull();
    });

    it('camera.requestPermission returns denied', async () => {
      const appo = initAppo();
      const result = await appo.camera.requestPermission();
      expect(result).toBe('denied');
    });

    it('camera.pickImage rejects outside native environment', async () => {
      const appo = initAppo();
      await expect(appo.camera.pickImage()).rejects.toThrow();
    });

    it('location.requestPermission returns denied', async () => {
      const appo = initAppo();
      const result = await appo.location.requestPermission();
      expect(result).toBe('denied');
    });

    it('haptics.impact does not throw', () => {
      const appo = initAppo();
      expect(() => appo.haptics.impact('medium')).not.toThrow();
    });

    it('haptics.notification does not throw', () => {
      const appo = initAppo();
      expect(() => appo.haptics.notification('success')).not.toThrow();
    });

    it('clipboard.getString returns empty string without navigator.clipboard', async () => {
      const appo = initAppo();
      const result = await appo.clipboard.getString();
      expect(result).toBe('');
    });

    it('clipboard.hasString returns false', async () => {
      const appo = initAppo();
      const result = await appo.clipboard.hasString();
      expect(result).toBe(false);
    });

    it('clipboard.setString rejects without navigator.clipboard', async () => {
      const appo = initAppo();
      await expect(appo.clipboard.setString('x')).rejects.toThrow();
    });

    it('appState.getCurrent returns active without a document', async () => {
      const appo = initAppo();
      const result = await appo.appState.getCurrent();
      expect(result).toBe('active');
    });

    it('appState.onChange returns a no-op unsubscribe without a document', () => {
      const appo = initAppo();
      const unsubscribe = appo.appState.onChange(vi.fn());
      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });
  });
});
