// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DevicesCard } from './DevicesCard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

afterEach(cleanup);

it('shows a short device preview and opens the full management page', () => {
  const onManage = vi.fn();
  const devices = Array.from({ length: 5 }, (_, index) => ({
    id: String(index),
    name: `Device ${index + 1}`,
    status: 'iOS',
  }));

  render(<DevicesCard devices={devices} previewCount={3} onManage={onManage} />);

  expect(screen.getByText('Device 3')).toBeTruthy();
  expect(screen.queryByText('Device 4')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /devicesManageAll/ }));
  expect(onManage).toHaveBeenCalledOnce();
  expect(screen.queryByRole('button', { name: /devicesCollapse/ })).toBeNull();
});

it('filters a long management list by device name', () => {
  const devices = Array.from({ length: 12 }, (_, index) => ({
    id: String(index),
    name: `Device ${index + 1}`,
    status: 'iOS',
  }));
  render(<DevicesCard devices={devices} />);

  fireEvent.change(screen.getByRole('searchbox', { name: 'invoxy.dashboard.devicesSearch' }), {
    target: { value: 'Device 11' },
  });

  expect(screen.getByText('Device 11')).toBeTruthy();
  expect(screen.queryByText('Device 1')).toBeNull();
});
