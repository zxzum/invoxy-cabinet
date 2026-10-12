// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

it('opens management even for one device and exposes details, rename and confirmed removal', async () => {
  const onRemove = vi.fn().mockResolvedValue(undefined);
  const onRename = vi.fn().mockResolvedValue(undefined);
  const device = {
    id: 'hwid-1',
    name: 'My phone',
    status: 'Android',
    platform: 'Android',
    details: {
      hwid: 'hwid-1',
      platform: 'Android',
      device_model: 'Pixel 9',
      created_at: '2026-10-09T10:00:00Z',
      last_seen_at: '2026-10-09T10:00:00Z',
      os_version: '16',
      user_agent: 'Happ/3.6.0 InvoxyVPN/1.2 (Android 16; Pixel 9)',
    },
  };
  render(
    <DevicesCard devices={[device]} previewCount={3} onRemove={onRemove} onRename={onRename} />,
  );
  expect(screen.queryByRole('button', { name: /Отключить/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /devicesManageAll/ }));
  expect(screen.getByRole('dialog')).toBeTruthy();
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.queryByText('Подробнее')).toBeNull();
  expect(dialog.queryByText('hwid-1')).toBeNull();
  expect(dialog.queryByText(/Happ\//)).toBeNull();
  expect(dialog.getByText('Android 16')).toBeTruthy();
  expect(dialog.getByText('Invoxy VPN')).toBeTruthy();
  expect(dialog.getByText(/Был в сети/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Переименовать My phone' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Имя устройства' }), {
    target: { value: 'Work phone' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
  await waitFor(() => expect(onRename).toHaveBeenCalledWith(device, 'Work phone'));
  fireEvent.click(screen.getByRole('button', { name: 'Отключить My phone' }));
  expect(onRemove).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /Отключить My phone —/ }));
  await waitFor(() => expect(onRemove).toHaveBeenCalledWith(device));
});
