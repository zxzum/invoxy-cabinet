import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Работает ли в России прямо сейчас?',
    a: 'Да. Мы используем современный протокол VLESS Reality, маскирующий сетевой трафик под обычный защищённый HTTPS. Для абонентов сотовых операторов МТС, Билайн, Мегафон и Tele2 предусмотрен выделенный режим «Белый интернет», эффективно обходящий блокировки ТСПУ.',
  },
  {
    q: 'Нужна ли банковская карта для бесплатного теста?',
    a: 'Нет, данные карты не требуются. Вы получаете 10 ГБ скоростного трафика на 2 дня бесплатно сразу после первого запуска бота в Telegram или быстрой регистрации на сайте.',
  },
  {
    q: 'Почему через Telegram-бота подключаться быстрее?',
    a: 'В боте не нужно вводить email, подтверждать ссылки и запоминать пароли. Вы нажимаете «Старт», получаете ключ и в один клик импортируете его в приложение. Оплата тарифов также доступна прямо в чате через СБП.',
  },
  {
    q: 'Что такое Белый интернет и зачем он нужен?',
    a: 'Это отдельный контур серверов с дополнительной защитой от мобильных блокировок. Когда операторы сотовой связи начинают глушить стандартные VPN-порты в часы пик, режим «Белый интернет» продолжает стабильно работать без потери пакетов.',
  },
  {
    q: 'На скольких устройствах можно использовать одновременно?',
    a: 'От 3 до 10 устройств в зависимости от тарифа: Стандарт — 3, Белый интернет — 5, Премиум — 10. Вы можете одновременно подключить смартфон, ноутбук, планшет и Smart TV на одной подписке.',
  },
  {
    q: 'Сколько времени занимает настройка?',
    a: 'Около 10–15 секунд. Вы открываете бота в Telegram, получаете ключ и нажимаете кнопку «Подключить» — приложение Happ или Incy настроится автоматически.',
  },
];

export function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="faq" className="py-16 sm:py-24 border-t border-line/40 relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-mono-landing text-muted mb-3">
            <span>Вопросы и ответы</span>
          </div>
          <h2 className="font-display-landing text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Часто задаваемые вопросы
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted">
            Всё, что нужно знать о работе сервиса, протоколах и тарифах.
          </p>
        </div>

        {/* Accordion list */}
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={`glass-panel rounded-2xl border transition-colors overflow-hidden ${
                  isOpen
                    ? 'border-mint/40 bg-surface/90 shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
                    : 'border-line/70 bg-surface/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left focus:outline-none"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span className="font-display-landing text-base sm:text-lg font-semibold text-ink">
                    {item.q}
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-muted transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-mint border-mint/40' : ''
                    }`}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <m.div
                      id={`faq-answer-${idx}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted leading-relaxed border-t border-line/30">
                        {item.a}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
