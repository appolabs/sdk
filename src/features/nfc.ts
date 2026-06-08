import type {
  NfcApi,
  NfcTag,
  NdefRecord,
  NfcReadOptions,
  NfcWriteOptions,
} from '../types';
import { sendMessage, addEventListener, isNativeEnvironment } from '../bridge';

/**
 * Creates the NFC API.
 * Returns browser fallbacks when not in a native environment.
 */
export function createNfcApi(): NfcApi {
  return {
    /**
     * Checks whether NFC is supported and enabled on the device.
     * @returns `true` when NFC can be used. Returns `false` in browser.
     */
    async isAvailable(): Promise<boolean> {
      if (!isNativeEnvironment()) {
        return false;
      }
      return sendMessage<boolean>('nfc.isAvailable');
    },

    /**
     * Opens an NFC session and reads the next NDEF tag.
     * @param options - Optional iOS scan-sheet message and session behavior.
     * @returns The scanned tag with decoded NDEF records.
     * @throws {Error} When called outside a native environment.
     */
    async readTag(options?: NfcReadOptions): Promise<NfcTag> {
      if (!isNativeEnvironment()) {
        throw new Error('NFC not available outside native environment');
      }
      return sendMessage<NfcTag>('nfc.readTag', options ?? {});
    },

    /**
     * Opens an NFC session and writes the given NDEF records to the next tag.
     * @param records - The NDEF records to encode and write.
     * @param options - Optional iOS scan-sheet message.
     * @throws {Error} When called outside a native environment.
     */
    async writeTag(
      records: NdefRecord[],
      options?: NfcWriteOptions,
    ): Promise<void> {
      if (!isNativeEnvironment()) {
        throw new Error('NFC not available outside native environment');
      }
      await sendMessage<void>('nfc.writeTag', { records, ...(options ?? {}) });
    },

    /**
     * Subscribes to passive tag-discovery events on the `nfc.tag` channel.
     * Fires when a tag is detected outside an explicit read session.
     * @param callback - Invoked with the discovered tag.
     * @returns Unsubscribe function to remove the listener.
     */
    onTag(callback: (tag: NfcTag) => void): () => void {
      return addEventListener('nfc.tag', (data) => {
        callback(data as NfcTag);
      });
    },
  };
}
