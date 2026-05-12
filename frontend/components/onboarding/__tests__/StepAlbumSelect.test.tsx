/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/lib/stores/onboardingStore', () => ({ __esModule: true, useOnboardingStore: jest.fn() }));

import { useOnboardingStore } from '@/lib/stores/onboardingStore';
import StepAlbumSelect from '../StepAlbumSelect';

const mockUseOnboardingStore = useOnboardingStore as unknown as jest.Mock;

type StoreShape = { activeAlbumId: number | null; setActiveAlbum: jest.Mock };
let storeState: StoreShape;

beforeEach(() => {
  storeState = { activeAlbumId: null, setActiveAlbum: jest.fn() };
  mockUseOnboardingStore.mockImplementation((sel: (s: StoreShape) => unknown) => sel(storeState));
});

describe('StepAlbumSelect', () => {
  it('renders the step heading and the album option', () => {
    render(<StepAlbumSelect />);

    expect(screen.getByRole('heading', { name: 'Elige tu álbum activo' })).toBeInTheDocument();
    expect(screen.getByTestId('album-option-1')).toHaveTextContent('Mundial 26');
  });

  it('selects the album when the option is clicked', () => {
    render(<StepAlbumSelect />);

    fireEvent.click(screen.getByTestId('album-option-1'));

    expect(storeState.setActiveAlbum).toHaveBeenCalledWith(1);
  });

  it('marks the album as pressed when it is the active one', () => {
    storeState.activeAlbumId = 1;
    render(<StepAlbumSelect />);

    expect(screen.getByTestId('album-option-1')).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks the album as not pressed when no album is active', () => {
    render(<StepAlbumSelect />);

    expect(screen.getByTestId('album-option-1')).toHaveAttribute('aria-pressed', 'false');
  });
});
