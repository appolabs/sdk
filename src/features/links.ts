import type { LinksApi } from '../types';
import { sendMessage, addEventListener, isNativeEnvironment } from '../bridge';

/**
 * Creates the deep link API.
 * Deep links have no browser equivalent, so methods degrade to safe no-ops.
 */
export function createLinksApi(): LinksApi {
  return {
    /**
     * Retrieves the deep link URL that initially launched the app, if any.
     * @returns The launch URL, or `null` if the app was not opened from a link. Returns `null` in browser.
     */
    async getInitial(): Promise<string | null> {
      if (!isNativeEnvironment()) {
        return null;
      }
      return sendMessage<string | null>('links.getInitial');
    },

    /**
     * Subscribes to incoming deep links on the `links.open` channel while the app is running.
     * @param callback - Invoked with the URL each time the app is opened via a deep link.
     * @returns Unsubscribe function to remove the listener. A no-op in browser.
     */
    onOpen(callback: (url: string) => void): () => void {
      if (!isNativeEnvironment()) {
        return () => {};
      }
      return addEventListener('links.open', (data) => {
        callback(data as string);
      });
    },
  };
}
