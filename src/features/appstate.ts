import type { AppStateApi, AppStateStatus } from '../types';
import { sendMessage, addEventListener, isNativeEnvironment } from '../bridge';

/**
 * Maps the browser document visibility to an app state status.
 */
function visibilityState(): AppStateStatus {
  if (typeof document !== 'undefined' && document.hidden) {
    return 'background';
  }
  return 'active';
}

/**
 * Creates the app lifecycle (foreground/background) API.
 * Falls back to the browser `document.visibilitychange` event when not in a native environment.
 */
export function createAppStateApi(): AppStateApi {
  return {
    /**
     * Retrieves the current app lifecycle state.
     * In browser, derives the state from `document.visibilityState`.
     * @returns `'active'`, `'background'`, or `'inactive'`.
     */
    async getCurrent(): Promise<AppStateStatus> {
      if (!isNativeEnvironment()) {
        return visibilityState();
      }
      return sendMessage<AppStateStatus>('appState.getCurrent');
    },

    /**
     * Subscribes to app lifecycle changes on the `appState.change` channel.
     * In browser, listens to the `visibilitychange` event, mapping visible to
     * `'active'` and hidden to `'background'`.
     * @param callback - Invoked with the new state on each change.
     * @returns Unsubscribe function to remove the listener.
     */
    onChange(callback: (state: AppStateStatus) => void): () => void {
      if (!isNativeEnvironment()) {
        if (typeof document === 'undefined') {
          return () => {};
        }
        const handler = () => callback(visibilityState());
        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
      }
      return addEventListener('appState.change', (data) => {
        callback(data as AppStateStatus);
      });
    },
  };
}
