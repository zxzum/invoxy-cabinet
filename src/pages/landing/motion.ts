import { useLayoutEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger);
}

const nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

/** Runs once: the hero entrance, hero blobs and the scroll progress line. */
function useHeroIntro(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || typeof window.matchMedia !== 'function') return;
    const mm = gsap.matchMedia(el);
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(el);
      /* Hero intro */
      const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
      intro
        .from(q('[data-hero-badge]'), { y: 18, opacity: 0, duration: 0.6 })
        .from(
          q('[data-split="hero"] [data-w-i]'),
          { yPercent: 115, rotate: 5, duration: 1, stagger: 0.07 },
          '-=0.35',
        )
        .from(q('[data-hero-sub]'), { y: 24, opacity: 0, duration: 0.7 }, '-=0.6')
        .from(
          q('[data-hero-cta] > *'),
          { y: 22, opacity: 0, duration: 0.6, stagger: 0.09 },
          '-=0.5',
        )
        .from(q('[data-hero-trust]'), { y: 14, opacity: 0, duration: 0.6 }, '-=0.3')
        .from(
          q('[data-hero-card]'),
          { y: 90, opacity: 0, rotateX: -14, transformPerspective: 1000, duration: 1.1 },
          0.35,
        );

      /* Drifting aurora blobs */
      for (const blob of q('[data-hero-bg] [data-blob]')) {
        gsap.to(blob, {
          x: 'random(-80, 80)',
          y: 'random(-50, 50)',
          scale: 'random(0.85, 1.25)',
          duration: 'random(7, 11)',
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      /* Scroll progress line */
      gsap.to(q('[data-progress]'), {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
      });
    });
    return () => mm.revert();
  }, [root]);
}

/**
 * All landing animation lives here and is driven by data-attributes, so components stay plain markup.
 * Nothing is hidden by CSS: elements are hidden by GSAP only, so the page is complete without it.
 * `ready` flips when the catalog arrives and the page height changes; scenes are rebuilt then.
 */
