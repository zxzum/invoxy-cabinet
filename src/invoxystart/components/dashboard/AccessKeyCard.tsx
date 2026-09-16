import { LivelyCopyButton } from '@/invoxystart/components/ui/LivelyCopyButton';

export function AccessKeyCard({ accessLink }: { accessLink?: string | null }) {
  return (
    <div className="glass-panel motion-card flex w-full flex-col gap-3 rounded-[26px] p-4">
      <h3 className="text-[17px] font-bold text-ink">Ключ доступа</h3>
      <div className="flex w-full flex-col items-center gap-3">
        <div className="glass-control flex h-[52px] w-full items-center rounded-2xl px-4 opacity-75">
          <span className="truncate text-sm text-muted">
            {accessLink || 'Ссылка пока недоступна'}
          </span>
        </div>
        <LivelyCopyButton
          text={accessLink || ''}
          label="Скопировать ключ"
          copiedLabel="Скопировано!"
          disabled={!accessLink}
        />
      </div>
    </div>
  );
}
