export function Whitelist() {
  return (
    <section
      id="whitelist"
      className="py-16 sm:py-24 border-t border-line/40 relative overflow-hidden"
    >
      {/* Subtle background glow */}
      <div
        className="pointer-events-none absolute right-1/4 top-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-yellow/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow/30 bg-yellow/10 px-3 py-1 text-xs font-mono-landing font-semibold text-yellow mb-3">
            <span>Технология обхода</span>
          </div>
          <h2 className="font-display-landing text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Когда обычный VPN начинают резать
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted">
            Отдельный изолированный канал для мобильного интернета, когда операторы давят
            стандартные протоколы.
          </p>
        </div>

        {/* 3 Value Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Card 1 */}
          <div className="glass-panel rounded-3xl border border-line/80 bg-surface/75 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/15 text-mint border border-mint/30 font-mono-landing font-bold text-lg">
                01
              </div>
              <h3 className="mt-5 font-display-landing text-lg sm:text-xl font-bold text-ink">
                VLESS Reality маскирует трафик
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-muted leading-relaxed">
                Трафик неотличим от обычного защищённого веб-серфинга по HTTPS. Фильтры провайдера
                видят обращение к популярным белым доменам, а не туннель VPN.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-line/40 text-[11px] font-mono-landing text-mint">
              ✓ Защита от стандартных блокировок
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel rounded-3xl border border-yellow/40 bg-surface/85 p-6 sm:p-7 flex flex-col justify-between shadow-[0_0_28px_rgba(245,241,122,0.08)] ring-1 ring-yellow/30">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow/15 text-yellow border border-yellow/30 font-mono-landing font-bold text-lg">
                02
              </div>
              <h3 className="mt-5 font-display-landing text-lg sm:text-xl font-bold text-ink">
                Белый интернет — сотовый контур
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-muted leading-relaxed">
                Когда вышки МТС, Билайн, Мегафон или Tele2 включают жесткие фильтры ТСПУ, обычные
                соединения рвутся. Режим «Белый интернет» направляет трафик через специальный
                резервный пул узлов.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-line/40 text-[11px] font-mono-landing text-yellow">
              ✓ Обход глубокой фильтрации операторов
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel rounded-3xl border border-line/80 bg-surface/75 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/15 text-mint border border-mint/30 font-mono-landing font-bold text-lg">
                03
              </div>
              <h3 className="mt-5 font-display-landing text-lg sm:text-xl font-bold text-ink">
                YouTube 4K без кружка загрузки
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-muted leading-relaxed">
                За счёт прямого аплинка к европейским CDN-шлюзам и пропускной способности до 1
                Гбит/с тяжёлые ролики 2160p 60fps и Instagram Reels открываются моментально.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-line/40 text-[11px] font-mono-landing text-mint">
              ✓ Скорость до 1 Гбит/с без задержек
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
