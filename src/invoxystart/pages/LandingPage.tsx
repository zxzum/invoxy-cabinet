import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router';
import {
  ShieldCheck,
  Zap,
  Check,
  ArrowRight,
  Smartphone,
  Laptop,
  Sparkles,
  Plus,
  Minus,
  Globe2,
  Bot,
} from '@/invoxystart/components/ui/RuneIcon';
import { BrandLogo } from '@/invoxystart/components/layout/BrandLogo';

interface DbTariffPeriod {
  days: number;
  label: string;
  price_kopeks: number;
  price_label: string;
  discount_percent: number | null;
}

interface DbTariff {
  id: number;
  name: string;
  description: string;
  traffic_limit_gb: number;
  device_limit: number;
  tier_level: number;
  periods: DbTariffPeriod[];
}

interface LandingNode {
  country_code: string;
  country_name: string;
  city: string;
  ping_ms: number;
  load_percent: number;
  status: string;
  node_name?: string;
  users_online?: number;
}

interface ProcessedPlan {
  id: string;
  dbId?: number;
  badge?: string;
  popular?: boolean;
  name: string;
  desc: string;
  tagline: string;
  monthlyRub: number;
  devices: string;
  traffic: string;
  whiteNetQuota?: string;
  features: string[];
  durations: {
    months: number;
    days: number;
    priceRub: number;
    discount?: string;
  }[];
}

const FALLBACK_NODES: LandingNode[] = [
  {
    country_code: 'FI',
    country_name: 'Финляндия',
    city: 'Хельсинки',
    ping_ms: 22,
    load_percent: 42,
    status: 'online',
    node_name: 'Invoxy Core FI-1',
    users_online: 8,
  },
  {
    country_code: 'NL',
    country_name: 'Нидерланды',
    city: 'Амстердам',
    ping_ms: 38,
    load_percent: 34,
    status: 'online',
    node_name: 'Invoxy Core NL-1',
    users_online: 4,
  },
  {
    country_code: 'DE',
    country_name: 'Германия',
    city: 'Франкфурт',
    ping_ms: 34,
    load_percent: 35,
    status: 'online',
    node_name: 'Invoxy Core DE-1',
    users_online: 5,
  },
  {
    country_code: 'SE',
    country_name: 'Швеция',
    city: 'Стокгольм',
    ping_ms: 25,
    load_percent: 19,
    status: 'online',
    node_name: 'Invoxy Core SE-1',
    users_online: 2,
  },
  {
    country_code: 'PL',
    country_name: 'Польша',
    city: 'Варшава',
    ping_ms: 29,
    load_percent: 28,
    status: 'online',
    node_name: 'Invoxy Core PL-1',
    users_online: 6,
  },
  {
    country_code: 'NL',
    country_name: 'Нидерланды',
    city: 'Амстердам',
    ping_ms: 36,
    load_percent: 30,
    status: 'online',
    node_name: 'Invoxy Prime NL-2',
    users_online: 4,
  },
];

