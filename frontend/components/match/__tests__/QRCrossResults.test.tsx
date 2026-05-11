/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import QRCrossResults from '../QRCrossResults';
import { useQRStore } from '../../../lib/stores/qrStore';

jest.mock('../../../lib/services/http', () => ({
  api: { get: jest.fn(), post: jest.fn().mockResolvedValue({ data: { match_id: 7, trade_id: 9 } }) },
}));

jest.mock('idb-keyval', () => ({
  get: jest.fn().mockResolvedValue(undefined),
  set: jest.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  useQRStore.getState().clear();
});

describe('QRCrossResults', () => {
  it('renders empty state when there are no compatible stickers', () => {
    render(
      <QRCrossResults
        cross={{ a_to_b: [], b_to_a: [] }}
        meId={1}
        otherId={2}
        onConfirmed={jest.fn()}
      />,
    );
    expect(screen.getByTestId('cross-empty')).toBeInTheDocument();
  });

  it('lists give and receive sections with counts', () => {
    render(
      <QRCrossResults
        cross={{ a_to_b: [{ sticker_id: 1 }], b_to_a: [{ sticker_id: 2 }, { sticker_id: 3 }] }}
        meId={1}
        otherId={2}
        onConfirmed={jest.fn()}
      />,
    );
    expect(screen.getByText('Tú das (1)')).toBeInTheDocument();
    expect(screen.getByText('Recibes (2)')).toBeInTheDocument();
  });

  it('confirms the trade and notifies the parent with the match id', async () => {
    const user = userEvent.setup();
    const onConfirmed = jest.fn();
    render(
      <QRCrossResults
        cross={{ a_to_b: [{ sticker_id: 1 }], b_to_a: [{ sticker_id: 2 }] }}
        meId={1}
        otherId={2}
        onConfirmed={onConfirmed}
      />,
    );

    await user.click(screen.getByTestId('cross-confirm'));
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledWith(7));
  });
});
