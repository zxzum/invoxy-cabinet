export type TariffPeriodMonths = 1 | 3 | 6 | 12;

export interface TariffPricing {
  months: TariffPeriodMonths;
  monthlyPrice: number;
  totalPrice: number;
  discountLabel?: string;
}

export interface TariffPlan {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  recommended: boolean;
  totalTrafficGb: number;
  whitelistTrafficGb: number;
  devices: number;
  maxDevices: number;
  pricings: Record<TariffPeriodMonths, TariffPricing>;
  features: string[];
}

export const TRIAL_SPECS = {
  days: 2,
  totalTrafficGb: 10,
  whitelistTrafficGb: 5,
  devices: 1,
  noCardRequired: true,
  title: '10 ГБ бесплатно на 2 дня',
  subtitle: 'Без привязки банковской карты. Доступ сразу после старта в боте или регистрации.',
} as const;

export const TARIFF_PLANS: TariffPlan[] = [
  {
    id: 'basic',
    name: 'Базовый',
    tagline: 'Для дома, Wi-Fi и быстрого интернета без цензуры',
    recommended: false,
    totalTrafficGb: 300,
    whitelistTrafficGb: 0,
    devices: 5,
    maxDevices: 10,
    pricings: {
      1: { months: 1, monthlyPrice: 100, totalPrice: 100 },
      3: { months: 3, monthlyPrice: 100, totalPrice: 300 },
      6: { months: 6, monthlyPrice: 100, totalPrice: 600 },
      12: { months: 12, monthlyPrice: 80, totalPrice: 960, discountLabel: '−20%' },
    },
    features: [
      '300 ГБ трафика в месяц',
      'Протокол VLESS Reality (маскировка под HTTPS)',
      '5 устройств одновременно (+5 по 20 ₽)',
      'Сброс трафика 150 ₽ (1 раз в месяц)',
      'Скорость до 1 Гбит/с',
      'YouTube 4K, Instagram, ChatGPT',
      'Без логов активности',
      'Поддержка 24/7',
    ],
  },
  {
    id: 'standard-lte',
    name: 'Стандарт LTE',
    tagline: 'Хит продаж · Отдельный LTE-канал против мобильных блокировок',
    badge: 'Хит продаж',
    recommended: true,
    totalTrafficGb: 600,
    whitelistTrafficGb: 50,
    devices: 5,
    maxDevices: 10,
    pricings: {
      1: { months: 1, monthlyPrice: 200, totalPrice: 200 },
      3: { months: 3, monthlyPrice: 186, totalPrice: 558, discountLabel: '−7%' },
      6: { months: 6, monthlyPrice: 170, totalPrice: 1020, discountLabel: '−15%' },
      12: { months: 12, monthlyPrice: 160, totalPrice: 1920, discountLabel: '−20%' },
    },
    features: [
      '600 ГБ общего трафика в месяц',
      '50 ГБ в режиме «Белый интернет» (LTE)',
      'Двойной контур: Default + LTE-контур',
      '5 устройств одновременно (+5 по 30 ₽)',
      'Сброс трафика 300 ₽ (1 раз в месяц)',
      'Сброс LTE 150 ₽ за 50 ГБ (1 раз в месяц)',
      'Работает на всех мобильных операторах',
      'Скорость до 1 Гбит/с',
      'Без логов активности',
      'Поддержка 24/7',
    ],
  },
  {
    id: 'premium-lte',
    name: 'Премиум LTE',
    tagline: 'Максимальный объём трафика и устройств для всей семьи',
    recommended: false,
    totalTrafficGb: 1000,
    whitelistTrafficGb: 150,
    devices: 10,
    maxDevices: 15,
    pricings: {
      1: { months: 1, monthlyPrice: 400, totalPrice: 400 },
      3: { months: 3, monthlyPrice: 360, totalPrice: 1080, discountLabel: '−10%' },
      6: { months: 6, monthlyPrice: 320, totalPrice: 1920, discountLabel: '−20%' },
      12: { months: 12, monthlyPrice: 280, totalPrice: 3360, discountLabel: '−30%' },
    },
    features: [
      '1 000 ГБ общего трафика в месяц',
      '150 ГБ в режиме «Белый интернет» (LTE)',
      'Двойной контур с приоритетной маршрутизацией',
      '10 устройств одновременно (+5 по 50 ₽)',
      'Сброс трафика 500 ₽ (1 раз в месяц)',
      'Сброс LTE 150 ₽ за 50 ГБ (1 раз в месяц)',
      'Скорость до 1 Гбит/с',
      'Без логов активности',
      'Персональная поддержка 24/7',
    ],
  },
];

export const ADDON_INFO = [
  { label: 'Сброс основного трафика', price: 'Базовый 150 ₽ · Стандарт 300 ₽ · Премиум 500 ₽' },
  { label: 'Сброс LTE трафика', price: '150 ₽ за 50 ГБ (1 раз в месяц)' },
  {
    label: 'Дополнительные устройства',
    price: 'Базовый 20 ₽ · Стандарт 30 ₽ · Премиум 50 ₽ (до +5 шт)',
  },
] as const;
