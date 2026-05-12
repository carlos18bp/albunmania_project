/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/stores/tradeWhatsAppStore', () => ({
  __esModule: true,
  useTradeWhatsAppStore: jest.fn(),
}));

import { useTradeWhatsAppStore } from '@/lib/stores/tradeWhatsAppStore';
import WhatsAppLinkButton from '../WhatsAppLinkButton';

const mockUseStore = useTradeWhatsAppStore as unknown as jest.Mock;

type StoreShape = { fetchLink: jest.Mock };
let storeState: StoreShape;

beforeEach(() => {
  storeState = { fetchLink: jest.fn().mockResolvedValue('https://wa.me/573001112222?text=hola') };
  mockUseStore.mockImplementation((selector: (s: StoreShape) => unknown) => selector(storeState));
});

describe('WhatsAppLinkButton', () => {
  it('renders the disabled placeholder when not enabled', () => {
    render(<WhatsAppLinkButton tradeId={1} enabled={false} />);

    expect(screen.getByTestId('whatsapp-link-disabled')).toBeInTheDocument();
    expect(screen.queryByTestId('whatsapp-link')).not.toBeInTheDocument();
  });

  it('does not fetch the link while disabled', () => {
    render(<WhatsAppLinkButton tradeId={1} enabled={false} />);

    expect(storeState.fetchLink).not.toHaveBeenCalled();
  });

  it('fetches the deep link once enabled', () => {
    render(<WhatsAppLinkButton tradeId={7} enabled />);

    expect(storeState.fetchLink).toHaveBeenCalledWith(7);
  });

  it('shows the loading button until the link resolves', () => {
    storeState.fetchLink = jest.fn(() => new Promise<string>(() => undefined)); // never resolves
    render(<WhatsAppLinkButton tradeId={1} enabled />);

    expect(screen.getByTestId('whatsapp-link-loading')).toBeInTheDocument();
  });

  it('renders the wa.me anchor once the link resolves', async () => {
    render(<WhatsAppLinkButton tradeId={1} enabled />);

    const link = await screen.findByTestId('whatsapp-link');
    expect(link).toHaveAttribute('href', 'https://wa.me/573001112222?text=hola');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
