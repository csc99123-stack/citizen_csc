'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { MockTest, MockTestQuestion } from '@/lib/types';

interface MockTestClientProps {
  test: MockTest;
  shopSlug: string;
}

type AnswerMap = Record<number, 'A' | 'B' | 'C' | 'D'>;
type StatusMap = Record<number, 'answered' | 'marked' | 'skipped' | 'unattempted'>;

const SUBJECTS = ['All', 'General Awareness', 'Quantitative Aptitude', 'English Language', 'General Intelligence & Reasoning'];

export function MockTestClient({ test, shopSlug }: MockTestClientProps) {
  const questions: MockTestQuestion[] = test.questions_payload?.questions ?? [];
  const totalSeconds = test.duration_minutes * 60;

  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const currentQ = questions[currentIdx];

  // ── Timer ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (confirm('Are you sure you want to submit the test?')) {
      setIsSubmitted(true);
    }
  }, []);

  useEffect(() => {
    if (isSubmitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, handleSubmit]);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const timerClass = timeLeft < 300 ? 'text-red-400' : timeLeft < 600 ? 'text-yellow-400' : 'text-green-400';

  // ── Helpers ───────────────────────────────────────────────────────────────
  function selectAnswer(option: 'A' | 'B' | 'C' | 'D') {
    setAnswers((a) => ({ ...a, [currentQ.id]: option }));
    setStatuses((s) => ({ ...s, [currentQ.id]: 'answered' }));
  }

  function markForReview() {
    setStatuses((s) => ({ ...s, [currentQ.id]: 'marked' }));
    goNext();
  }

  function clearResponse() {
    setAnswers((a) => { const n = { ...a }; delete n[currentQ.id]; return n; });
    setStatuses((s) => ({ ...s, [currentQ.id]: 'unattempted' }));
  }

  function goNext() {
    if (currentIdx < questions.length - 1) setCurrentIdx((i) => i + 1);
  }
  function goPrev() {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  }

  function getStatusColor(qId: number): string {
    const s = statuses[qId];
    if (s === 'answered') return 'bg-green-500 text-white';
    if (s === 'marked') return 'bg-purple-500 text-white';
    if (s === 'skipped') return 'bg-red-400 text-white';
    return 'bg-slate-700 text-slate-300';
  }

  // ── Scoring ───────────────────────────────────────────────────────────────
  function calcScore() {
    let correct = 0, wrong = 0, skipped = 0;
    questions.forEach((q) => {
      const ans = answers[q.id];
      if (!ans) { skipped++; return; }
      if (ans === q.correct) correct++;
      else wrong++;
    });
    const score = correct * 2 - wrong * test.negative_marking_ratio;
    return { correct, wrong, skipped, score: Math.max(0, score), maxScore: questions.length * 2 };
  }

  // ── Results Screen ────────────────────────────────────────────────────────
  if (isSubmitted) {
    const { correct, wrong, skipped, score, maxScore } = calcScore();
    const pct = Math.round((score / maxScore) * 100);

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center mb-8">
            <div className={`inline-flex w-24 h-24 rounded-full items-center justify-center text-4xl font-black mb-4 ${pct >= 70 ? 'bg-green-500/20 text-green-400' : pct >= 40 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
              {pct}%
            </div>
            <h2 className="text-3xl font-black text-white">Test Completed!</h2>
            <p className="text-slate-400 mt-2">{test.title}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Score', value: `${score.toFixed(1)}/${maxScore}`, color: 'text-blue-400' },
              { label: 'Correct', value: correct, color: 'text-green-400' },
              { label: 'Wrong', value: wrong, color: 'text-red-400' },
              { label: 'Skipped', value: skipped, color: 'text-slate-400' },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-800 rounded-2xl p-5 text-center">
                <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Answer review */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800">
              <h3 className="font-bold text-white">Answer Review</h3>
            </div>
            <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
              {questions.map((q, i) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correct;
                return (
                  <div key={q.id} className="px-6 py-4 flex items-start gap-4">
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${!userAns ? 'bg-slate-700 text-slate-400' : isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 line-clamp-2">{q.question}</p>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="text-slate-400">Your answer: <strong className={isCorrect ? 'text-green-400' : 'text-red-400'}>{userAns || '—'}</strong></span>
                        <span className="text-slate-400">Correct: <strong className="text-green-400">{q.correct}</strong></span>
                      </div>
                      {userAns && !isCorrect && <p className="mt-1 text-[11px] text-slate-500 italic">{q.explanation}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link href={`/${shopSlug}/jobs#mock-tests`} className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-colors">
            Back to Mock Tests
          </Link>
        </div>
      </div>
    );
  }

  const filteredQuestions = activeFilter === 'All' ? questions : questions.filter((q) => q.subject === activeFilter);

  // ── CBT Interface ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left: Question + Answers */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Timer + Progress Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 uppercase tracking-widest">Q {currentIdx + 1} of {questions.length}</span>
            <span className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full font-bold uppercase">{currentQ?.subject}</span>
          </div>
          <div className={`font-mono text-xl font-black ${timerClass} flex items-center gap-2`}>
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
            {mins}:{secs}
          </div>
          <div className="flex gap-2">
            <span className="text-xs text-green-400">✓ {Object.values(statuses).filter(s => s === 'answered').length}</span>
            <span className="text-xs text-purple-400">◆ {Object.values(statuses).filter(s => s === 'marked').length}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-slate-800 flex-shrink-0">
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}></div>
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto">
            <p className="text-lg font-semibold text-white leading-relaxed mb-8">{currentQ?.question}</p>

            <div className="space-y-3">
              {currentQ && Object.entries(currentQ.options).map(([opt, text]) => {
                const isSelected = answers[currentQ.id] === opt;
                return (
                  <button
                    key={opt}
                    id={`option-${opt}-btn`}
                    onClick={() => selectAnswer(opt as 'A' | 'B' | 'C' | 'D')}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-left transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-2 border-blue-500 shadow-lg shadow-blue-600/20'
                        : 'bg-slate-800 text-slate-200 border-2 border-slate-700 hover:border-blue-600/50 hover:bg-slate-700'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${isSelected ? 'bg-white text-blue-600' : 'bg-slate-700 text-slate-300'}`}>{opt}</span>
                    <span className="text-sm font-medium">{text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-slate-900 border-t border-slate-800 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex gap-3">
            <button id="prev-question-btn" onClick={goPrev} disabled={currentIdx === 0} className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-slate-700 transition-colors">
              ← Previous
            </button>
            <button id="clear-response-btn" onClick={clearResponse} className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors">
              Clear
            </button>
            <button id="mark-review-btn" onClick={markForReview} className="px-5 py-2.5 bg-purple-600/20 text-purple-400 rounded-xl font-semibold text-sm hover:bg-purple-600/30 transition-colors border border-purple-600/20">
              Mark & Next
            </button>
          </div>
          <div className="flex gap-3">
            {currentIdx === questions.length - 1 ? (
              <button id="submit-test-btn" onClick={handleSubmit} className="px-8 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20">
                Submit Test ✓
              </button>
            ) : (
              <button id="next-question-btn" onClick={goNext} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
                Save & Next →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right: Navigation Palette */}
      <div className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden flex-shrink-0">
        {/* Subject Filter */}
        <div className="p-4 border-b border-slate-800 flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Filter by Subject</p>
          <div className="flex flex-wrap gap-1.5">
            {['All', 'GA', 'QA', 'ENG', 'GI'].map((label, i) => {
              const subject = ['All', 'General Awareness', 'Quantitative Aptitude', 'English Language', 'General Intelligence & Reasoning'][i];
              return (
                <button key={label} onClick={() => setActiveFilter(subject)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${activeFilter === subject ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, i) => {
              const idx = questions.indexOf(q);
              const isHidden = activeFilter !== 'All' && q.subject !== activeFilter;
              return (
                <button
                  key={q.id}
                  onClick={() => { setCurrentIdx(idx); }}
                  className={`h-9 w-9 rounded-lg text-xs font-bold transition-all ${isHidden ? 'opacity-20' : ''} ${i === currentIdx ? 'ring-2 ring-white scale-110' : ''} ${getStatusColor(q.id)}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-slate-800 space-y-2 flex-shrink-0">
          {[
            { color: 'bg-green-500', label: 'Answered' },
            { color: 'bg-purple-500', label: 'Marked for Review' },
            { color: 'bg-slate-700', label: 'Not Attempted' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2 text-xs text-slate-400">
              <div className={`w-3.5 h-3.5 rounded ${l.color} flex-shrink-0`}></div>
              <span>{l.label}</span>
            </div>
          ))}
          <button id="submit-palette-btn" onClick={handleSubmit} className="w-full mt-3 py-3 bg-green-600 text-white font-bold rounded-xl text-sm hover:bg-green-700 transition-colors">
            Submit Test
          </button>
        </div>
      </div>
    </div>
  );
}
