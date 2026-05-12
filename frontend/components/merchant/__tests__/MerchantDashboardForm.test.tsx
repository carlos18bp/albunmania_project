/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/lib/stores/merchantStore', () => ({ __esModule: true, useMerchantStore: jest.fn() }));

import { useMerchantStore } from '@/lib/stores/merchantStore';
import MerchantDashboardForm from '../MerchantDashboardForm';

const mockUseMerchantStore = useMerchantStore as unknown as jest.Mock;

type StoreShape = {
  dashboard: Record<string, unknown> | null;
  fetchDashboard: jest.Mock;
  updateDashboard: jest.Mock;
  loading: boolean;
};
let storeState: StoreShape;

const dashboard = {
  business_name: 'Papelería El Sol',
  business_type: 'papeleria',
  address: 'Cra 7 # 50-15, Bogotá',
  declared_stock: 'Sobres disponibles',
  subscription_status: 'active',
  subscription_expires_at: '2026-06-01T00:00:00Z',
};

beforeEach(() => {
  storeState = {
    dashboard: null,
    fetchDashboard: jest.fn(),
    updateDashboard: jest.fn().mockResolvedValue(undefined),
    loading: false,
  };
  mockUseMerchantStore.mockImplementation((sel: (s: StoreShape) => unknown) => sel(storeState));
});

describe('MerchantDashboardForm', () => {
  it('shows the loading state and fetches the dashboard when none is cached', () => {
    render(<MerchantDashboardForm />);

    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(storeState.fetchDashboard).toHaveBeenCalledTimes(1);
  });

  it('pre-populates the form fields from the dashboard', () => {
    storeState.dashboard = dashboard;
    render(<MerchantDashboardForm />);

    expect(screen.getByTestId('merchant-business-name')).toHaveValue('Papelería El Sol');
    expect(screen.getByTestId('merchant-address')).toHaveValue('Cra 7 # 50-15, Bogotá');
  });

  it('shows the "activa" badge for an active subscription', () => {
    storeState.dashboard = dashboard;
    render(<MerchantDashboardForm />);

    expect(screen.getByTestId('merchant-subscription-badge')).toHaveTextContent('Suscripción activa');
  });

  it('shows the "inactiva" badge for an expired subscription', () => {
    storeState.dashboard = { ...dashboard, subscription_status: 'expired' };
    render(<MerchantDashboardForm />);

    expect(screen.getByTestId('merchant-subscription-badge')).toHaveTextContent('Suscripción inactiva');
  });

  it('submits the edited fields and confirms the save', async () => {
    storeState.dashboard = dashboard;
    render(<MerchantDashboardForm />);

    fireEvent.change(screen.getByTestId('merchant-declared-stock'), { target: { value: 'Llegada actualizada' } });
    fireEvent.submit(screen.getByTestId('merchant-dashboard-form'));

    await waitFor(() => expect(screen.getByTestId('merchant-saved')).toBeInTheDocument());
    expect(storeState.updateDashboard).toHaveBeenCalledWith(expect.objectContaining({
      business_name: 'Papelería El Sol',
      declared_stock: 'Llegada actualizada',
    }));
  });
});
