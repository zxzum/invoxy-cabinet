import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { PageHeader } from '@/invoxystart/components/layout/PageHeader';
import { Check, CheckCircle2, CirclePlus, Sparkles, X } from '@/invoxystart/components/ui/RuneIcon';
import { postJson, requestJson } from './_contentApi';

export type ActivityMode = 'polls' | 'contests' | 'wheel';

interface PollOption {
  id: number;
  text: string;
}
interface PollQuestion {
  id: number;
  text: string;
  options: PollOption[];
}
interface PollInfo {
  id: number;
  response_id: number;
  title: string;
  description: string | null;
  total_questions: number;
  answered_questions: number;
  is_completed: boolean;
  reward_amount: number | null;
}
interface PollStart {
  current_question_index: number;
  total_questions: number;
  question: PollQuestion;
}
interface PollAnswer {
  is_completed: boolean;
  next_question: PollQuestion | null;
  current_question_index: number | null;
  total_questions: number;
  reward_granted: number | null;
  message: string | null;
}
interface ContestInfo {
  id: number;
  name: string;
  description: string | null;
  prize_days: number;
  already_played: boolean;
}
interface ContestGame {
  round_id: number;
  game_type: string;
  game_data: Record<string, unknown>;
  instructions: string;
}
interface ContestResult {
  is_winner: boolean;
  message: string;
  prize_days?: number;
}
interface WheelPrize {
  id: number;
  display_name: string;
  emoji: string;
  color: string;
  prize_type: string;
}
interface WheelConfig {
  is_enabled: boolean;
  name: string;
  spin_cost_stars: number | null;
  spin_cost_days: number | null;
  prizes: WheelPrize[];
  daily_limit: number;
  user_spins_today: number;
  can_spin: boolean;
  can_spin_reason: string | null;
  can_pay_stars: boolean;
  can_pay_days: boolean;
  has_subscription: boolean;
}
interface SpinResult {
  success: boolean;
  prize_display_name: string;
  emoji: string;
  color: string;
  message: string;
  error: string | null;
}

function loadPolls() {
  return requestJson<PollInfo[]>('/cabinet/polls');
}
function startPoll(responseId: number) {
  return postJson<PollStart>(`/cabinet/polls/${responseId}/start`, {});
}
function answerPoll(responseId: number, questionId: number, optionId: number) {
  return postJson<PollAnswer>(`/cabinet/polls/${responseId}/questions/${questionId}/answer`, {
    option_id: optionId,
  });
}
function loadContests() {
  return requestJson<ContestInfo[]>('/cabinet/contests');
}
function loadContestGame(roundId: number) {
  return requestJson<ContestGame>(`/cabinet/contests/${roundId}`);
}
function answerContest(roundId: number, answer: string) {
  return postJson<ContestResult>(`/cabinet/contests/${roundId}/answer`, {
    round_id: roundId,
    answer,
  });
}
function loadWheel() {
  return requestJson<WheelConfig>('/cabinet/wheel/config');
}
function spinWheel(paymentType: 'telegram_stars' | 'subscription_days') {
  return postJson<SpinResult>('/cabinet/wheel/spin', { payment_type: paymentType });
}

