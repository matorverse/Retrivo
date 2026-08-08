"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, HelpCircle, BookOpen, RefreshCw, Sparkles, ArrowRight } from "lucide-react";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  chunkIndex: number;
  filename: string;
}

interface QuizInterfaceProps {
  documentId: string;
  documentName: string;
  onClose?: () => void;
}

export function QuizInterface({ documentId, documentName, onClose }: QuizInterfaceProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await fetch(`/api/documents/${documentId}/quiz`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load quiz questions.");
        } else {
          setQuestions(data.questions || []);
        }
      } catch (err) {
        setError("Network error loading quiz.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [documentId]);

  const handleSelect = (questionId: string, optionIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  if (loading) {
    return (
      <div className="calm-card p-12 text-center text-calm-text-muted space-y-3 max-w-2xl mx-auto">
        <Sparkles className="w-6 h-6 mx-auto animate-spin text-calm-primary stroke-[1.75]" />
        <p className="text-sm font-medium text-calm-text">Generating practice quiz for {documentName}...</p>
        <p className="text-xs text-calm-text-subtle">Extracting key concepts from document chunks</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calm-card p-8 text-center text-calm-danger space-y-3 max-w-xl mx-auto">
        <HelpCircle className="w-8 h-8 mx-auto stroke-[1.75]" />
        <p className="text-sm font-medium">{error}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-calm-sm bg-calm-surface border border-calm-border text-xs text-calm-text font-medium"
          >
            Return to Dashboard
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="calm-card p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-calm-border pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-calm-primary uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5 stroke-[1.75]" /> Practice Quiz
          </div>
          <h2 className="font-heading text-xl font-bold text-calm-text">
            {documentName}
          </h2>
          <p className="text-xs text-calm-text-muted">
            {questions.length} questions derived from source document chunks
          </p>
        </div>

        {submitted && (
          <div className="px-4 py-2 rounded-calm-sm bg-calm-primary-tint border border-calm-primary/20 text-calm-primary text-center">
            <div className="text-xs text-calm-text-muted">Score</div>
            <div className="font-heading text-lg font-bold">
              {calculateScore()} / {questions.length}
            </div>
          </div>
        )}
      </div>

      {/* Questions list */}
      <div className="space-y-8">
        {questions.map((q, idx) => {
          const selected = selectedAnswers[q.id];
          const isCorrect = selected === q.correctIndex;

          return (
            <div key={q.id} className="space-y-4 p-5 rounded-calm-sm bg-calm-bg border border-calm-border">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-heading text-sm font-semibold text-calm-text leading-snug">
                  {idx + 1}. {q.question}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-calm-surface border border-calm-border text-calm-text-subtle whitespace-nowrap">
                  Chunk #{q.chunkIndex}
                </span>
              </div>

              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selected === optIdx;
                  let optionClass = "bg-calm-surface border-calm-border hover:bg-calm-surface-muted text-calm-text";

                  if (submitted) {
                    if (optIdx === q.correctIndex) {
                      optionClass = "bg-calm-success-tint border-calm-success/30 text-calm-success font-medium";
                    } else if (isSelected && !isCorrect) {
                      optionClass = "bg-calm-danger-tint border-calm-danger/30 text-calm-danger";
                    }
                  } else if (isSelected) {
                    optionClass = "bg-calm-primary-tint border-calm-primary text-calm-primary font-medium";
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelect(q.id, optIdx)}
                      className={`w-full text-left p-3 rounded-calm-sm border text-xs transition-colors flex items-center justify-between ${optionClass}`}
                    >
                      <span>{opt}</span>
                      {submitted && optIdx === q.correctIndex && (
                        <CheckCircle2 className="w-4 h-4 text-calm-success shrink-0 stroke-[1.75]" />
                      )}
                      {submitted && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-calm-danger shrink-0 stroke-[1.75]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="p-3 rounded-calm-sm bg-calm-surface border border-calm-border text-xs text-calm-text-muted space-y-1">
                  <p className="font-medium text-calm-text">Explanation & Citation:</p>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-between pt-4 border-t border-calm-border">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-calm-sm text-xs font-medium text-calm-text-muted hover:text-calm-text"
          >
            Close Quiz
          </button>
        )}

        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={Object.keys(selectedAnswers).length < questions.length}
            className="ml-auto px-6 py-2.5 rounded-calm-sm bg-calm-primary hover:bg-calm-primary-hover text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>Submit Quiz</span>
            <ArrowRight className="w-4 h-4 stroke-[1.75]" />
          </button>
        ) : (
          <button
            onClick={() => {
              setSubmitted(false);
              setSelectedAnswers({});
            }}
            className="ml-auto px-4 py-2 rounded-calm-sm bg-calm-surface border border-calm-border text-xs font-medium text-calm-text hover:bg-calm-surface-muted transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 stroke-[1.75]" />
            Retake Quiz
          </button>
        )}
      </div>
    </div>
  );
}
