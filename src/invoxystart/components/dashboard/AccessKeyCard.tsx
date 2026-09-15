import { useState } from 'react';
import { Copy, Check } from '@/invoxystart/components/ui/RuneIcon';
import { copyToClipboard } from '@/utils/clipboard';

export function AccessKeyCard({ accessLink }: { accessLink?: string | null }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (!accessLink) return;
      await copyToClipboard(accessLink);
    } catch {
      // clipboard unavailable, still show feedback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="glass-panel motion-card flex w-full flex-col gap-3 rounded-[26px] p-4">
      <h3 className="text-[17px] font-bold text-ink">Ключ доступа</h3>
      <div className="flex w-full flex-col items-center gap-3">
        <div className="glass-control flex h-[52px] w-full items-center rounded-2xl px-4 opacity-75">
          <span className="truncate text-sm text-muted">
            {accessLink || 'Ссылка пока недоступна'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          disabled={!accessLink}
          className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-mint text-sm font-bold text-bg transition-colors"
        >
          {copied ? (
            <span className="flex items-center gap-2">
              <Check size={18} /> Скопировано
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Copy size={18} /> Скопировать ключ
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
