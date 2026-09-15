import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@/invoxystart/components/ui/RuneIcon';

type DragState = { pointerId: number; startY: number; startTime: number; lastY: number };

export function AdaptiveDialog({
  open,
  onClose,
  titleId,
  children,
  maxWidth = 'max-w-xl',
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const dragState = useRef<DragState | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const timer = window.setTimeout(() => setMounted(false), 240);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() =>
      panelRef.current
        ?.querySelector<HTMLElement>(
          "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
        )
        ?.focus(),
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const focusable = [
        ...(panelRef.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
        ) ?? []),
      ];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!panelRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [mounted]);

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' || !event.isPrimary || closing) return;
    const time = event.timeStamp || performance.now();
    dragState.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTime: time,
      lastY: event.clientY,
    };
    panelRef.current?.classList.add('is-dragging');
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const offset = Math.max(0, event.clientY - drag.startY);
    drag.lastY = event.clientY;
    panelRef.current?.style.setProperty('--adaptive-dialog-drag-y', `${offset}px`);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const time = event.timeStamp || performance.now();
    const offset = Math.max(0, drag.lastY - drag.startY);
    const velocity = (drag.lastY - drag.startY) / Math.max(1, time - drag.startTime);
    const cancelled = event.type === 'pointercancel' || event.type === 'lostpointercapture';
    dragState.current = null;
    panelRef.current?.classList.remove('is-dragging');
    panelRef.current?.style.setProperty('--adaptive-dialog-drag-y', '0px');
    if (!cancelled && (offset > 88 || (offset > 24 && velocity > 0.7))) closeRef.current();
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className={`adaptive-dialog-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 lg:items-center lg:p-5 ${closing ? 'is-closing' : ''}`}
      onClick={(event) => event.target === event.currentTarget && closeRef.current()}
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`adaptive-dialog-panel glass-panel relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[30px] p-5 pb-[calc(20px+env(safe-area-inset-bottom))] sm:p-7 lg:rounded-[30px] lg:p-8 ${maxWidth} ${closing ? 'is-closing' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="adaptive-dialog-drag-handle mx-auto mb-4 flex h-7 w-20 touch-none items-start justify-center lg:hidden"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
        >
          <span className="mt-2 h-1.5 w-12 rounded-full bg-white/25" />
        </div>
        <button
          type="button"
          aria-label="Закрыть"
          onClick={() => closeRef.current()}
          className="glass-control absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:text-ink lg:right-6 lg:top-6"
        >
          <X size={18} />
        </button>
        {children}
      </section>
    </div>,
    document.body,
  );
}
