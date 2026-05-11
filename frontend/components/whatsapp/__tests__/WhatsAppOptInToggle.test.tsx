/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import WhatsAppOptInToggle from '../WhatsAppOptInToggle';
import { useTradeWhatsAppStore } from '../../../lib/stores/tradeWhatsAppStore';

jest.mock('../../../lib/services/http', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn().mockResolvedValue({ data: { opted_in: true, both_opted_in: false } }),
  },
}));

beforeEach(() => {
  useTradeWhatsAppStore.getState().clear();
});

describe('WhatsAppOptInToggle', () => {
  it('starts unchecked by default', () => {
    render(<WhatsAppOptInToggle tradeId={1} />);
    const checkbox = screen.getByTestId('whatsapp-optin-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('calls setOptIn and notifies parent on change', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<WhatsAppOptInToggle tradeId={1} onChange={onChange} />);
    await user.click(screen.getByTestId('whatsapp-optin-checkbox'));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({
      opted_in: true, both_opted_in: false,
    }));
  });
});
