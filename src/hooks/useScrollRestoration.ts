import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router';

/**
 * Saves and restores scroll position for admin pages.
 * Disables browser's automatic scroll restoration.
 */
export function useScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType();
  const scrollPositions = useRef<Record<string, number>>({});

  // Disable browser's automatic scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  // Save/restore scroll for admin pages
  useEffect(() => {
    const currentPath = location.pathname;

    if (!currentPath.startsWith('/admin')) {
      // scrollRestoration = manual, и никто не сбрасывает скролл при переходе:
      // страница, открытая с прокрученного экрана, рендерилась бы «середины»,
      // а её верх (заголовок, статистика) оставался под фиксированной мобильной
      // шапкой. Назад (POP) не трогаем — позиция сохраняется, как и раньше.
      if (navType !== 'POP') window.scrollTo(0, 0);
      return;
    }

    const handleScroll = () => {
      scrollPositions.current[currentPath] = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const savedPosition = scrollPositions.current[currentPath];
    if (savedPosition !== undefined && savedPosition > 0) {
      window.scrollTo({ top: savedPosition, behavior: 'instant' });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, navType]);
}