export function useLandingMotion(root: RefObject<HTMLElement | null>, ready: boolean) {
  useHeroIntro(root);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `ready` rebuilds the scenes once the catalog changes the page height
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || typeof window.matchMedia !== 'function') return;

    // Cursor spotlight on cards is not motion, so it also runs with reduced motion.
    const onPointer = (event: PointerEvent) => {
      const card = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-spot]');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    };
    el.addEventListener('pointermove', onPointer, { passive: true });

    const mm = gsap.matchMedia(el);

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(el);
      const once = (trigger: Element, start = 'top 86%') => ({
        trigger,
        start,
        once: true,
      });

      /* Drifting aurora blobs outside the hero */
      for (const blob of q('[data-blob]').filter((node) => !node.closest('[data-hero-bg]'))) {
        gsap.to(blob, {
          x: 'random(-60, 60)',
          y: 'random(-40, 40)',
          scale: 'random(0.9, 1.2)',
          duration: 'random(7, 11)',
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      /* Section titles: words rise out of a mask */
      for (const title of q('[data-split="scroll"]')) {
        gsap.from(title.querySelectorAll('[data-w-i]'), {
          yPercent: 115,
          rotate: 4,
          duration: 0.9,
          stagger: 0.05,
          ease: 'power4.out',
          scrollTrigger: once(title, 'top 88%'),
        });
      }

      /* Plain blocks */
      for (const block of q('[data-reveal]')) {
        gsap.from(block, {
          y: 36,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: once(block),
        });
      }

      /* Groups: children fly in one after another */
      for (const group of q('[data-stagger]')) {
        gsap.from(group.querySelectorAll(':scope > *'), {
          y: 70,
          opacity: 0,
          rotateX: -8,
          transformPerspective: 900,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: once(group, 'top 82%'),
        });
      }

      /* Numbers count up when they come into view */
      for (const node of q<HTMLElement>('[data-count]')) {
        const to = Number(node.dataset.to);
        if (!Number.isFinite(to)) continue;
        const prefix = node.dataset.prefix ?? '';
        const suffix = node.dataset.suffix ?? '';
        const counter = { v: 0 };
        node.textContent = `${prefix}0${suffix}`;
        gsap.to(counter, {
          v: to,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => {
            node.textContent = `${prefix}${nf.format(Math.round(counter.v))}${suffix}`;
          },
          onComplete: () => {
            node.textContent = `${prefix}${nf.format(to)}${suffix}`;
          },
          scrollTrigger: once(node, 'top 92%'),
        });
      }

      /* Parallax objects */
      for (const node of q<HTMLElement>('[data-parallax]')) {
        const amount = Number(node.dataset.parallax) || 60;
        gsap.fromTo(
          node,
          { y: -amount / 2 },
          {
            y: amount / 2,
            ease: 'none',
            scrollTrigger: {
              trigger: node.parentElement ?? node,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      }

      /* Spinning key */
      for (const node of q('[data-spin]')) {
        gsap.fromTo(
          node,
          { rotate: -25 },
          {
            rotate: 20,
            ease: 'none',
            scrollTrigger: {
              trigger: node.parentElement ?? node,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      }

      /* Floating chips */
      for (const node of q('[data-float]')) {
        gsap.to(node, {
          y: 'random(-16, -8)',
          duration: 'random(2.6, 4)',
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: Math.random() * 1.5,
        });
      }

      /* Connection steps: the line draws itself and each step lights up */
      for (const steps of q('[data-steps]')) {
        const line = steps.querySelector('[data-steps-line]');
        if (line) {
          gsap.fromTo(
            line,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: 'none',
              transformOrigin: 'top',
              scrollTrigger: { trigger: steps, start: 'top 65%', end: 'bottom 70%', scrub: 0.4 },
            },
          );
        }
        for (const step of steps.querySelectorAll('[data-step]')) {
          ScrollTrigger.create({
            trigger: step,
            start: 'top 68%',
            toggleClass: { targets: step, className: 'is-active' },
          });
        }
      }

      /* Checklist ticks inside the phone card */
      for (const list of q('[data-ticks]')) {
        gsap.from(list.querySelectorAll('[data-tick]'), {
          x: -24,
          opacity: 0,
          duration: 0.6,
          stagger: 0.45,
          ease: 'power3.out',
          scrollTrigger: once(list, 'top 80%'),
        });
      }

      /* Pointer-driven effects only where a real pointer exists */
      const pointerQuery = '(hover: hover) and (pointer: fine)';
      const cleanups: Array<() => void> = [];
      if (window.matchMedia(pointerQuery).matches) {
        for (const tilt of q<HTMLElement>('[data-tilt]')) {
          const rx = gsap.quickTo(tilt, 'rotationX', { duration: 0.6, ease: 'power3.out' });
          const ry = gsap.quickTo(tilt, 'rotationY', { duration: 0.6, ease: 'power3.out' });
          gsap.set(tilt, { transformPerspective: 1100 });
          const move = (event: PointerEvent) => {
            const rect = tilt.getBoundingClientRect();
            ry(((event.clientX - rect.left) / rect.width - 0.5) * 6);
            rx(-((event.clientY - rect.top) / rect.height - 0.5) * 6);
          };
          const leave = () => {
            rx(0);
            ry(0);
          };
          tilt.addEventListener('pointermove', move);
          tilt.addEventListener('pointerleave', leave);
          cleanups.push(() => {
            tilt.removeEventListener('pointermove', move);
            tilt.removeEventListener('pointerleave', leave);
          });
        }

        for (const button of q<HTMLElement>('[data-magnetic]')) {
          const mx = gsap.quickTo(button, 'x', { duration: 0.5, ease: 'power3.out' });
          const my = gsap.quickTo(button, 'y', { duration: 0.5, ease: 'power3.out' });
          const move = (event: PointerEvent) => {
            const rect = button.getBoundingClientRect();
            mx((event.clientX - (rect.left + rect.width / 2)) * 0.25);
            my((event.clientY - (rect.top + rect.height / 2)) * 0.35);
          };
          const leave = () => {
            mx(0);
            my(0);
          };
          button.addEventListener('pointermove', move);
          button.addEventListener('pointerleave', leave);
          cleanups.push(() => {
            button.removeEventListener('pointermove', move);
            button.removeEventListener('pointerleave', leave);
          });
        }
      }

      return () => {
        for (const cleanup of cleanups) cleanup();
      };
    });

    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 250);

    return () => {
      window.clearTimeout(refresh);
      el.removeEventListener('pointermove', onPointer);
      mm.revert();
    };
  }, [root, ready]);
}
