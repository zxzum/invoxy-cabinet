import { useEffect, useRef, useState } from 'react';

interface Shape {
  src: string;
  className: string;
  speed: number;
}

const desktopShapes: Shape[] = [
  {
    src: '/images/desktop-shape-1.webp',
    className: 'left-[65%] -top-[178px] w-[45.3vw] opacity-50',
    speed: -90,
  },
  {
    src: '/images/desktop-shape-2.webp',
    className: 'left-[51.4%] top-[379px] w-[44.4vw] opacity-50',
    speed: 130,
  },
  {
    src: '/images/desktop-shape-3.webp',
    className: '-left-[14px] top-[555px] w-[34.4vw] opacity-50',
    speed: -110,
  },
];

const mobileShapes: Shape[] = [
  {
    src: '/images/shape-1.webp',
    className: 'left-[-73px] top-[1256px] w-[253px] opacity-50 md:w-[253px]',
    speed: 90,
  },
  {
    src: '/images/shape-4.webp',
    className: 'left-[-98px] top-[174px] w-[311px] opacity-50 md:w-[311px]',
    speed: -120,
  },
  {
    src: '/images/shape-2.webp',
    className: 'left-[131px] top-[550px] w-[314px] opacity-50 md:w-[314px]',
    speed: 110,
  },
  {
    src: '/images/shape-3.webp',
    className: 'left-[200px] top-[983px] w-[298px] opacity-50 md:w-[298px]',
    speed: -100,
  },
  {
    src: '/images/shape-5.webp',
    className: 'left-[258px] top-[1433px] w-[240px] opacity-50 md:w-[240px]',
    speed: 80,
  },
];

function ShapeImage({ shape, eager = false }: { shape: Shape; eager?: boolean }) {
  return (
    <img
      src={shape.src}
      alt=""
      draggable={false}
      data-speed={shape.speed}
      decoding="async"
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'low'}
      className={`absolute select-none will-change-transform ${shape.className}`}
    />
  );
}

export function BackgroundShapes() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 1024px)').matches,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (
      !root ||
      !isDesktop ||
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;

    const shapes = Array.from(root.querySelectorAll<HTMLElement>('[data-speed]'));
    let frame = 0;
    let current = Math.min(window.scrollY, 1600) / 1600;
    let target = current;
    const paint = (progress: number) => {
      for (const shape of shapes) {
        const offset = progress * Number(shape.dataset.speed || 0);
        shape.style.transform = `translate3d(0, ${offset}px, 0)`;
      }
    };
    const update = () => {
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.001) current = target;
      paint(current);
      frame = current === target ? 0 : requestAnimationFrame(update);
    };
    const onScroll = () => {
      target = Math.min(window.scrollY, 1600) / 1600;
      if (!frame) frame = requestAnimationFrame(update);
    };

    paint(current);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isDesktop]);

  const shapes = isDesktop ? desktopShapes : mobileShapes;

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(165,232,196,0.06),transparent_60%)]" />
      <div className="absolute inset-0">
        {shapes.map((shape, index) => (
          <ShapeImage key={shape.src} shape={shape} eager={index === 0} />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg/60" />
    </div>
  );
}
