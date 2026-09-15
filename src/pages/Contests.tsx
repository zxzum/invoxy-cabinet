import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { contestsApi, type ContestInfo, type ContestGameData } from '../api/contests';
import { ClipboardIcon, GamepadIcon, TrophyIcon, WheelIcon, XIcon } from '@/components/icons';
import { PageSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function Contests() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedContest, setSelectedContest] = useState<ContestInfo | null>(null);
  const [gameData, setGameData] = useState<ContestGameData | null>(null);
  const [result, setResult] = useState<{ is_winner: boolean; message: string } | null>(null);

  const {
    data: contests,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contests'],
    queryFn: contestsApi.getContests,
  });

  const getGameMutation = useMutation({
    mutationFn: contestsApi.getContestGame,
    onSuccess: (data) => {
      setGameData(data);
      setResult(null);
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: ({ roundId, answer }: { roundId: number; answer: string }) =>
      contestsApi.submitAnswer(roundId, answer),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    },
  });

  const handlePlayContest = async (contest: ContestInfo) => {
    setSelectedContest(contest);
    getGameMutation.mutate(contest.id);
  };

  const handleSubmitAnswer = (answer: string) => {
    if (gameData) {
      submitAnswerMutation.mutate({ roundId: gameData.round_id, answer });
    }
  };

  const handleCloseGame = () => {
    setSelectedContest(null);
    setGameData(null);
    setResult(null);
  };

  if (isLoading) {
    return (
      <PageSkeleton leading={1} titleWidth="w-40">
        <Skeleton variant="card" count={3} className="h-32" />
      </PageSkeleton>
    );
  }

  if (error) {
    return (
      <div className="luna-dashboard glass-panel rounded-[30px] border-error-500/20 bg-error-500/10 p-6">
        <p className="text-error-400">{t('contests.error')}</p>
      </div>
    );
  }

  return (
    <div className="luna-dashboard flex flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
      <div className="ix-page-heading">
        <h1>{t('contests.title')}</h1>
        <p>{t('contests.subtitle', 'Активности и бонусы InvoxyVPN')}</p>
      </div>

      <nav aria-label="Активности" className="flex gap-2 overflow-x-auto">
        <Link
          to="/polls"
          className="glass-control inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-dark-400 transition-colors hover:text-dark-50"
        >
          <ClipboardIcon className="h-4 w-4" />
          {t('polls.title')}
        </Link>
        <Link
          to="/contests"
          aria-current="page"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent-500 px-4 py-2.5 text-xs font-semibold text-on-accent"
        >
          <GamepadIcon className="h-4 w-4" />
          {t('contests.title')}
        </Link>
        <Link
          to="/wheel"
          className="glass-control inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-dark-400 transition-colors hover:text-dark-50"
        >
          <WheelIcon className="h-4 w-4" />
          {t('wheel.title')}
        </Link>
      </nav>

      {/* Game Modal */}
      {selectedContest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-dark-950/70 p-4 backdrop-blur-sm">
          <div
            className="glass-panel motion-card max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-[30px] p-5 lg:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedContest.name}</h2>
              <button onClick={handleCloseGame} className="text-dark-400 hover:text-dark-200">
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            {getGameMutation.isPending && (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
              </div>
            )}

            {result && (
              <div
                className={`mb-4 rounded-2xl p-4 ${result.is_winner ? 'bg-accent-500/10 text-accent-400' : 'bg-error-500/10 text-error-400'}`}
              >
                <p className="font-medium">{result.message}</p>
              </div>
            )}

            {gameData && !result && (
              <div className="space-y-4">
                <p className="text-dark-300">{gameData.instructions}</p>

                {/* Render game based on type */}
                {(gameData.game_type === 'quest' || gameData.game_type === 'locks') && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {Array.from({
                      length: gameData.game_data.total || gameData.game_data.grid_size || 9,
                    }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handleSubmitAnswer(`${i}_${gameData.game_data.secret}`)}
                        disabled={submitAnswerMutation.isPending}
                        className="glass-control flex aspect-square items-center justify-center rounded-2xl text-2xl transition-colors hover:border-accent-400/40"
                      >
                        {gameData.game_type === 'locks' ? '🔒' : '🎛'}
                      </button>
                    ))}
                  </div>
                )}

                {gameData.game_type === 'server' && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {gameData.game_data.flags?.map((flag: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleSubmitAnswer(flag)}
                        disabled={submitAnswerMutation.isPending}
                        className="glass-control rounded-2xl p-3 text-2xl transition-colors hover:border-accent-400/40"
                      >
                        {flag}
                      </button>
                    ))}
                  </div>
                )}

                {gameData.game_type === 'blitz' && (
                  <button
                    onClick={() => handleSubmitAnswer('blitz')}
                    disabled={submitAnswerMutation.isPending}
                    className="button-lift h-12 w-full rounded-full bg-accent-500 text-sm font-bold text-on-accent transition-colors hover:bg-accent-600"
                  >
                    {gameData.game_data.button_text || t('contests.imHere')}
                  </button>
                )}

                {['cipher', 'emoji', 'anagram'].includes(gameData.game_type) && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.elements.namedItem(
                        'answer',
                      ) as HTMLInputElement;
                      handleSubmitAnswer(input.value);
                    }}
                    className="space-y-3"
                  >
                    <div className="rounded-2xl bg-white/[.04] p-5 text-center font-mono text-2xl">
                      {gameData.game_data.question || gameData.game_data.letters}
                    </div>
                    <input
                      name="answer"
                      type="text"
                      placeholder={t('contests.enterAnswer')}
                      className="glass-control h-12 w-full rounded-2xl px-4 outline-none focus:border-accent-400/45"
                    />
                    <button
                      type="submit"
                      disabled={submitAnswerMutation.isPending}
                      className="button-lift h-12 w-full rounded-full bg-accent-500 text-sm font-bold text-on-accent"
                    >
                      {t('contests.submit')}
                    </button>
                  </form>
                )}
              </div>
            )}

            {result && (
              <button
                onClick={handleCloseGame}
                className="glass-control mt-4 flex h-12 w-full items-center justify-center rounded-full text-sm font-bold text-dark-200"
              >
                {t('common.close')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Contests List */}
      {contests && contests.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {contests.map((contest) => (
            <div key={contest.id} className="glass-panel motion-card rounded-[30px] p-5 lg:p-7">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-medium">{contest.name}</h3>
                  {contest.description && (
                    <p className="mt-1 text-sm text-dark-400">{contest.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 text-accent-400">
                  <TrophyIcon />
                  <span className="text-sm font-medium">
                    +{t('contests.days', { count: contest.prize_days })}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                {contest.already_played ? (
                  <button
                    disabled
                    className="glass-control flex h-12 w-full cursor-not-allowed items-center justify-center rounded-full text-sm font-bold text-dark-400 opacity-60"
                  >
                    {t('contests.alreadyPlayed')}
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlayContest(contest)}
                    className="button-lift h-12 w-full rounded-full bg-accent-500 text-sm font-bold text-on-accent"
                  >
                    {t('contests.play')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-[30px] px-6 py-12 text-center">
          <GamepadIcon className="mx-auto h-6 w-6 text-accent-400" />
          <p className="mt-4 text-dark-400">{t('contests.noContests')}</p>
        </div>
      )}
    </div>
  );
}