const FALLBACK_PLANS: ProcessedPlan[] = [
  {
    id: 'tariff_2',
    name: 'Стандарт',
    desc: 'Надежный быстрый доступ для сайтов, видео и приложений каждый день',
    tagline: 'Идеально для смартфона и ноутбука',
    monthlyRub: 120,
    devices: 'До 3 устройств',
    traffic: '350 ГБ трафика',
    features: [
      '350 ГБ трафика на максимальной скорости',
      'До 3 устройств одновременно',
      'Европейские серверы (Финляндия, Германия, Нидерланды)',
      'Обход блокировок провайдеров без просадки скорости',
      'Поддержка iOS, Android, macOS, Windows',
    ],
    durations: [
      { months: 1, days: 30, priceRub: 120 },
      { months: 3, days: 90, priceRub: 360, discount: '-10%' },
      { months: 6, days: 180, priceRub: 720, discount: '-18%' },
    ],
  },
  {
    id: 'tariff_3',
    badge: 'Хит продаж',
    popular: true,
    name: 'Стандарт + WhiteNet',
    desc: 'Флагманский тариф с защитой и отдельной квотой для мобильных сетей',
    tagline: 'Работает стабильно даже при мобильных фильтрациях',
    monthlyRub: 200,
    whiteNetQuota: '50 ГБ Белый интернет',
    devices: 'До 5 устройств',
    traffic: '750 ГБ трафика',
    features: [
      '750 ГБ скоростного трафика',
      '50 ГБ WhiteNet для мобильных сетей',
      'До 5 устройств одновременно для всей семьи',
      'Приоритетный пинг для звонков и видео 4K',
      'Мгновенная выдача ключей и автонастройка',
    ],
    durations: [
      { months: 1, days: 30, priceRub: 200 },
      { months: 3, days: 90, priceRub: 570, discount: '-10%' },
      { months: 6, days: 180, priceRub: 1080, discount: '-18%' },
    ],
  },
  {
    id: 'tariff_4',
    badge: 'Максимум',
    name: 'Премиум 💎',
    desc: 'Максимальный запас скорости, большая квота WhiteNet и топ-приоритет',
    tagline: 'Для требовательных пользователей и больших нагрузок',
    monthlyRub: 400,
    whiteNetQuota: '150 ГБ Белый интернет',
    devices: 'До 10 устройств',
    traffic: '1 000 ГБ трафика',
    features: [
      '1 000 ГБ скоростного трафика',
      '150 ГБ WhiteNet с наивысшим приоритетом',
      'До 10 устройств на одной подписке',
      'Выделенные высокоскоростные 10 Gbps узлы',
      'Персональная поддержка в Telegram 24/7',
    ],
    durations: [
      { months: 1, days: 30, priceRub: 400 },
      { months: 3, days: 90, priceRub: 1140, discount: '-10%' },
      { months: 6, days: 180, priceRub: 2160, discount: '-18%' },
    ],
  },
];

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedDurations, setSelectedDurations] = useState<Record<string, number>>({
    tariff_2: 1,
    tariff_3: 1,
    tariff_4: 1,
  });
  const [plans, setPlans] = useState<ProcessedPlan[]>(FALLBACK_PLANS);
  const [nodes, setNodes] = useState<LandingNode[]>(FALLBACK_NODES);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    let mounted = true;

    const fetchLandingData = async (isPoll = false) => {
      if (isPoll) setIsUpdating(true);
      try {
        const res = await fetch('/api/cabinet/landing/default?lang=ru');
        if (!res.ok) throw new Error('Failed to load tariffs');
        const data = await res.json();
        if (!mounted) return;

        if (data?.nodes && Array.isArray(data.nodes) && data.nodes.length > 0) {
          setNodes(data.nodes);
          setIsLiveConnected(true);
          setLastUpdated(new Date());
        }

        if (!isPoll && data?.tariffs && Array.isArray(data.tariffs) && data.tariffs.length > 0) {
          const rawTariffs: DbTariff[] = data.tariffs;
          const mapped: ProcessedPlan[] = rawTariffs.map((t, idx) => {
            const trafficGb = t.traffic_limit_gb || (t.id === 2 ? 350 : t.id === 3 ? 750 : 1000);
            const isHit = trafficGb > 500 && trafficGb < 900;
            const isMax = trafficGb >= 900;
            const planKey = `tariff_${t.id}`;

            let durations = [
              { months: 1, days: 30, priceRub: 0 },
              { months: 3, days: 90, priceRub: 0, discount: '-10%' },
              { months: 6, days: 180, priceRub: 0, discount: '-18%' },
            ];

            if (t.periods && t.periods.length > 0) {
              const p30 = t.periods.find((p) => p.days === 30) || t.periods[0];
              const p90 = t.periods.find((p) => p.days === 90);
              const p180 = t.periods.find((p) => p.days === 180);

              const price30 = Math.round(p30.price_kopeks / 100);
              const price90 = p90
                ? Math.round(p90.price_kopeks / 100)
                : Math.round(price30 * 3 * 0.9);
              const price180 = p180
                ? Math.round(p180.price_kopeks / 100)
                : Math.round(price30 * 6 * 0.82);

              durations = [
                { months: 1, days: 30, priceRub: price30 },
                {
                  months: 3,
                  days: 90,
                  priceRub: price90,
                  discount: p90?.discount_percent ? `-${p90.discount_percent}%` : '-10%',
                },
                {
                  months: 6,
                  days: 180,
                  priceRub: price180,
                  discount: p180?.discount_percent ? `-${p180.discount_percent}%` : '-18%',
                },
              ];
            }

            const mPrice = durations[0]?.priceRub || 0;
            const cleanName = t.name.replace(/🛡️|🌐|💎|LTE/g, '').trim();
            const whiteNetQuota = isMax
              ? '150 ГБ Белый интернет'
              : isHit
                ? '50 ГБ Белый интернет'
                : undefined;

            return {
              id: planKey,
              dbId: t.id,
              name: isMax ? `${cleanName} 💎` : isHit ? `${cleanName} + WhiteNet` : cleanName,
              popular: isHit || idx === 1,
              badge: isHit ? 'Хит продаж' : isMax ? 'Максимум' : undefined,
              desc: isMax
                ? 'Максимальный запас скорости, большая квота WhiteNet и персональный приоритет'
                : isHit
                  ? 'Флагманский тариф с защитой и отдельной квотой для мобильных сетей'
                  : 'Надежный быстрый доступ для сайтов, видео и приложений каждый день',
              tagline: isMax
                ? 'Для требовательных пользователей и больших нагрузок'
                : isHit
                  ? 'Работает стабильно даже при мобильных фильтрациях'
                  : 'Идеально для смартфона и ноутбука каждый день',
              monthlyRub: mPrice,
              devices: `До ${t.device_limit || 3} устройств`,
              traffic: `${trafficGb} ГБ трафика`,
              whiteNetQuota,
              features: [
                `${trafficGb} ГБ скоростного трафика`,
                ...(whiteNetQuota ? [whiteNetQuota] : []),
                `До ${t.device_limit || 3} устройств одновременно`,
                'Европейские серверы (Финляндия, Германия, Нидерланды)',
                'Поддержка iOS, Android, macOS, Windows',
              ],
              durations,
            };
          });

          setPlans(mapped);
          setSelectedDurations(mapped.reduce((acc, p) => ({ ...acc, [p.id]: 1 }), {}));
        }
      } catch (err) {
        console.warn('Using fallback data:', err);
      } finally {
        if (mounted) {
          setTimeout(() => {
            if (mounted) setIsUpdating(false);
          }, 600);
        }
      }
    };

    void fetchLandingData(false);

    const interval = setInterval(() => {
      void fetchLandingData(true);
    }, 20_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSelectDuration = (planId: string, months: number) => {
    setSelectedDurations((prev) => ({ ...prev, [planId]: months }));
  };

  return (
    <div
      data-testid="landing-page"
      className="min-h-screen bg-[#07080a] text-zinc-100 selection:bg-[#a5e8c4] selection:text-[#0b0c0e] font-sans antialiased overflow-x-hidden"
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[550px] bg-[#a5e8c4]/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[160px]" />
        <div className="absolute top-[70%] -right-[10%] w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[180px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Floating Header */}
      <header className="sticky top-4 z-50 max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#0e1115]/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60">
          <Link to="/" className="flex items-center gap-3 group">
            <BrandLogo iconClassName="w-8 h-8 rounded-xl" textClassName="hidden" />
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-white via-zinc-200 to-[#a5e8c4] bg-clip-text text-transparent group-hover:to-emerald-400 transition-all">
                INVOXY
              </span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest -mt-1 font-mono">
                БЫСТРЫЙ VPN
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wide text-zinc-300">
            <a href="#features" className="hover:text-[#a5e8c4] transition-colors">
              Преимущества
            </a>
            <a href="#tariffs" className="hover:text-[#a5e8c4] transition-colors">
              Тарифы
            </a>
            <a href="#apps" className="hover:text-[#a5e8c4] transition-colors">
              Приложения
            </a>
            <a href="#status" className="hover:text-[#a5e8c4] transition-colors">
              Серверы
            </a>
            <a href="#faq" className="hover:text-[#a5e8c4] transition-colors">
              Вопросы и ответы
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://t.me/invoxy_bot"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition"
            >
              Telegram Бот
            </a>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-[#a5e8c4] to-emerald-400 text-[#0b0c0e] hover:brightness-110 shadow-lg shadow-[#a5e8c4]/20 transition active:scale-95"
            >
              Личный кабинет
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 md:pt-28 md:pb-32 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#a5e8c4]/10 border border-[#a5e8c4]/25 text-[#a5e8c4] text-xs font-semibold tracking-wide"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#a5e8c4]" />
              Стабильное соединение без зависаний и рекламы
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]"
            >
              Интернет на полной скорости:{' '}
              <span className="bg-gradient-to-r from-[#a5e8c4] via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                YouTube 4K, Telegram и любимые сайты
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg text-zinc-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed"
            >
              Подключение в один клик. Никаких сложных настроек — работает сразу на телефоне,
              компьютере и планшете без тормозов и ограничений операторов.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <a
                href="#tariffs"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-[#a5e8c4] text-[#0b0c0e] font-black text-sm hover:brightness-110 shadow-xl shadow-[#a5e8c4]/25 transition active:scale-95"
              >
                Выбрать тариф
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://t.me/invoxy_bot"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 text-zinc-200 hover:text-white hover:bg-zinc-800/80 font-bold text-sm transition"
              >
                <Zap className="w-4 h-4 text-[#a5e8c4]" />
                Попробовать бесплатно
              </a>
            </motion.div>

            {/* Micro stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="pt-6 grid grid-cols-3 gap-4 border-t border-white/5 max-w-lg mx-auto lg:mx-0"
            >
              <div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">99.98%</div>
                <div className="text-xs text-zinc-400 mt-0.5">Надежность сети</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-[#a5e8c4] font-mono">
                  10 Gbps
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">Скорость серверов</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">0 логов</div>
                <div className="text-xs text-zinc-400 mt-0.5">Полная анонимность</div>
              </div>
            </motion.div>
          </div>

          {/* Hero Visual Card: Bespoke Live Security Radar & Connection Engine */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-md rounded-3xl p-1 bg-gradient-to-b from-[#a5e8c4]/40 via-emerald-500/10 to-transparent shadow-2xl shadow-[#a5e8c4]/15">
              <div className="rounded-[22px] bg-[#0c0f13] p-6 space-y-5 overflow-hidden relative border border-white/5">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#a5e8c4]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Radar & Cryptographic Shield Interactive Display */}
                <div className="relative h-64 rounded-2xl overflow-hidden border border-emerald-500/20 bg-[#07090d] flex flex-col items-center justify-between p-4 group">
                  {/* Cyber Grid & Radar Sweep */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle, #a5e8c4 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                    }}
                  />

                  {/* Concentric Pulsing Radar Rings */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 rounded-full border border-emerald-500/15 animate-ping [animation-duration:4s]" />
                    <div className="w-36 h-36 rounded-full border border-[#a5e8c4]/20 animate-pulse" />
                    <div className="w-24 h-24 rounded-full border border-emerald-400/30" />
                  </div>

                  {/* Top Status Bar */}
                  <div className="relative z-10 w-full flex items-center justify-between">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-medium">Шифрование XTLS Vision</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#a5e8c4] bg-[#a5e8c4]/10 px-2 py-0.5 rounded-full border border-[#a5e8c4]/25">
                      VLESS • 0% LOSS
                    </span>
                  </div>

                  {/* Central Animated Shield Core */}
                  <div className="relative z-10 my-auto flex flex-col items-center">
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(165, 232, 196, 0.2)',
                          '0 0 40px rgba(165, 232, 196, 0.45)',
                          '0 0 20px rgba(165, 232, 196, 0.2)',
                        ],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#0f171c] to-[#162423] border border-[#a5e8c4]/40 flex items-center justify-center text-[#a5e8c4] relative"
                    >
                      <ShieldCheck className="w-10 h-10" />
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0c0f13] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    </motion.div>
                    <div className="mt-3 text-center">
                      <div className="text-xs font-bold text-white tracking-wide">
                        Invoxy Zero-Leak Tunnel
                      </div>
                      <div className="text-[11px] text-[#a5e8c4] font-mono mt-0.5">
                        AES-256-GCM · Direct Carrier Route
                      </div>
                    </div>
                  </div>

                  {/* Bottom Metrics Pill */}
                  <div className="relative z-10 w-full flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                      <span>MTU:</span>
                      <span className="text-zinc-200">1420</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                      <span>Задержка:</span>
                      <span className="text-[#a5e8c4] font-bold">~16 ms</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                      <span>Канал:</span>
                      <span className="text-emerald-300 font-bold">10 Gbps</span>
                    </div>
                  </div>
                </div>

                {/* Feature Pills */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[#a5e8c4]">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-200">
                          Маскировка трафика под HTTPS
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Невидим для фильтров и систем глубокой проверки (DPI)
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#a5e8c4] bg-[#a5e8c4]/10 px-2 py-0.5 rounded">
                      ВКЛ
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-300">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-200">
                          Белые списки операторов
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Оптимизация под МТС, Билайн, МегаФон и Т2
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded">
                      LIVE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Visual Features Section: Interactive High-Craft Widgets */}
      <section
        id="features"
        className="relative z-10 py-16 px-4 max-w-6xl mx-auto border-t border-white/5"
      >
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a5e8c4]/10 border border-[#a5e8c4]/20 text-[#a5e8c4] text-xs font-semibold mb-3">
            Преимущества Invoxy
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Всё просто: включил и пользуешься
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Никаких капчей, никаких падений скорости в часы пик и переплат за девайсы.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Interactive High-Speed Throughput Meter */}
          <div className="p-6 rounded-3xl bg-[#0c0f13] border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-[#a5e8c4]/40 transition-all shadow-lg hover:shadow-[#a5e8c4]/5">
            <div className="h-44 rounded-2xl overflow-hidden bg-[#07090d] border border-white/5 p-4 mb-5 relative flex flex-col justify-between">
              {/* Grid backdrop */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #a5e8c4 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />

              <div className="relative z-10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-mono text-[11px] uppercase tracking-wider">
                    Stream: 4K 60fps
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] text-[#a5e8c4] bg-[#a5e8c4]/10 border border-[#a5e8c4]/20">
                  0 ms Jitter
                </span>
              </div>

              {/* Dynamic Throughput Gauge Graphic */}
              <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                <div className="text-3xl font-black font-mono text-white tracking-tight flex items-baseline gap-1">
                  <span>940.8</span>
                  <span className="text-sm font-semibold text-[#a5e8c4]">Mbps</span>
                </div>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  Прямой пиринг • Без шейпинга
                </div>

                {/* Animated visual equalizer / bars */}
                <div className="flex items-end gap-1.5 h-6 mt-3">
                  {[40, 65, 90, 75, 100, 85, 95, 60, 80, 95, 70, 85].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [`${Math.max(25, h - 30)}%`, `${h}%`, `${Math.max(20, h - 20)}%`],
                      }}
                      transition={{
                        duration: 1.2 + (i % 3) * 0.3,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                      }}
                      className="w-1.5 bg-gradient-to-t from-emerald-500/40 to-[#a5e8c4] rounded-full"
                    />
                  ))}
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-2 border-t border-white/5">
                <span>Loss: 0.00%</span>
                <span className="text-emerald-300">Buffer: Instant</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-2">Видео 4K без буферизации</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Смотрите YouTube, стримы и тяжелые файлы в максимальном качестве. Пропускная
                способность выделенных серверов рассчитана на любые часы пик.
              </p>
            </div>
          </div>

          {/* Card 2: Interactive Instant Bot Connection Simulation */}
          <div className="p-6 rounded-3xl bg-[#0c0f13] border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-emerald-400/40 transition-all shadow-lg hover:shadow-emerald-400/5">
            <div className="h-44 rounded-2xl overflow-hidden bg-[#07090d] border border-white/5 p-3.5 mb-5 relative flex flex-col justify-between">
              {/* Header with bot indicator */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-[#a5e8c4] flex items-center justify-center">
                    <Bot className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-zinc-200">@invoxy_bot</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  1 клик
                </span>
              </div>

              {/* Chat bubble snippet */}
              <div className="my-auto space-y-2">
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 text-[11px] text-zinc-300">
                  <div className="font-semibold text-[#a5e8c4] mb-0.5">
                    Ваш бесплатный ключ готов:
                  </div>
                  <div className="font-mono text-[10px] text-zinc-400 truncate bg-black/40 px-2 py-1 rounded border border-white/5">
                    vless://invoxy-trial@fi1.invoxy.net:443?security=reality
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] px-1">
                  <span className="text-zinc-400">Тестовый период:</span>
                  <span className="font-bold text-emerald-300">3 дня бесплатно</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[10px] text-zinc-400">Без ввода карт</span>
                <span className="text-[10px] font-bold text-[#a5e8c4] flex items-center gap-1">
                  Запустить тест →
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-2">Бесплатный тест сразу</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Попробуйте сервис перед покупкой в один клик через Telegram. Убедитесь сами в
                скорости и надежности соединения на своих устройствах.
              </p>
            </div>
          </div>

          {/* Card 3: Multi-device Mesh / Ecosystem Matrix */}
          <div className="p-6 rounded-3xl bg-[#0c0f13] border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-teal-400/40 transition-all shadow-lg hover:shadow-teal-400/5">
            <div className="h-44 rounded-2xl overflow-hidden bg-[#07090d] border border-white/5 p-3.5 mb-5 relative flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-zinc-200">Экосистема устройств</span>
                <span className="text-[10px] font-mono text-[#a5e8c4] bg-[#a5e8c4]/10 px-2 py-0.5 rounded-full border border-[#a5e8c4]/20">
                  До 10 устройств
                </span>
              </div>

              {/* Mesh visual with interconnected nodes */}
              <div className="relative my-auto flex items-center justify-center gap-3">
                {/* Device 1: Phone */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#a5e8c4] shadow-sm">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">iOS / Android</span>
                </div>

                {/* Connecting Pulse Line */}
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <div className="w-8 h-[1px] bg-gradient-to-r from-emerald-400 to-[#a5e8c4]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a5e8c4]" />
                </div>

                {/* Device 2: Laptop */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-teal-300 shadow-sm">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">macOS / Win</span>
                </div>

                {/* Device 3: TV / Other */}
                <div className="hidden sm:flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-emerald-400 shadow-sm">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Android TV</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono text-zinc-400">
                <span>Общий баланс трафика</span>
                <span className="text-teal-300 font-bold">Без доплат</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-2">Одна подписка на всю семью</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Подключайте до 10 устройств одновременно: смартфоны, рабочие ноутбуки, планшеты и
                умные телевизоры без переплат за каждый девайс.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Two Ways to Use: Telegram vs Web */}
      <section className="relative z-10 py-16 px-4 max-w-6xl mx-auto border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Пользуйтесь так, как удобно вам
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Invoxy доступен и как удобный бот в Telegram, и как веб-кабинет в любом браузере.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-7 rounded-3xl bg-[#0e1217]/90 border border-white/10 relative overflow-hidden group hover:border-[#a5e8c4]/30 transition-all">
            <div className="absolute top-0 right-0 p-8 w-40 h-40 bg-[#a5e8c4]/5 rounded-full blur-2xl group-hover:bg-[#a5e8c4]/10 transition-all" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#a5e8c4]/10 flex items-center justify-center text-[#a5e8c4]">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Telegram Бот</h3>
                <span className="text-xs text-[#a5e8c4] font-medium">
                  Мгновенный старт в 1 клик
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed mb-6">
              Управление подпиской прямо в мессенджере. Никаких паролей — удобная оплата через СБП
              или картой и мгновенное получение ключей.
            </p>
            <a
              href="https://t.me/invoxy_bot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 transition"
            >
              Открыть в Telegram
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-7 rounded-3xl bg-[#0e1217]/90 border border-white/10 relative overflow-hidden group hover:border-emerald-400/30 transition-all">
            <div className="absolute top-0 right-0 p-8 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Веб-кабинет Invoxy</h3>
                <span className="text-xs text-emerald-400 font-medium">Для ПК и браузеров</span>
              </div>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed mb-6">
              Удобный доступ с любого компьютера или смартфона. Скачивание конфигов, QR-коды для
              камеры, статистика трафика и история оплат.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-[#a5e8c4] text-[#0b0c0e] hover:brightness-110 shadow-lg shadow-[#a5e8c4]/15 transition"
            >
              Войти в кабинет
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Tariffs Section */}
      <section
        id="tariffs"
        className="relative z-10 py-20 px-4 max-w-6xl mx-auto border-t border-white/5"
      >
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a5e8c4]/10 border border-[#a5e8c4]/20 text-[#a5e8c4] text-xs font-semibold mb-3">
            Тарифные планы
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Выберите подходящий тариф
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Цены подтягиваются в реальном времени. При оплате на 3 или 6 месяцев действует скидка.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const currentMonths = selectedDurations[plan.id] || 1;
            const currentDuration =
              plan.durations.find((d) => d.months === currentMonths) || plan.durations[0];
            const monthlyPrice = Math.round(currentDuration.priceRub / currentDuration.months);

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-[#12181f] to-[#0c0f13] border-2 border-[#a5e8c4]/60 shadow-2xl shadow-[#a5e8c4]/10 scale-[1.02]'
                    : 'bg-[#0c0f13]/90 border border-white/10 hover:border-white/20'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#a5e8c4] to-emerald-400 text-[#0b0c0e] font-black text-xs uppercase tracking-wider shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    {plan.whiteNetQuota && (
                      <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        LTE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed min-h-[36px]">
                    {plan.desc}
                  </p>

                  {/* Price & Duration selector */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white font-mono">
                        {currentDuration.priceRub} ₽
                      </span>
                      <span className="text-xs text-zinc-400">
                        {currentDuration.months === 1
                          ? '/ мес'
                          : `за ${currentDuration.months} мес (${monthlyPrice} ₽/мес)`}
                      </span>
                    </div>

                    {/* Period Switcher (1 / 3 / 6 мес) */}
                    <div className="mt-4 grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/5">
                      {plan.durations.map((d) => (
                        <button
                          key={d.months}
                          type="button"
                          onClick={() => handleSelectDuration(plan.id, d.months)}
                          className={`relative py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                            currentMonths === d.months
                              ? 'bg-[#a5e8c4] text-[#0b0c0e] shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {d.months} мес
                          {d.discount && (
                            <span
                              className={`ml-1 text-[9px] px-1 rounded ${
                                currentMonths === d.months
                                  ? 'bg-black/20 text-[#0b0c0e]'
                                  : 'bg-emerald-500/20 text-[#a5e8c4]'
                              }`}
                            >
                              {d.discount}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="mt-6 space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Что входит в тариф:
                    </div>
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-[#a5e8c4] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="mt-8 pt-6 border-t border-white/10 space-y-2">
                  <Link
                    to="/login"
                    className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition active:scale-95 ${
                      plan.popular
                        ? 'bg-[#a5e8c4] text-[#0b0c0e] hover:brightness-110 shadow-lg shadow-[#a5e8c4]/20'
                        : 'bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    Подключить на сайте
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <a
                    href="https://t.me/invoxy_bot"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-[11px] text-zinc-400 hover:text-zinc-200 transition"
                  >
                    или оплатить через Telegram бота
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Server Status from RemnaWave */}
      <section
        id="status"
        className="relative z-10 py-16 px-4 max-w-6xl mx-auto border-t border-white/5"
      >
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0c0f14] via-[#0e1319] to-[#0c0f14] border border-white/10 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isUpdating
                      ? 'bg-mint scale-125 transition-transform'
                      : 'bg-emerald-400 animate-pulse'
                  }`}
                />
                <span>
                  {isLiveConnected
                    ? 'Сеть онлайн · Мониторинг в реальном времени'
                    : 'Все серверы работают штатно'}
                </span>
                {isUpdating && (
                  <span className="text-[10px] text-mint font-mono uppercase tracking-wider ml-1 animate-pulse">
                    обновление...
                  </span>
                )}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Выделенные магистральные каналы 10 Gbps
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Прямые аплинки в европейские дата-центры первого уровня. Данные нагрузки и отклика
                обновляются автоматически.
              </p>
            </div>

            {/* Live refresh & view toggle controls */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-zinc-400">Синхронизация:</span>
                <span className="text-[#a5e8c4]">
                  {lastUpdated.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>

              <div className="inline-flex rounded-xl bg-white/[0.04] p-1 border border-white/5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeTab === 'list'
                      ? 'bg-emerald-400/20 text-emerald-300 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Список
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('grid')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeTab === 'grid'
                      ? 'bg-emerald-400/20 text-emerald-300 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Сетка
                </button>
              </div>
            </div>
          </div>

          {/* Servers Display */}
          <div className="mt-6">
            {activeTab === 'list' ? (
              <div className="divide-y divide-white/5 rounded-2xl overflow-hidden border border-white/5 bg-black/20">
                {nodes.map((s, idx) => (
                  <motion.div
                    key={s.node_name || idx}
                    initial={{ opacity: 0.8 }}
                    animate={{
                      opacity: 1,
                      backgroundColor: isUpdating
                        ? 'rgba(165, 232, 196, 0.03)'
                        : 'rgba(0, 0, 0, 0)',
                    }}
                    transition={{ duration: 0.4 }}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Globe2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-100 truncate">
                            {s.node_name || `${s.country_name} #${idx + 1}`}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-zinc-300">
                            {s.country_code}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>{s.country_name}</span>
                          <span>•</span>
                          <span className="text-zinc-400">{s.city}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t border-white/5 sm:border-0 text-xs">
                      {/* Live Ping Indicator */}
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">Пинг:</span>
                        <motion.span
                          key={s.ping_ms}
                          initial={{ scale: 1.15, color: '#a5e8c4' }}
                          animate={{ scale: 1, color: '#a5e8c4' }}
                          transition={{ duration: 0.35 }}
                          className="font-mono font-bold text-xs"
                        >
                          {s.ping_ms} ms
                        </motion.span>
                      </div>

                      {/* Live Load bar */}
                      <div className="flex items-center gap-2 w-36 sm:w-44">
                        <span className="text-zinc-400 text-[11px] shrink-0">Нагрузка:</span>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden p-0.5 relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.load_percent}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              s.load_percent > 75
                                ? 'bg-amber-400'
                                : s.load_percent > 90
                                  ? 'bg-rose-400'
                                  : 'bg-gradient-to-r from-emerald-400 to-[#a5e8c4]'
                            }`}
                          />
                        </div>
                        <span className="font-mono text-zinc-300 text-[11px] w-8 text-right shrink-0">
                          {s.load_percent}%
                        </span>
                      </div>

                      {/* Online status indicator */}
                      <div className="flex items-center gap-1.5 shrink-0 pl-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <span className="text-[11px] text-emerald-300 hidden md:inline">
                          Online
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {nodes.map((s, idx) => (
                  <motion.div
                    key={s.node_name || idx}
                    initial={{ opacity: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: isUpdating ? 0.99 : 1,
                    }}
                    transition={{ duration: 0.35 }}
                    className="p-4 rounded-2xl bg-white/[0.025] border border-white/5 hover:border-emerald-500/25 transition-all relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-sm text-zinc-100 truncate">
                          {s.node_name || s.country_name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/10 text-zinc-300 shrink-0">
                          {s.country_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      </div>
                    </div>

                    <div className="text-xs text-zinc-400 truncate mb-3">
                      {s.country_name}, {s.city}
                    </div>

                    <div className="space-y-2 pt-2.5 border-t border-white/5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Пинг:</span>
                        <motion.span
                          key={s.ping_ms}
                          initial={{ scale: 1.15, color: '#a5e8c4' }}
                          animate={{ scale: 1, color: '#a5e8c4' }}
                          transition={{ duration: 0.35 }}
                          className="font-mono font-bold text-xs"
                        >
                          {s.ping_ms} ms
                        </motion.span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-zinc-400">Нагрузка:</span>
                          <span className="font-mono text-zinc-300">{s.load_percent}%</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.load_percent}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              s.load_percent > 75
                                ? 'bg-amber-400'
                                : 'bg-gradient-to-r from-emerald-400 to-[#a5e8c4]'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Apps / Compatibility Section */}
      <section
        id="apps"
        className="relative z-10 py-16 px-4 max-w-6xl mx-auto border-t border-white/5"
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Работает на всех ваших устройствах
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Подключение за 1 минуту. Скачайте приложение для вашей системы и просто отсканируйте
            QR-код или нажмите одну кнопку.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: 'iPhone & iPad', app: 'v2rayTun / Happ / Streisand', icon: Smartphone },
            { name: 'Android', app: 'v2rayNG / Happ / NekoBox', icon: Smartphone },
            { name: 'macOS', app: 'Happ / V2RayX / Clash Verge', icon: Laptop },
            { name: 'Windows', app: 'Happ / Hiddify / NekoRay', icon: Laptop },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#0c0f13] border border-white/10 text-center hover:border-white/20 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 mx-auto flex items-center justify-center text-[#a5e8c4] mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-white">{item.name}</div>
                <div className="text-[11px] text-zinc-400 mt-1 font-mono">{item.app}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section
        id="faq"
        className="relative z-10 py-16 px-4 max-w-4xl mx-auto border-t border-white/5"
      >
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Часто задаваемые вопросы
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Почему через Invoxy интернет работает быстрее?',
              a: 'Мы используем современные протоколы соединения и маскировки, которые не режутся интернет-провайдерами и не вызывают замедлений. Весь трафик идет по прямым 10 Gbps европейским магистралям.',
            },
            {
              q: 'Что такое квота WhiteNet?',
              a: 'Это дополнительный резервный скоростной контур, спроектированный для бесперебойной работы на сотовых операторах (МТС, Билайн, МегаФон, Т2) даже во время повышенных мобильных фильтраций.',
            },
            {
              q: 'Сколько устройств можно подключить на одну подписку?',
              a: 'От 3 до 10 устройств в зависимости от тарифа. Вы можете одновременно подключить телефон, рабочий ноутбук, планшет и устройства близких.',
            },
            {
              q: 'Как подключиться после оплаты?',
              a: 'Сразу после оплаты в личном кабинете на сайте или в Telegram-боте вы получите готовую ссылку для добавления в приложение в 1 клик или QR-код для камеры смартфона.',
            },
            {
              q: 'Ведутся ли логи сайтов?',
              a: 'Нет, мы принципиально не собираем и не сохраняем логи активности, адреса сайтов или DNS-запросы. Ваша приватность полностью защищена.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-[#0c0f13] border border-white/10 overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-bold text-sm text-zinc-200 hover:text-white"
              >
                <span>{item.q}</span>
                {activeFaq === idx ? (
                  <Minus className="w-4 h-4 text-[#a5e8c4] shrink-0" />
                ) : (
                  <Plus className="w-4 h-4 text-zinc-500 shrink-0" />
                )}
              </button>
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 border-t border-white/10 bg-[#060709]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo iconClassName="w-8 h-8 rounded-xl" textClassName="hidden" />
            <div className="text-xs text-zinc-400">
              © {new Date().getFullYear()} Invoxy. Все права защищены.
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-400">
            <a
              href="https://t.me/invoxy_bot"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              Telegram Бот
            </a>
            <Link to="/login" className="hover:text-white transition">
              Кабинет
            </Link>
            <a
              href="https://t.me/invoxy_support"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              Поддержка
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
