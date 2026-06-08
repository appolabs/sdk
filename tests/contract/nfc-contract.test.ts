import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { readFileSync } from 'fs';
import {
  setupIntegrationEnv,
  simulateNativeResponse,
  cleanupIntegrationEnv,
} from '../integration/setup';

interface ContractCase {
  name: string;
  method: 'isAvailable' | 'readTag' | 'writeTag';
  type: string;
  args: { options?: Record<string, unknown>; records?: unknown[] };
  requestPayload: Record<string, unknown> | null;
  responseData: unknown;
}

const contract = JSON.parse(
  readFileSync('tests/contract/nfc-contract.json', 'utf-8'),
) as { cases: ContractCase[] };

describe('nfc bridge contract (SDK side)', () => {
  let postMessageSpy: Mock;

  beforeEach(async () => {
    const env = await setupIntegrationEnv();
    postMessageSpy = env.postMessageSpy as Mock;
  });

  afterEach(() => {
    cleanupIntegrationEnv();
  });

  for (const c of contract.cases) {
    it(`${c.name}: emits ${c.type} and resolves the contract shape`, async () => {
      const { createNfcApi } = await import('../../src/features/nfc');
      const nfc = createNfcApi();

      let promise: Promise<unknown>;
      if (c.method === 'isAvailable') {
        promise = nfc.isAvailable();
      } else if (c.method === 'readTag') {
        promise = nfc.readTag(c.args.options as never);
      } else {
        promise = nfc.writeTag(c.args.records as never, c.args.options as never);
      }

      const sent = JSON.parse(postMessageSpy.mock.calls[0][0]);
      expect(sent.type).toBe(c.type);
      expect(sent.payload ?? null).toEqual(c.requestPayload);

      simulateNativeResponse({
        id: sent.id,
        success: true,
        data: c.responseData ?? undefined,
      });

      const result = await promise;
      expect(result ?? null).toEqual(c.responseData);
    });
  }
});
