import type { ClipboardApi } from '../types';
import { sendMessage, isNativeEnvironment } from '../bridge';

/**
 * Creates the clipboard API.
 * Falls back to the browser `navigator.clipboard` API when not in a native environment.
 */
export function createClipboardApi(): ClipboardApi {
  return {
    /**
     * Reads the current text contents of the clipboard.
     * In browser, uses `navigator.clipboard.readText()` when available; otherwise returns `''`.
     * @returns The clipboard text, or an empty string if empty or unavailable.
     */
    async getString(): Promise<string> {
      if (!isNativeEnvironment()) {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
          return navigator.clipboard.readText();
        }
        return '';
      }
      return sendMessage<string>('clipboard.getString');
    },

    /**
     * Writes text to the clipboard.
     * In browser, uses `navigator.clipboard.writeText()` when available.
     * @param text - The text to copy to the clipboard.
     * @returns Resolves when the text is written.
     * @throws {Error} In a browser without the `navigator.clipboard.writeText` API.
     */
    async setString(text: string): Promise<void> {
      if (!isNativeEnvironment()) {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return;
        }
        throw new Error('Clipboard write not available outside native environment');
      }
      return sendMessage<void>('clipboard.setString', { text });
    },

    /**
     * Reports whether the clipboard currently contains text.
     * In browser, returns `false` to avoid triggering a read-permission prompt.
     * @returns `true` if the clipboard holds text.
     */
    async hasString(): Promise<boolean> {
      if (!isNativeEnvironment()) {
        return false;
      }
      return sendMessage<boolean>('clipboard.hasString');
    },
  };
}
