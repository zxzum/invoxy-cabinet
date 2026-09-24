import { useState, useEffect, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
  type NetworkNode,
  type NetworkSummary,
  INITIAL_NETWORK_EVENTS,
} from '@/data/networkSnapshot';
import { fetchPublicNetworkStatus } from '@/api/publicNetwork';

const BOT_USERNAME = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'invoxy_bot').replace(/^@/, '');
const TELEGRAM_BOT_URL = `https://t.me/${BOT_USERNAME}`;

interface NetworkBoardProps {
  selectedNodeId?: string;
  onSelectNode?: (node: NetworkNode) => void;
}

export function NetworkBoard({ selectedNodeId, onSelectNode }: NetworkBoardProps) {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [summary, setSummary] = useState<NetworkSummary | null>(null);
  const [activeId, setActiveId] = useState<string>('nl-04');
  const [jitterMap, setJitterMap] = useState<Record<string, number>>({});
  const [eventIndex, setEventIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Sync external selectedNodeId if provided
  useEffect(() => {
    if (selectedNodeId && selectedNodeId !== activeId) {
      setActiveId(selectedNodeId);
    }
  }, [selectedNodeId]);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Fetch initial node data
  useEffect(() => {
    let mounted = true;
    void fetchPublicNetworkStatus().then((res) => {
      if (!mounted) return;
      setNodes(res.nodes);
      setSummary(res.summary);
      if (res.nodes.length > 0 && !selectedNodeId) {
        setActiveId(res.nodes[0].id);
        onSelectNode?.(res.nodes[0]);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Periodic subtle ping/load jitter (simulating live telemetry)
  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setJitterMap((prev) => {
        const next: Record<string, number> = { ...prev };
        nodes.forEach((node) => {
          // slight jitter ±2ms
          const delta = Math.floor(Math.random() * 5) - 2;
          next[node.id] = delta;
        });
        return next;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [nodes, prefersReducedMotion]);

  // Event ticker rotation
  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setEventIndex((prev) => (prev + 1) % INITIAL_NETWORK_EVENTS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  const activeNode = useMemo(() => {
    return nodes.find((n) => n.id === activeId) || nodes[0];
  }, [nodes, activeId]);

  const handleSelect = (node: NetworkNode) => {
    setActiveId(node.id);
    onSelectNode?.(node);
  };

  return (
    <div
      id="network"
      className="glass-panel relative rounded-2xl sm:rounded-3xl border border-line/80 bg-surface/85 p-3.5 sm:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.5)] overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-mint/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-[#1e3a8a]/15 blur-3xl"
        aria-hidden="true"
      />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-3 sm:pb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5 shrink-0">
            {!prefersReducedMotion && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
            )}
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mint" />
          </div>
          <span className="font-display-landing text-sm sm:text-base font-semibold tracking-wide text-ink">
            Сеть Invoxy
          </span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono-landing text-[10px] text-muted border border-line">
            VLESS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full border border-line/80 bg-surface px-2 py-0.5 font-mono-landing text-[10px] text-muted shrink-0"
            aria-live="polite"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-mint/70" />
            маскировано
          </span>
        </div>
      </div>

      {/* Top telemetry counters */}
      <div className="my-3 sm:my-4 grid grid-cols-3 gap-1.5 sm:gap-3 rounded-xl sm:rounded-2xl bg-surface-2/60 p-2.5 sm:p-3 border border-line/40 font-mono-landing text-center">
        <div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted">
            Онлайн
          </div>
          <div className="mt-0.5 text-xs sm:text-base font-semibold text-mint">
            {summary?.onlineNodes || '6/6'}
          </div>
        </div>
        <div className="border-x border-line/40">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted">Пинг</div>
          <div className="mt-0.5 text-xs sm:text-base font-semibold text-ink">
            ~{summary?.medianPing || 28} мс
          </div>
        </div>
        <div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted">
            Потери
          </div>
          <div className="mt-0.5 text-xs sm:text-base font-semibold text-[#86efac]">
            {summary?.packetLoss || '<0.1%'}
          </div>
        </div>
      </div>

      {/* Nodes list */}
      <div className="space-y-1.5" role="list" aria-label="Список серверов Invoxy">
        {nodes.map((node) => {
          const isSelected = node.id === activeId;
          const currentPing = Math.max(12, node.ping + (jitterMap[node.id] || 0));

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => handleSelect(node)}
              className={`w-full text-left rounded-xl px-3 sm:px-3.5 py-2.5 transition-all flex items-center justify-between gap-3 border ${
                isSelected
                  ? 'border-mint/60 bg-mint/10 shadow-[0_0_18px_rgba(165,232,196,0.15)] ring-1 ring-mint/40'
                  : 'border-transparent bg-surface/50 hover:border-line hover:bg-surface-2/60'
              }`}
            >
              {/* Node identification */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg leading-none" role="img" aria-label={node.countryName}>
                  {node.flagEmoji}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-landing text-xs sm:text-sm font-semibold tracking-wide text-ink">
                      {node.label}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.2 font-mono-landing text-[10px] font-medium uppercase ${
                        node.mode === 'lte'
                          ? 'bg-yellow/15 text-yellow border border-yellow/30'
                          : 'bg-surface-2 text-muted border border-line'
                      }`}
                    >
                      {node.mode === 'lte' ? 'LTE · Белый' : 'Reality'}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted truncate">{node.countryName}</div>
                </div>
              </div>

              {/* Node load and ping */}
              <div className="flex items-center gap-3 sm:gap-4 shrink-0 font-mono-landing">
                {/* Load bar */}
                <div className="hidden xs:flex flex-col items-end gap-1 w-16 sm:w-20">
                  <div className="flex items-center justify-between w-full text-[10px] text-muted">
                    <span>нагрузка</span>
                    <span>{node.load}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        node.load > 70 ? 'bg-yellow' : 'bg-mint'
                      }`}
                      style={{ width: `${node.load}%` }}
                    />
                  </div>
                </div>

                {/* Ping badge */}
                <span className="inline-flex items-center gap-1 text-xs text-ink">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      node.status === 'online'
                        ? 'bg-mint'
                        : node.status === 'busy'
                          ? 'bg-yellow'
                          : 'bg-muted'
                    }`}
                  />
                  ~{currentPing} мс
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected node expanded details panel */}
      {activeNode && (
        <div className="mt-4 rounded-2xl border border-line bg-surface-2/80 p-3.5 sm:p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">{activeNode.flagEmoji}</span>
              <span className="font-mono-landing font-semibold text-ink">
                {activeNode.label} ({activeNode.countryName})
              </span>
              <span className="text-muted">·</span>
              <span className="text-mint font-medium">
                {activeNode.mode === 'lte'
                  ? 'Режим LTE (Белый интернет)'
                  : 'Протокол VLESS Reality'}
              </span>
            </div>

            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="button-lift rounded-lg bg-mint px-3 py-1 font-semibold text-bg text-[11px] hover:brightness-105 inline-flex items-center gap-1 shadow-[0_0_12px_rgba(165,232,196,0.25)]"
            >
              Подключиться →
            </a>
          </div>

          <p className="mt-2 text-muted leading-relaxed">{activeNode.recommendation}</p>
        </div>
      )}

      {/* Live masked events ticker */}
      <div className="mt-3.5 flex items-center gap-2 border-t border-line/60 pt-3 text-[11px] font-mono-landing text-muted">
        <span className="flex h-2 w-2 rounded-full bg-mint/60 shrink-0" />
        <span className="text-muted/70 shrink-0">События:</span>
        <div className="overflow-hidden relative h-4 w-full">
          <AnimatePresence mode="wait">
            <m.div
              key={eventIndex}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="truncate text-ink/90 font-medium"
            >
              {INITIAL_NETWORK_EVENTS[eventIndex]}
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
