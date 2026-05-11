/// <reference types="jest" />
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import { useInventoryStore } from '../inventoryStore';
import { api } from '../../services/http';

jest.mock('../../services/http', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  jest.useFakeTimers();
  useInventoryStore.getState().clear();
  mockApi.get.mockReset();
  mockApi.post.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('inventoryStore', () => {
  it('hydrates entries from the inventory list endpoint', async () => {
    mockApi.get.mockResolvedValue({
      data: { results: [{ id: 1, sticker: 10, count: 1 }] },
    });

    await useInventoryStore.getState().fetch('mundial-26');

    expect(useInventoryStore.getState().entries[10]?.count).toBe(1);
    expect(useInventoryStore.getState().loaded).toBe(true);
  });

  it('increments the local count on tap and schedules a debounced flush', async () => {
    mockApi.post.mockResolvedValue({ data: {} });

    useInventoryStore.getState().tap(42);
    expect(useInventoryStore.getState().entries[42]?.count).toBe(1);

    useInventoryStore.getState().tap(42);
    expect(useInventoryStore.getState().entries[42]?.count).toBe(2);

    expect(mockApi.post).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2000);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockApi.post).toHaveBeenCalledWith('inventory/bulk/', {
      items: [{ sticker: 42, count: 2 }],
    });
  });

  it('long-press resets the local count to 0', () => {
    useInventoryStore.getState().tap(7);
    useInventoryStore.getState().tap(7);
    expect(useInventoryStore.getState().entries[7]?.count).toBe(2);

    useInventoryStore.getState().longPressReset(7);
    expect(useInventoryStore.getState().entries[7]?.count).toBe(0);
  });

  it('flush is a no-op when there are no pending taps', async () => {
    await useInventoryStore.getState().flush();
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it('records an error when the bulk sync fails', async () => {
    mockApi.post.mockRejectedValue(new Error('500'));
    useInventoryStore.getState().tap(1);

    await expect(useInventoryStore.getState().flush()).rejects.toThrow('500');
    expect(useInventoryStore.getState().syncError).toBe('sync_failed');
  });
});
