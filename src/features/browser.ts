import type { BrowserApi, BrowserResult, BrowserOpenOptions } from '../types';
import { sendMessage, isNativeEnvironment } from '../bridge';

/**
 * Creates the in-app browser API.
 * Falls back to `window.open` when not in a native environment.
 */
export function createBrowserApi(): BrowserApi {
  return {
    /**
     * Opens a URL in the native in-app browser.
     * In browser, opens a new tab via `window.open`.
     * @param url - The URL to open.
     * @param options - Optional presentation options for the in-app browser.
     * @returns The result describing how the browser session ended.
     */
    async open(url: string, options?: BrowserOpenOptions): Promise<BrowserResult> {
      if (!isNativeEnvironment()) {
        if (typeof window !== 'undefined' && typeof window.open === 'function') {
          window.open(url, '_blank', 'noopener,noreferrer');
          return { type: 'opened' };
        }
        return { type: 'cancel' };
      }
      return sendMessage<BrowserResult>('browser.open', { url, options });
    },

    /**
     * Opens a URL in the device's default browser or associated app.
     * In browser, opens a new tab via `window.open`.
     * @param url - The URL to open externally.
     * @returns Resolves once the URL has been handed off to the system.
     */
    async openSystem(url: string): Promise<void> {
      if (!isNativeEnvironment()) {
        if (typeof window !== 'undefined' && typeof window.open === 'function') {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        return;
      }
      return sendMessage<void>('browser.openSystem', { url });
    },
  };
}
