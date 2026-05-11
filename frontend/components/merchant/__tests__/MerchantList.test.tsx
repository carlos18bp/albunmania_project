/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MerchantList from '../MerchantList';
import type { Merchant } from '../../../lib/stores/merchantStore';

const m: Merchant = {
  user_id: 1,
  business_name: 'Papelería X',
  business_type: 'papeleria',
  address: 'Cra 7 # 1-2',
  lat: 4.7,
  lng: -74.0,
  opening_hours: {},
  is_listing_visible: true,
};

describe('MerchantList', () => {
  it('renders empty state when there are no merchants', () => {
    render(<MerchantList merchants={[]} />);
    expect(screen.getByTestId('merchant-list-empty')).toBeInTheDocument();
  });

  it('renders one row per merchant', () => {
    render(<MerchantList merchants={[m]} />);
    expect(screen.getByText('Papelería X')).toBeInTheDocument();
  });

  it('fires onSelect when a merchant is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<MerchantList merchants={[m]} onSelect={onSelect} />);
    await user.click(screen.getByText('Papelería X'));
    expect(onSelect).toHaveBeenCalledWith(m);
  });
});
