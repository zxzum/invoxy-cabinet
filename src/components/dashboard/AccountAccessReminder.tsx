import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import apiClient from '@/api/client';
import { Button } from '@/components/primitives/Button';

interface Reminder {
  id: number;
  title: string;
  body: string;
  button: { kind: string; target: string; text: string } | null;
}

export function AccountAccessReminder({ userId }: { userId: number | undefined }) {
  const { t, i18n } = useTranslation();
  const client = useQueryClient();
  const key = ['account-access-reminder', userId, i18n.language];
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () =>
      (
        await apiClient.get<Reminder[]>('/cabinet/reminders/active', {
          params: { lang: i18n.language },
        })
      ).data,
    retry: false,
    enabled: Boolean(userId),
  });
  const dismiss = useMutation({
    mutationFn: (id: number) => apiClient.post(`/cabinet/reminders/${id}/dismiss`),
    onSuccess: () => client.invalidateQueries({ queryKey: ['account-access-reminder'] }),
  });
  const reminder = data?.find(
    (item) => item.button?.kind === 'cabinet' && item.button.target === '/profile/accounts',
  );
  if (!reminder) return null;
  return (
    <aside className="glass-panel rounded-2xl p-4" aria-label={reminder.title}>
      <p className="text-sm font-semibold">{reminder.title}</p>
      <p className="mt-1 text-sm text-muted">{reminder.body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link
          to="/profile/accounts"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-mint"
        >
          {reminder.button?.text}
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11"
          onClick={() => dismiss.mutate(reminder.id)}
          disabled={dismiss.isPending}
        >
          {t('common.dismiss', 'Больше не показывать')}
        </Button>
      </div>
      {dismiss.isError && (
        <p role="alert" className="mt-2 text-sm text-error-400">
          {t('common.error')}
        </p>
      )}
    </aside>
  );
}
