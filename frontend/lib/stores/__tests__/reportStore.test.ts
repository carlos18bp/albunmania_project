/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('@/lib/services/http', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import { api } from '@/lib/services/http';
import { useReportStore, type Report } from '../reportStore';

const mockGet = api.get as unknown as jest.Mock;
const mockPost = api.post as unknown as jest.Mock;
const mockPatch = api.patch as unknown as jest.Mock;

const report = (id: number, status: Report['status'] = 'pending'): Report => ({
  id,
  reporter: 10,
  reporter_email: 'a@example.com',
  target_kind: 'user',
  target_user: 11,
  target_trade: null,
  reason: 'fake_profile',
  detail: '',
  status,
  resolved_by: null,
  resolved_by_email: null,
  resolved_at: null,
  resolution_notes: '',
  created_at: new Date().toISOString(),
});

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
  mockPatch.mockReset();
  useReportStore.getState().clear();
});

describe('reportStore', () => {
  it('submitReport POSTs /reports/ with the target + reason + detail', async () => {
    mockPost.mockResolvedValue({ data: report(1) });

    const result = await useReportStore.getState().submitReport('user', 11, 'fake_profile', 'parece bot');

    expect(mockPost).toHaveBeenCalledWith('reports/', { target_kind: 'user', target_id: 11, reason: 'fake_profile', detail: 'parece bot' });
    expect(result.id).toBe(1);
  });

  it('fetchReports loads the admin queue', async () => {
    mockGet.mockResolvedValue({ data: { results: [report(1), report(2)] } });

    const reports = await useReportStore.getState().fetchReports({ status: 'pending', kind: 'user' });

    expect(mockGet).toHaveBeenCalledWith('admin/reports/', { params: { status: 'pending', kind: 'user' } });
    expect(reports).toHaveLength(2);
    expect(useReportStore.getState().reports).toHaveLength(2);
  });

  it('records an error flag when the admin fetch fails', async () => {
    mockGet.mockRejectedValue(new Error('boom'));
    await expect(useReportStore.getState().fetchReports()).rejects.toThrow();
    expect(useReportStore.getState().error).toBe('fetch_reports_failed');
  });

  it('resolveReport PATCHes the report and updates it in the list', async () => {
    mockGet.mockResolvedValue({ data: { results: [report(1), report(2)] } });
    await useReportStore.getState().fetchReports();
    mockPatch.mockResolvedValue({ data: report(1, 'actioned') });

    const updated = await useReportStore.getState().resolveReport(1, 'actioned', 'cuenta suspendida');

    expect(mockPatch).toHaveBeenCalledWith('admin/reports/1/', { status: 'actioned', resolution_notes: 'cuenta suspendida' });
    expect(updated.status).toBe('actioned');
    expect(useReportStore.getState().reports.find((r) => r.id === 1)!.status).toBe('actioned');
  });
});
