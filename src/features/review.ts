import type { ReviewApi } from '../types';
import { sendMessage, isNativeEnvironment } from '../bridge';

/**
 * Creates the in-app store review API.
 * All methods degrade safely when not in a native environment.
 */
export function createReviewApi(): ReviewApi {
  return {
    /**
     * Reports whether the in-app review prompt can be shown.
     * @returns `true` if available. Returns `false` in browser.
     */
    async isAvailable(): Promise<boolean> {
      if (!isNativeEnvironment()) {
        return false;
      }
      return sendMessage<boolean>('review.isAvailable');
    },

    /**
     * Requests the native in-app store review prompt. The OS decides whether to
     * actually display it, so this may resolve without showing anything.
     * No-op in browser.
     * @returns Resolves once the request has been made.
     */
    async request(): Promise<void> {
      if (!isNativeEnvironment()) {
        return;
      }
      return sendMessage<void>('review.request');
    },
  };
}
