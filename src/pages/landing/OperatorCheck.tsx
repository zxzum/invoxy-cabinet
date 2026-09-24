import { useState } from 'react';

const BOT_USERNAME = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'invoxy_bot').replace(/^@/, '');
const TELEGRAM_BOT_URL = `https://t.me/${BOT_USERNAME}`;

type OperatorId = 'wifi' | 'mts' | 'beeline' | 'megafon' | 'tele2';

interface OperatorConfig {
  id: OperatorId;
  name: string;
  icon: string;
  isCellular: boolean;
  verdict: string;
  recommendation: string;
  recommendedCircuit: 'reality' | 'lte';
}

const OPERATORS: OperatorConfig[] = [
  {
    id: 'wifi',
    name: 'Домашний Wi-Fi',
    icon: '📶',
    isCellular: false,
    verdict: 'Стабильная работа на максимальной скорости до 1 Гбит/с.',
    recommendation: 'Обычного VLESS Reality хватит с головой. Начните с 10 ГБ бесплатно.',
    recommendedCircuit: 'reality',
  },
  {
    id: 'mts',
    name: 'МТС',
    icon: '🔴',
    isCellular: true,
    verdict: 'Оператор часто глушит стандартные VPN-порты в часы пик.',
    recommendation:
      'Используйте режим «Белый интернет» (LTE) — отдельный контур, проходящий сквозь фильтры ТСПУ.',
    recommendedCircuit: 'lte',
  },
  {
    id: 'beeline',
    name: 'Билайн',
    icon: '🟡',
    isCellular: true,
    verdict: 'Периодическое замедление иностранного HTTPS-трафика.',
    recommendation:
      'Рекомендуем режим «Белый интернет» (LTE) для стабильного YouTube 4K и звонков.',
    recommendedCircuit: 'lte',
  },
  {
    id: 'megafon',
    name: 'Мегафон',
    icon: '🟢',
    isCellular: true,
    verdict: 'Агрессивная фильтрация WireGuard и OpenVPN на сотовых вышках.',
    recommendation:
      'Наш протокол Reality маскирует трафик, а режим LTE гарантирует соединение без капч.',
    recommendedCircuit: 'lte',
  },
  {
    id: 'tele2',
    name: 'Теле2 / Т2',
    icon: '⚫',
    isCellular: true,
    verdict: 'Точечные блокировки узлов и сбросы TCP-сессий.',
    recommendation:
      'Контур «Белый интернет» обходит ограничения благодаря динамической ротации портов.',
    recommendedCircuit: 'lte',
  },
];

function TelegramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
    </svg>
  );
}

export function OperatorCheck() {
  const [selectedOp, setSelectedOp] = useState<OperatorId>('wifi');

  const currentOp = OPERATORS.find((o) => o.id === selectedOp) || OPERATORS[0];

  return (
    <section id="check" className="py-16 sm:py-24 border-t border-line/40 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-mono-landing text-muted mb-3">
            <span>Проверка совместимости</span>
          </div>
          <h2 className="font-display-landing text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Заработает у меня?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted">
            Выберите сеть, через которую чаще всего выходите в интернет:
          </p>
        </div>

        {/* 5 Chips Selector */}
        <div className="mt-8 flex flex-wrap justify-center gap-2.5 sm:gap-3">
          {OPERATORS.map((op) => {
            const isSelected = op.id === selectedOp;
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => setSelectedOp(op.id)}
                className={`button-lift inline-flex items-center gap-2 rounded-2xl px-4 sm:px-5 py-2.5 text-sm font-medium transition-all ${
                  isSelected
                    ? 'border border-mint bg-mint/15 text-mint shadow-[0_0_20px_rgba(165,232,196,0.25)] ring-1 ring-mint/50'
                    : 'border border-line bg-surface/70 text-ink/80 hover:bg-surface-2 hover:border-line/80'
                }`}
              >
                <span>{op.icon}</span>
                <span>{op.name}</span>
              </button>
            );
          })}
        </div>

        {/* Result Card & Dual Circuits */}
        <div className="mt-10 mx-auto max-w-4xl">
          <div className="glass-panel rounded-3xl border border-line/80 bg-surface/80 p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Advice column */}
              <div className="lg:col-span-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono-landing text-muted uppercase tracking-wider">
                    <span>Диагностика сети</span>
                    <span>·</span>
                    <span className="text-ink font-semibold">{currentOp.name}</span>
                  </div>

                  <h3 className="mt-2 text-lg sm:text-xl font-bold text-ink">
                    {currentOp.verdict}
                  </h3>

                  <p className="mt-3 text-sm text-muted leading-relaxed">
                    {currentOp.recommendation}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-line/60 flex items-center gap-4">
                  <a
                    href={TELEGRAM_BOT_URL}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="button-lift inline-flex items-center gap-2 rounded-xl bg-mint px-5 py-2.5 text-sm font-bold text-bg shadow-[0_0_20px_rgba(165,232,196,0.3)] hover:bg-[#bbf0d4] transition-all"
                  >
                    <TelegramIcon className="h-4 w-4" />
                    <span>Забрать 10 ГБ в Telegram</span>
                  </a>
                  <span className="text-xs text-muted">2 дня бесплатно</span>
                </div>
              </div>

              {/* Dual Circuit diagram */}
              <div className="lg:col-span-6 space-y-3 font-mono-landing text-xs">
                {/* Default Circuit */}
                <div
                  className={`rounded-2xl p-4 border transition-all ${
                    currentOp.recommendedCircuit === 'reality'
                      ? 'border-mint/60 bg-mint/10 shadow-[0_0_24px_rgba(165,232,196,0.15)] ring-1 ring-mint/40'
                      : 'border-line/60 bg-surface-2/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-ink">
                      <span className="h-2 w-2 rounded-full bg-mint" />
                      <span>Контур Default · VLESS Reality</span>
                    </div>
                    {currentOp.recommendedCircuit === 'reality' && (
                      <span className="rounded bg-mint/20 px-2 py-0.5 text-[10px] font-bold text-mint uppercase">
                        Рекомендовано
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-muted leading-relaxed font-sans">
                    Прямая маскировка под мировой HTTPS-трафик. Максимальная пропускная способность
                    до 1 Гбит/с для дома и офиса.
                  </p>
                </div>

                {/* LTE Circuit */}
                <div
                  className={`rounded-2xl p-4 border transition-all ${
                    currentOp.recommendedCircuit === 'lte'
                      ? 'border-yellow/60 bg-yellow/10 shadow-[0_0_24px_rgba(245,241,122,0.15)] ring-1 ring-yellow/40'
                      : 'border-line/60 bg-surface-2/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-ink">
                      <span className="h-2 w-2 rounded-full bg-yellow" />
                      <span>Контур LTE · Белый интернет</span>
                    </div>
                    {currentOp.recommendedCircuit === 'lte' && (
                      <span className="rounded bg-yellow/20 px-2 py-0.5 text-[10px] font-bold text-yellow uppercase">
                        Рекомендовано для сотовых
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-muted leading-relaxed font-sans">
                    Выделенный контур с динамической защитой от глубоких сотовых фильтров DPI/ТСПУ
                    операторов РФ.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
