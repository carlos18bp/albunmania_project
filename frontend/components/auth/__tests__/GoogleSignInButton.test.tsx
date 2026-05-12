/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

const mockLogin = jest.fn();
jest.mock('@react-oauth/google', () => ({
  __esModule: true,
  useGoogleLogin: () => mockLogin,
}));

import GoogleSignInButton from '../GoogleSignInButton';

beforeEach(() => {
  mockLogin.mockReset();
});

describe('GoogleSignInButton', () => {
  it('renders the default Spanish label', () => {
    render(<GoogleSignInButton onSuccess={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeInTheDocument();
  });

  it('renders a custom label when provided', () => {
    render(<GoogleSignInButton onSuccess={jest.fn()} label="Registrarme con Google" />);

    expect(screen.getByRole('button', { name: 'Registrarme con Google' })).toBeInTheDocument();
  });

  it('triggers the Google login flow on click', () => {
    render(<GoogleSignInButton onSuccess={jest.fn()} />);

    fireEvent.click(screen.getByTestId('google-signin-button'));

    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it('is disabled (and inert) when the disabled prop is set', () => {
    render(<GoogleSignInButton onSuccess={jest.fn()} disabled />);
    const button = screen.getByTestId('google-signin-button');

    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