export default function ActivitiesPage({ mode: requestedMode }: { mode?: ActivityMode }) {
  const location = useLocation();
  const mode =
    requestedMode ||
    (location.pathname.match(/\/(polls|contests|wheel)/)?.[1] as ActivityMode | undefined) ||
    'polls';
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [polls, setPolls] = useState<PollInfo[]>([]);
  const [contests, setContests] = useState<ContestInfo[]>([]);
  const [wheel, setWheel] = useState<WheelConfig | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError('');
    const load =
      mode === 'polls' ? loadPolls() : mode === 'contests' ? loadContests() : loadWheel();
    load
      .then((value) => {
        if (cancelled) return;
        if (mode === 'polls') setPolls(value as PollInfo[]);
        if (mode === 'contests') setContests(value as ContestInfo[]);
        if (mode === 'wheel') setWheel(value as WheelConfig);
        setStatus('ready');
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'Не удалось загрузить раздел');
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  return (
    <div className="flex flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
      <PageHeader
        title={mode === 'polls' ? 'Опросы' : mode === 'contests' ? 'Конкурсы' : 'Колесо призов'}
        subtitle="Активности и бонусы InvoxyVPN"
        mobileNotifications
      />
      <div className="flex gap-2 overflow-x-auto">
        <ActivityTab
          active={mode === 'polls'}
          href="/polls"
          label="Опросы"
          icon={<CirclePlus size={15} />}
        />
        <ActivityTab
          active={mode === 'contests'}
          href="/contests"
          label="Конкурсы"
          icon={<CheckCircle2 size={15} />}
        />
        <ActivityTab
          active={mode === 'wheel'}
          href="/wheel"
          label="Колесо"
          icon={<Sparkles size={15} />}
        />
      </div>
      {status === 'loading' && (
        <div className="glass-panel h-56 animate-pulse rounded-[30px]" aria-label="Загрузка" />
      )}
      {status === 'error' && (
        <StateCard title="Раздел временно недоступен" text={error || 'Попробуйте позже.'} />
      )}
      {status === 'ready' && mode === 'polls' && <PollsView polls={polls} />}
      {status === 'ready' && mode === 'contests' && (
        <ContestsView contests={contests} setContests={setContests} />
      )}
      {status === 'ready' && mode === 'wheel' && <WheelView config={wheel} />}
    </div>
  );
}

function ActivityTab({
  active,
  href,
  label,
  icon,
}: {
  active: boolean;
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold ${active ? 'bg-mint text-bg' : 'glass-control text-muted hover:text-ink'}`}
    >
      {icon}
      {label}
    </a>
  );
}

function PollsView({ polls }: { polls: PollInfo[] }) {
  const [selected, setSelected] = useState<PollInfo | null>(null);
  const [question, setQuestion] = useState<PollQuestion | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function begin(poll: PollInfo) {
    setSelected(poll);
    setMessage('');
    setBusy(true);
    try {
      const result = await startPoll(poll.response_id);
      setQuestion(result.question);
      setProgress({ current: result.current_question_index, total: result.total_questions });
    } catch {
      setMessage('Не удалось открыть опрос.');
    } finally {
      setBusy(false);
    }
  }

  async function answer(optionId: number) {
    if (!selected || !question) return;
    setBusy(true);
    try {
      const result = await answerPoll(selected.response_id, question.id, optionId);
      if (result.is_completed) {
        setQuestion(null);
        setMessage(
          result.message ||
            `Опрос завершён${result.reward_granted ? ` · +${result.reward_granted}` : ''}.`,
        );
      } else if (result.next_question) {
        setQuestion(result.next_question);
        setProgress({
          current: result.current_question_index ?? progress.current + 1,
          total: result.total_questions,
        });
      }
    } catch {
      setMessage('Ответ не отправлен. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {selected && (
        <div className="glass-panel rounded-[30px] border-mint/25 p-5 lg:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold tracking-[.15em] text-mint">ОПРОС</p>
              <h2 className="mt-2 text-xl font-medium">{selected.title}</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setQuestion(null);
                setMessage('');
              }}
              aria-label="Закрыть"
              className="glass-control grid h-10 w-10 place-items-center rounded-full"
            >
              <X size={16} />
            </button>
          </div>
          {busy && !question && (
            <p className="mt-8 text-center text-sm text-muted">Загрузка вопроса…</p>
          )}
          {question && (
            <div className="mt-6">
              <div className="flex justify-between text-xs text-muted">
                <span>
                  Вопрос {progress.current + 1} из {progress.total}
                </span>
                <span>
                  {Math.round(((progress.current + 1) / Math.max(progress.total, 1)) * 100)}%
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-mint"
                  style={{
                    width: `${((progress.current + 1) / Math.max(progress.total, 1)) * 100}%`,
                  }}
                />
              </div>
              <p className="mt-6 text-lg font-medium">{question.text}</p>
              <div className="mt-4 grid gap-2">
                {question.options.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    disabled={busy}
                    onClick={() => answer(option.id)}
                    className="glass-control rounded-2xl px-4 py-4 text-left text-sm transition-colors hover:border-mint/40 disabled:opacity-50"
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>
          )}
          {message && (
            <p className="mt-5 rounded-2xl bg-mint/10 p-4 text-sm text-mint">{message}</p>
          )}
        </div>
      )}
      {polls.length === 0 && !selected && (
        <StateCard title="Опросов пока нет" text="Новые опросы появятся здесь." />
      )}
      {polls.length > 0 && !selected && (
        <div className="grid gap-4 md:grid-cols-2">
          {polls.map((poll) => (
            <article key={poll.id} className="glass-panel motion-card rounded-[30px] p-5 lg:p-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-medium">{poll.title}</h2>
                  {poll.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted">{poll.description}</p>
                  )}
                </div>
                {poll.reward_amount != null && (
                  <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-mint">
                    <Sparkles size={14} />+{poll.reward_amount}
                  </span>
                )}
              </div>
              <p className="mt-4 text-xs text-muted">
                {poll.answered_questions} из {poll.total_questions} вопросов
              </p>
              <button
                type="button"
                disabled={poll.is_completed}
                onClick={() => begin(poll)}
                className={`button-lift mt-5 h-12 w-full rounded-full text-sm font-bold ${poll.is_completed ? 'glass-control cursor-not-allowed text-muted' : 'bg-ink text-bg'}`}
              >
                {poll.is_completed ? (
                  <>
                    <Check size={15} /> Завершён
                  </>
                ) : poll.answered_questions ? (
                  'Продолжить'
                ) : (
                  'Начать'
                )}
              </button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function ContestsView({
  contests,
  setContests,
}: {
  contests: ContestInfo[];
  setContests: (value: ContestInfo[]) => void;
}) {
  const [selected, setSelected] = useState<ContestInfo | null>(null);
  const [game, setGame] = useState<ContestGame | null>(null);
  const [result, setResult] = useState<ContestResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function begin(contest: ContestInfo) {
    setSelected(contest);
    setResult(null);
    setBusy(true);
    try {
      setGame(await loadContestGame(contest.id));
    } catch {
      setResult({ is_winner: false, message: 'Не удалось открыть конкурс.' });
    } finally {
      setBusy(false);
    }
  }
  async function answer(value: string) {
    if (!game) return;
    setBusy(true);
    try {
      const next = await answerContest(game.round_id, value);
      setResult(next);
      setContests(
        contests.map((contest) =>
          contest.id === selected?.id ? { ...contest, already_played: true } : contest,
        ),
      );
    } catch {
      setResult({ is_winner: false, message: 'Ответ не отправлен. Попробуйте ещё раз.' });
    } finally {
      setBusy(false);
    }
  }
  const data = game?.game_data ?? {};
  const flags = Array.isArray(data.flags)
    ? data.flags.filter((flag): flag is string => typeof flag === 'string')
    : [];
  const cells = Number(data.total ?? data.grid_size ?? 9);

  return (
    <>
      {selected && (
        <div className="glass-panel rounded-[30px] border-mint/25 p-5 lg:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold tracking-[.15em] text-mint">КОНКУРС</p>
              <h2 className="mt-2 text-xl font-medium">{selected.name}</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setGame(null);
                setResult(null);
              }}
              aria-label="Закрыть"
              className="glass-control grid h-10 w-10 place-items-center rounded-full"
            >
              <X size={16} />
            </button>
          </div>
          {busy && !game && (
            <p className="mt-8 text-center text-sm text-muted">Загрузка задания…</p>
          )}
          {game && !result && (
            <div className="mt-6 space-y-4">
              <p className="text-sm leading-relaxed text-muted">{game.instructions}</p>
              {['quest', 'locks'].includes(game.game_type) && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {Array.from({ length: Math.max(1, Math.min(cells, 25)) }).map((_, index) => (
                    <button
                      type="button"
                      key={index}
                      disabled={busy}
                      onClick={() => answer(`${index}_${String(data.secret ?? '')}`)}
                      className="grid aspect-square place-items-center rounded-2xl bg-white/6 text-xl transition-colors hover:bg-mint/15 disabled:opacity-50"
                    >
                      {game.game_type === 'locks' ? '🔒' : '◈'}
                    </button>
                  ))}
                </div>
              )}
              {game.game_type === 'server' && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {flags.map((flag) => (
                    <button
                      type="button"
                      key={flag}
                      disabled={busy}
                      onClick={() => answer(flag)}
                      className="rounded-2xl bg-white/6 p-4 text-2xl hover:bg-mint/15"
                    >
                      {flag}
                    </button>
                  ))}
                </div>
              )}
              {game.game_type === 'blitz' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => answer('blitz')}
                  className="h-12 w-full rounded-full bg-mint text-sm font-bold text-bg"
                >
                  {String(data.button_text ?? 'Я здесь')}
                </button>
              )}
              {['cipher', 'emoji', 'anagram'].includes(game.game_type) && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const input = new FormData(event.currentTarget).get('answer');
                    if (typeof input === 'string') void answer(input);
                  }}
                  className="space-y-3"
                >
                  <div className="rounded-2xl bg-white/6 p-5 text-center font-mono text-2xl">
                    {String(data.question ?? data.letters ?? '')}
                  </div>
                  <input
                    name="answer"
                    required
                    className="glass-control h-12 w-full rounded-2xl px-4 outline-none"
                    placeholder="Ваш ответ"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="h-12 w-full rounded-full bg-ink text-sm font-bold text-bg"
                  >
                    Отправить
                  </button>
                </form>
              )}
            </div>
          )}
          {result && (
            <div
              className={`mt-6 rounded-2xl p-4 text-sm ${result.is_winner ? 'bg-mint/10 text-mint' : 'bg-red-300/10 text-red-200'}`}
            >
              {result.message}
            </div>
          )}
        </div>
      )}
      {!selected && contests.length === 0 && (
        <StateCard title="Конкурсов пока нет" text="Новые конкурсы появятся здесь." />
      )}
      {!selected && contests.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {contests.map((contest) => (
            <article key={contest.id} className="glass-panel motion-card rounded-[30px] p-5 lg:p-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-medium">{contest.name}</h2>
                  {contest.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted">{contest.description}</p>
                  )}
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-mint">
                  <Sparkles size={14} />+{contest.prize_days} дн.
                </span>
              </div>
              <button
                type="button"
                disabled={contest.already_played}
                onClick={() => begin(contest)}
                className={`button-lift mt-5 h-12 w-full rounded-full text-sm font-bold ${contest.already_played ? 'glass-control cursor-not-allowed text-muted' : 'bg-ink text-bg'}`}
              >
                {contest.already_played ? 'Уже сыграно' : 'Играть'}
              </button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function WheelView({ config }: { config: WheelConfig | null }) {
  const [payment, setPayment] = useState<'telegram_stars' | 'subscription_days'>('telegram_stars');
  const [result, setResult] = useState<SpinResult | null>(null);
  const [busy, setBusy] = useState(false);
  const colors = useMemo(
    () => (config?.prizes ?? []).map((prize) => safeColor(prize.color)),
    [config],
  );
  if (!config || !config.is_enabled)
    return <StateCard title="Колесо сейчас недоступно" text="Попробуйте заглянуть позже." />;
  async function spin() {
    setBusy(true);
    setResult(null);
    try {
      setResult(await spinWheel(payment));
    } catch {
      setResult({
        success: false,
        prize_display_name: '',
        emoji: '',
        color: '',
        message: 'Не удалось запустить колесо.',
        error: 'request_failed',
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="glass-panel motion-card rounded-[32px] p-5 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
        <div>
          <div
            className="mx-auto grid aspect-square max-w-[280px] place-items-center rounded-full border-8 border-mint/20 p-3"
            style={{
              background: colors.length
                ? `conic-gradient(${colors.map((color, index) => `${color} ${(index / colors.length) * 100}% ${((index + 1) / colors.length) * 100}%`).join(', ')})`
                : undefined,
            }}
          >
            <div className="grid h-full w-full place-items-center rounded-full bg-bg text-center shadow-[0_0_60px_rgba(165,232,196,.16)]">
              <Sparkles size={29} className="text-mint" />
              <span className="mt-2 text-xs text-muted">{config.name}</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-[.16em] text-mint">ЕЖЕДНЕВНЫЙ БОНУС</p>
          <h2 className="mt-3 text-2xl font-medium">Испытайте удачу</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Осталось вращений сегодня: {Math.max(0, config.daily_limit - config.user_spins_today)}
          </p>
          <div className="mt-6 grid gap-2">
            {config.can_pay_stars && (
              <button
                type="button"
                aria-pressed={payment === 'telegram_stars'}
                onClick={() => setPayment('telegram_stars')}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm ${payment === 'telegram_stars' ? 'bg-mint/12 ring-1 ring-mint/35' : 'glass-control'}`}
              >
                <span>Telegram Stars</span>
                <strong>{config.spin_cost_stars ?? '—'}</strong>
              </button>
            )}
            {config.can_pay_days && (
              <button
                type="button"
                aria-pressed={payment === 'subscription_days'}
                onClick={() => setPayment('subscription_days')}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm ${payment === 'subscription_days' ? 'bg-mint/12 ring-1 ring-mint/35' : 'glass-control'}`}
              >
                <span>Дни подписки</span>
                <strong>{config.spin_cost_days ?? '—'}</strong>
              </button>
            )}
          </div>
          <button
            type="button"
            disabled={!config.can_spin || busy}
            onClick={() => void spin()}
            className="button-lift mt-5 h-13 w-full rounded-full bg-mint text-sm font-bold text-bg disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy
              ? 'Вращаем…'
              : config.can_spin
                ? 'Крутить колесо'
                : config.can_spin_reason || 'Недоступно'}
          </button>
          {result && (
            <div
              className={`mt-4 rounded-2xl p-4 text-sm ${result.success ? 'bg-mint/10 text-mint' : 'bg-red-300/10 text-red-200'}`}
            >
              {result.success && <span className="mr-2 text-xl">{result.emoji}</span>}
              {result.message || result.prize_display_name || result.error}
            </div>
          )}
        </div>
      </div>
      <div className="mt-7 border-t border-white/8 pt-5">
        <h3 className="text-sm font-medium">Призы</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {config.prizes.map((prize) => (
            <div key={prize.id} className="rounded-2xl bg-white/[.04] p-3 text-sm">
              <span className="mr-2">{prize.emoji}</span>
              {prize.display_name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function safeColor(value: string | null | undefined): string {
  return value && /^#[\da-f]{3,8}$/i.test(value) ? value : '#a5e8c4';
}

function StateCard({ title, text }: { title: string; text: string }) {
  return (
    <section className="glass-panel rounded-[30px] px-6 py-12 text-center">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mt-2 text-sm text-muted">{text}</p>
    </section>
  );
}
