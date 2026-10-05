const PLATFORMS = [
  { name: 'iOS', desc: 'iPhone и iPad', icon: '🍎' },
  { name: 'Android', desc: 'Смартфоны и планшеты', icon: '🤖' },
  { name: 'Windows', desc: 'ПК и ноутбуки 10/11', icon: '🪟' },
  { name: 'macOS', desc: 'MacBook и iMac', icon: '💻' },
  { name: 'Android TV', desc: 'Телевизоры и приставки', icon: '📺' },
  { name: 'Linux', desc: 'Ubuntu, Debian, Arch', icon: '🐧' },
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
            Один аккаунт обеспечивает защищённое соединение на смартфонах, компьютерах и домашних
            ТВ.
          </p>
        </div>

        {/* 6 Platforms Grid */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
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

        {/* Official clients spotlight */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Happ client */}
          <div className="glass-panel rounded-3xl border border-line/80 bg-surface/80 p-6 flex items-start gap-4">
            <img
              src="/images/apps/happ.png"
              alt="Happ"
              className="h-14 w-14 rounded-2xl object-contain bg-surface-2 p-1.5 border border-line shrink-0 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display-landing text-lg font-bold text-ink">Happ</h3>
                <span className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-mono-landing text-mint border border-line">
                  iOS · Android
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted leading-relaxed">
                Быстрый мобильный клиент с поддержкой протоколов нового поколения VLESS Reality.
                Подключение ключа в 1 клик через глубокие ссылки из Telegram.
              </p>
            </div>
          </div>

          {/* Incy client */}
          <div className="glass-panel rounded-3xl border border-line/80 bg-surface/80 p-6 flex items-start gap-4">
            <img
              src="/images/apps/incy.png"
              alt="Incy"
              className="h-14 w-14 rounded-2xl object-contain bg-surface-2 p-1.5 border border-line shrink-0 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display-landing text-lg font-bold text-ink">Incy</h3>
                <span className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-mono-landing text-mint border border-line">
                  Windows · macOS
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted leading-relaxed">
                Настольное приложение для компьютеров. Раздельное туннелирование трафика, автозапуск
                при включении и минимальное потребление ресурсов процессора.
              </p>
            </div>
          </div>
        </div>

        {/* Universal compatibility note */}
        <div className="mt-6 text-center text-xs text-muted font-mono-landing">
          Также полная совместимость с любыми VLESS-клиентами: Streisand, v2rayNG, v2rayN, Nekobox,
          Shadowrocket.
        </div>
      </div>
    </section>
  );
}
