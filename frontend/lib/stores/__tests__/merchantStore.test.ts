/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

import { useMerchantStore } from '../merchantStore';
import { api } from '../../services/http';

jest.mock('../../services/http', () => ({
  api: { get: jest.fn(), patch: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  useMerchantStore.getState().clear();
  mockApi.get.mockReset();
  mockApi.patch.mockReset();
});

describe('merchantStore', () => {
  it('hydrates the public list and forwards filters', async () => {
    mockApi.get.mockResolvedValue({ data: { results: [{ user_id: 1, business_name: 'X' }] } });
    await useMerchantStore.getState().fetchList({ city: 'Bogotá' });
    expect(mockApi.get).toHaveBeenCalledWith('merchants/', { params: { city: 'Bogotá' } });
    expect(useMerchantStore.getState().list).toHaveLength(1);
  });

  it('records dashboard from /merchants/me/', async () => {
    mockApi.get.mockResolvedValue({ data: { business_name: 'Y' } });
    await useMerchantStore.getState().fetchDashboard();
    expect(useMerchantStore.getState().dashboard?.business_name).toBe('Y');
  });

  it('updateDashboard PATCHes and updates state', async () => {
    mockApi.patch.mockResolvedValue({ data: { business_name: 'Z' } });
    await useMerchantStore.getState().updateDashboard({ business_name: 'Z' });
    expect(mockApi.patch).toHaveBeenCalledWith('merchants/me/', { business_name: 'Z' });
    expect(useMerchantStore.getState().dashboard?.business_name).toBe('Z');
  });

  it('records error when fetchList fails', async () => {
    mockApi.get.mockRejectedValue(new Error('boom'));
    await expect(useMerchantStore.getState().fetchList()).rejects.toThrow('boom');
    expect(useMerchantStore.getState().error).toBe('fetch_list_failed');
  });
});
