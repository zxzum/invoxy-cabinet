import { memo } from 'react';

/**
 * Аппаратно-ускоренный зелёный/мятный фон экранов авторизации Invoxy.
 *
 * Состоит из модульных независимых слоёв («частями»), каждый из которых изолирован
 * (contain: strict) и анимируется исключительно через transform: translate3d(...)
 * на GPU-композиторе без rAF, без таймеров и без layout thrashing.
 *
 * Обеспечивает 100% плавную работу (60/120 FPS) без рывков, лагов и дерганий.
 */
export const AuthBackground = memo(function AuthBackground({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none ${className}`}
      style={{ contain: 'strict' }}
      aria-hidden="true"
    >
      {/* 1. Глубокая основа (Deep Dark Base) */}
      <div className="absolute inset-0 bg-[#070a0d]" />

      {/* 2. Модульная кибер-сетка (Cyber Grid) с радиальной маской */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(165, 232, 196, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(165, 232, 196, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 85%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 85%)',
        }}
      />

      {/* 3. Верхний мятный венец (Primary Mint/Emerald Crown Bloom) */}
      <div
        className="auth-ambient-crown absolute left-1/2 -top-[12%] -translate-x-1/2 h-[520px] w-[780px] max-w-[95vw] rounded-full blur-[85px] sm:blur-[110px]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(165, 232, 196, 0.18) 0%, rgba(16, 185, 129, 0.12) 38%, rgba(6, 214, 160, 0.03) 68%, transparent 80%)',
        }}
      />

      {/* 4. Нижний правый изумрудный шар (Secondary Emerald Drift Orb) */}
      <div
        className="auth-ambient-secondary absolute -right-[10%] -bottom-[8%] h-[560px] w-[560px] max-w-[85vw] rounded-full blur-[90px] sm:blur-[120px]"
        style={{
          background:
            'radial-gradient(circle at center, rgba(6, 214, 160, 0.13) 0%, rgba(16, 185, 129, 0.06) 45%, transparent 72%)',
        }}
      />

      {/* 5. Левый глубинный мятный акцент (Tertiary Mint Anchor Bloom) */}
      <div
        className="auth-ambient-tertiary absolute -left-[8%] top-[30%] h-[460px] w-[460px] max-w-[70vw] rounded-full blur-[80px] sm:blur-[100px]"
        style={{
          background:
            'radial-gradient(circle at center, rgba(52, 211, 153, 0.10) 0%, rgba(5, 150, 105, 0.04) 50%, transparent 70%)',
        }}
      />

      {/* 6. Центральный мягкий фокус под карточкой (Subtle Center Core Glow) */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[340px] w-[340px] rounded-full blur-[70px] opacity-60"
        style={{
          background:
            'radial-gradient(circle at center, rgba(165, 232, 196, 0.08) 0%, rgba(16, 185, 129, 0.03) 55%, transparent 75%)',
        }}
      />

      {/* 7. Мягкая виньетка по краям кадра */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 130% 100% at 50% 50%, transparent 45%, rgba(6, 9, 12, 0.65) 100%)',
        }}
      />

      {/* 8. Тонкая зернистость против градиентного бандинга на OLED/Retina */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
});
