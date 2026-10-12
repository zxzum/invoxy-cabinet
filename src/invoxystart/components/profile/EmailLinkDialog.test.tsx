// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { EmailLinkDialog } from './EmailLinkDialog';

const mocks = vi.hoisted(() => ({
  registerEmail: vi.fn(),
  verifyEmailMerge: vi.fn(),
  refreshUser: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@/invoxystart/api', () => ({
  authApi: {
    registerEmail: mocks.registerEmail,
    verifyEmailMerge: mocks.verifyEmailMerge,
  },
  ApiError: class ApiError extends Error {
    status: number;
    data: unknown;
    constructor(status: number, data: unknown, message?: string) {
      super(message);
      this.status = status;
      this.data = data;
    }
  },
}));

vi.mock('@/invoxystart/auth', () => ({
  useAuth: () => ({
    refreshUser: mocks.refreshUser,
  }),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
});

describe('EmailLinkDialog', () => {
  it('submits valid email and password for direct link', async () => {
    mocks.registerEmail.mockResolvedValue({ message: 'Success' });
    const onSent = vi.fn();
    const onClose = vi.fn();

    render(
      <MemoryRouter>
        <EmailLinkDialog open={true} onClose={onClose} onSent={onSent} />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('email@example.com'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Минимум 8 символов'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Повторите пароль'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Отправить письмо подтверждения' }));

    await waitFor(() => {
      expect(mocks.registerEmail).toHaveBeenCalledWith('user@example.com', 'password123');
      expect(onSent).toHaveBeenCalled();
      expect(screen.getByText('Письмо отправлено')).toBeTruthy();
    });
  });

  it('handles merge_required and verifies email merge OTP code', async () => {
    mocks.registerEmail.mockResolvedValue({
      merge_required: true,
      merge_verification: 'email_code',
    });
    mocks.verifyEmailMerge.mockResolvedValue({
      merge_token: 'test_token_xyz',
    });

    const onSent = vi.fn();
    const onClose = vi.fn();

    render(
      <MemoryRouter>
        <EmailLinkDialog open={true} onClose={onClose} onSent={onSent} />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('email@example.com'), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Минимум 8 символов'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Повторите пароль'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Отправить письмо подтверждения' }));

    // Should transition to merge_code step
    await waitFor(() => {
      expect(screen.getByText('Подтвердите объединение')).toBeTruthy();
    });

    // Enter 6-digit code
    fireEvent.change(screen.getByPlaceholderText('123456'), {
      target: { value: '654321' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Подтвердить и объединить' }));

    await waitFor(() => {
      expect(mocks.verifyEmailMerge).toHaveBeenCalledWith('654321');
      expect(mocks.navigate).toHaveBeenCalledWith('/merge/test_token_xyz');
      expect(onClose).toHaveBeenCalled();
    });
  });
});
