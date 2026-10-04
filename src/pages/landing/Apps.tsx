const PLATFORMS = [
  { name: 'iOS', desc: 'iPhone и iPad', icon: '🍎' },
  { name: 'Android', desc: 'Смартфоны и планшеты', icon: '🤖' },
  { name: 'Windows', desc: 'ПК и ноутбуки 10/11', icon: '🪟' },
  { name: 'macOS', desc: 'MacBook и iMac', icon: '💻' },
];

export function Apps() {
  return (
    <section id="apps" className="py-16 sm:py-24 border-t border-line/40 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-mono-landing text-muted mb-3">
            <span>Экосистема приложений</span>
          </div>
          <h2 className="font-display-landing text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Приложения для всех ваших устройств
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted">
            Один аккаунт обеспечивает защищённое соединение на смартфонах и компьютерах.
          </p>
        </div>

        {/* Platforms Grid */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {PLATFORMS.map((p) => (
            <div
              key={p.name}
              className="glass-panel rounded-2xl border border-line/70 bg-surface/60 p-4 text-center hover:border-line hover:bg-surface-2/60 transition-colors"
            >
              <div className="text-2xl sm:text-3xl mb-2">{p.icon}</div>
              <div className="font-display-landing text-sm font-bold text-ink">{p.name}</div>
              <div className="text-[11px] text-muted mt-0.5 truncate">{p.desc}</div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 flex max-w-2xl items-start gap-4 rounded-3xl border border-line/80 bg-surface/80 p-6 glass-panel">
          <img
            src="/images/apps/invoxy.png"
            alt=""
            className="h-14 w-14 shrink-0 rounded-2xl border border-line bg-surface-2 object-contain p-1.5 shadow-md"
          />
          <div>
            <h3 className="font-display-landing text-lg font-bold text-ink">Invoxy VPN</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Собственное приложение сервиса: одна кнопка подключения, автоматический выбор рабочего
              сервера и вход через Telegram или личный кабинет без копирования ключа.
            </p>
            <a
              href="/app"
              className="mt-3 inline-block text-xs font-bold text-mint hover:underline"
            >
              Скачать и подключить →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
