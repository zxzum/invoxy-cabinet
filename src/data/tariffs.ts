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
    id: 'standard',
    name: 'Стандарт',
    tagline: 'Для дома, Wi-Fi и быстрого интернета без цензуры',
    recommended: false,
    totalTrafficGb: 350,
    whitelistTrafficGb: 0,
    devices: 3,
    maxDevices: 10,
    pricings: {
      1: { months: 1, monthlyPrice: 120, totalPrice: 120 },
      3: { months: 3, monthlyPrice: 120, totalPrice: 360 },
      6: { months: 6, monthlyPrice: 120, totalPrice: 720 },
      12: { months: 12, monthlyPrice: 108, totalPrice: 1296, discountLabel: '−10%' },
    },
    features: [
      '350 ГБ трафика в месяц',
      'Протокол VLESS Reality (маскировка под HTTPS)',
      '3 устройства одновременно',
      'Скорость до 1 Гбит/с',
      'YouTube 4K, Instagram, ChatGPT',
      'Без логов активности',
      'Поддержка 24/7',
    ],
  },
  {
    id: 'whitelist',
    name: 'Белый интернет',
    tagline: 'Хит продаж · Отдельный LTE-канал против мобильных блокировок',
    badge: 'Хит продаж',
    recommended: true,
    totalTrafficGb: 750,
    whitelistTrafficGb: 50,
    devices: 5,
    maxDevices: 10,
    pricings: {
      1: { months: 1, monthlyPrice: 200, totalPrice: 200 },
      3: { months: 3, monthlyPrice: 190, totalPrice: 570, discountLabel: '−5%' },
      6: { months: 6, monthlyPrice: 180, totalPrice: 1080, discountLabel: '−10%' },
      12: { months: 12, monthlyPrice: 170, totalPrice: 2040, discountLabel: '−15%' },
    },
    features: [
      '750 ГБ общего трафика в месяц',
      '50 ГБ в режиме «Белый интернет» (LTE)',
      'Двойной контур: Default + LTE-контур',
      'Работает на МТС, Билайн, Мегафон, Теле2',
      '5 устройств одновременно',
      'Скорость до 1 Гбит/с',
      'Без логов активности',
      'Поддержка 24/7',
    ],
  },
  {
    id: 'premium',
    name: 'Премиум',
    tagline: 'Максимальный объём трафика и устройств для всей семьи',
    recommended: false,
    totalTrafficGb: 1000,
    whitelistTrafficGb: 150,
    devices: 10,
    maxDevices: 15,
    pricings: {
      1: { months: 1, monthlyPrice: 400, totalPrice: 400 },
      3: { months: 3, monthlyPrice: 380, totalPrice: 1140, discountLabel: '−5%' },
      6: { months: 6, monthlyPrice: 360, totalPrice: 2160, discountLabel: '−10%' },
      12: { months: 12, monthlyPrice: 340, totalPrice: 4080, discountLabel: '−15%' },
    },
    features: [
      '1 000 ГБ общего трафика в месяц',
      '150 ГБ в режиме «Белый интернет» (LTE)',
      'Двойной контур с приоритетной маршрутизацией',
      '10 устройств одновременно',
      'Скорость до 1 Гбит/с',
      'Без логов активности',
      'Персональная поддержка 24/7',
    ],
  },
];

export const ADDON_INFO = [
  { label: 'Докупка обычного трафика', price: '100 ГБ = 50 ₽ · 300 ГБ = 150 ₽' },
  { label: 'Докупка Белого интернета', price: '50 ГБ = 150 ₽ · 100 ГБ = 300 ₽' },
  { label: 'Дополнительное устройство', price: '30 ₽/мес на Стандарте · 50 ₽/мес на LTE' },
] as const;
