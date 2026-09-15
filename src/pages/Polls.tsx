import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { pollsApi, type PollInfo, type PollQuestion } from '../api/polls';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  ClipboardIcon,
  GiftIcon,
  CheckIcon,
  CloseIcon,
  GamepadIcon,
  WheelIcon,
} from '@/components/icons';
import { PageSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function Polls() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedPoll, setSelectedPoll] = useState<PollInfo | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<PollQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [completionMessage, setCompletionMessage] = useState<{
    reward: number | null;
    message: string;
  } | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const {
    data: polls,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['polls'],
    queryFn: pollsApi.getPolls,
  });

  const startPollMutation = useMutation({
    mutationFn: pollsApi.startPoll,
    onSuccess: (data) => {
      setMutationError(null);
      setCurrentQuestion(data.question);
      setQuestionIndex(data.current_question_index);
      setTotalQuestions(data.total_questions);
      setCompletionMessage(null);
    },
    onError: () => setMutationError(t('polls.error')),
  });

  const answerMutation = useMutation({
    mutationFn: ({
      responseId,
      questionId,
      optionId,
    }: {
      responseId: number;
      questionId: number;
      optionId: number;
    }) => pollsApi.answerQuestion(responseId, questionId, optionId),
    onSuccess: (data) => {
      setMutationError(null);
      if (data.is_completed) {
        setCurrentQuestion(null);
        setCompletionMessage({
          reward: data.reward_granted,
          message: data.message || t('polls.completed'),
        });
        queryClient.invalidateQueries({ queryKey: ['polls'] });
      } else if (data.next_question) {
        setCurrentQuestion(data.next_question);
        setQuestionIndex(data.current_question_index || 0);
        setTotalQuestions(data.total_questions);
      }
    },
    onError: () => setMutationError(t('polls.error')),
  });

  const handleStartPoll = (poll: PollInfo) => {
    setSelectedPoll(poll);
    setMutationError(null);
    startPollMutation.mutate(poll.response_id);
  };

  const handleAnswer = (optionId: number) => {
    if (selectedPoll && currentQuestion) {
      setMutationError(null);
      answerMutation.mutate({
        responseId: selectedPoll.response_id,
        questionId: currentQuestion.id,
        optionId,
      });
    }
  };

  const handleClosePoll = () => {
    setSelectedPoll(null);
    setCurrentQuestion(null);
    setCompletionMessage(null);
    setMutationError(null);
  };

  const pollDialogRef = useFocusTrap<HTMLDivElement>(!!selectedPoll, {
    onEscape: handleClosePoll,
  });

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
        <p className="text-error-400">{t('polls.error')}</p>
      </div>
    );
  }

  return (
    <div className="luna-dashboard flex flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
      <div className="ix-page-heading">
        <h1>{t('polls.title')}</h1>
        <p>{t('polls.subtitle', 'Активности и бонусы InvoxyVPN')}</p>
      </div>

      <nav aria-label="Активности" className="flex gap-2 overflow-x-auto">
        <Link
          to="/polls"
          aria-current="page"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent-500 px-4 py-2.5 text-xs font-semibold text-on-accent"
        >
          <ClipboardIcon className="h-4 w-4" />
          {t('polls.title')}
        </Link>
        <Link
          to="/contests"
          className="glass-control inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-dark-400 transition-colors hover:text-dark-50"
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

      {/* Poll Modal */}
      {selectedPoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-dark-950/60"
            onClick={handleClosePoll}
            aria-hidden="true"
          />
          <div
            ref={pollDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="poll-dialog-title"
            tabIndex={-1}
            className="glass-panel motion-card relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-[30px] p-5 lg:p-7"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="poll-dialog-title" className="text-xl font-bold">
                {selectedPoll.title}
              </h2>
              <button
                onClick={handleClosePoll}
                aria-label={t('common.close')}
                className="text-dark-400 hover:text-dark-200"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>

            {mutationError && (
              <p
                role="alert"
                className="mb-4 rounded-2xl bg-error-500/10 p-4 text-sm text-error-400"
              >
                {mutationError}
              </p>
            )}

            {startPollMutation.isPending && (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
              </div>
            )}

            {completionMessage && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-accent-500/10 p-4 text-center text-accent-400">
                  <CheckIcon className="h-5 w-5" />
                  <p className="mt-2 font-medium">{completionMessage.message}</p>
                  {completionMessage.reward && (
                    <p className="mt-1 text-sm">
                      +{completionMessage.reward} {t('polls.reward')}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClosePoll}
                  className="glass-control flex h-12 w-full items-center justify-center rounded-full text-sm font-bold text-dark-200"
                >
                  {t('common.close')}
                </button>
              </div>
            )}

            {currentQuestion && !completionMessage && (
              <div className="space-y-4">
                <div className="text-sm text-dark-400">
                  {t('polls.question')} {questionIndex + 1} {t('polls.of')} {totalQuestions}
                </div>
                <div className="h-2 w-full rounded-full bg-dark-700">
                  <div
                    className="h-2 rounded-full bg-accent-500 transition-all"
                    style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>

                <p className="text-lg font-medium">{currentQuestion.text}</p>

                <div className="space-y-2">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAnswer(option.id)}
                      disabled={answerMutation.isPending}
                      className="glass-control w-full rounded-2xl p-4 text-left transition-colors hover:border-accent-400/40 disabled:opacity-50"
                    >
                      {option.text}
                    </button>
                  ))}
                </div>

                {answerMutation.isPending && (
                  <div className="flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Polls List */}
      {polls && polls.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {polls.map((poll) => (
            <div key={poll.id} className="glass-panel motion-card rounded-[30px] p-5 lg:p-7">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-lg font-medium">{poll.title}</h3>
                  {poll.description && (
                    <p className="mt-1 text-sm text-dark-400">{poll.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-sm text-dark-400">
                    <span>
                      {poll.answered_questions}/
                      {t('polls.questions', { count: poll.total_questions })}
                    </span>
                  </div>
                </div>
                {poll.reward_amount && (
                  <div className="flex shrink-0 items-center gap-1 text-accent-400">
                    <GiftIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">+{poll.reward_amount}</span>
                  </div>
                )}
              </div>

              <div className="mt-4">
                {poll.is_completed ? (
                  <button
                    disabled
                    className="glass-control flex h-12 w-full cursor-not-allowed items-center justify-center rounded-full text-sm font-bold text-dark-400 opacity-60"
                  >
                    <CheckIcon className="h-5 w-5" />
                    <span className="ml-2">{t('polls.completed')}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartPoll(poll)}
                    className="button-lift flex h-12 w-full items-center justify-center rounded-full bg-accent-500 text-sm font-bold text-on-accent"
                  >
                    {poll.answered_questions > 0 ? t('polls.continue') : t('polls.start')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-[30px] px-6 py-12 text-center">
          <ClipboardIcon className="mx-auto h-6 w-6 text-accent-400" />
          <p className="mt-4 text-dark-400">{t('polls.noPolls')}</p>
        </div>
      )}
    </div>
  );
}
