"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Brain,
  RotateCcw,
  Clock,
  Target,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoading, ButtonLoading } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/EmptyState";
import {
  loadInterviewStats,
  recordPracticeSession,
  updatePreferences,
  type InterviewPersistedStats,
} from "@/lib/interview-persistence";
import { PAGE_CONTAINER_CLASS, SECTION_HEADER_CLASS, SECTION_SUBTITLE_CLASS } from "@/lib/modal-styles";

type Category = "technical" | "behavioral" | "hr" | "mixed";
type Difficulty = "easy" | "medium" | "hard";

interface InterviewSet {
  technical: string[];
  behavioral: string[];
  hr: string[];
  systemDesign: string[];
  meta?: {
    role: string;
    category: Category;
    difficulty: Difficulty;
    totalCount: number;
  };
}

interface Job {
  _id: string;
  title?: string;
  company?: string;
  description?: string;
}

interface QuestionItem {
  text: string;
  category: string;
}

interface AnswerRecord {
  text: string;
  rating: number;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function flattenQuestions(data: InterviewSet, category: Category): QuestionItem[] {
  const pick = (cat: keyof InterviewSet, label: string) =>
    (Array.isArray(data[cat]) ? (data[cat] as string[]) : []).map((text) => ({
      text,
      category: label,
    }));

  if (category === "technical") return pick("technical", "Technical");
  if (category === "behavioral") return pick("behavioral", "Behavioral");
  if (category === "hr") return pick("hr", "HR");
  return [
    ...pick("technical", "Technical"),
    ...pick("behavioral", "Behavioral"),
    ...pick("hr", "HR"),
    ...pick("systemDesign", "System Design"),
  ];
}

export default function InterviewPrepPage() {
  const { status } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [category, setCategory] = useState<Category>("mixed");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});
  const [rating, setRating] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [persistedStats, setPersistedStats] = useState<InterviewPersistedStats>(() => loadInterviewStats());

  useEffect(() => {
    const stats = loadInterviewStats();
    setCategory(stats.lastCategory);
    setDifficulty(stats.lastDifficulty);
    setPersistedStats(stats);
  }, []);

  const selectedJob = jobs.find((j) => j._id === selectedJobId) ?? null;

  useEffect(() => {
    if (status === "authenticated") fetchJobs();
  }, [status]);

  useEffect(() => {
    updatePreferences(category, difficulty);
  }, [category, difficulty]);

  const finishSession = useCallback(() => {
    const ratings = Object.values(answers).map((a) => a.rating).filter((r) => r > 0);
    const answered = Object.keys(answers).length;
    if (answered > 0) {
      const updated = recordPracticeSession({
        questionsAnswered: answered,
        ratings,
        category,
        difficulty,
      });
      setPersistedStats(updated);
    }
  }, [answers, category, difficulty]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data.data || []);
    } catch (e) {
      console.error("Failed to fetch jobs:", e);
    }
  };

  const generateQuestions = async () => {
    const jobDescription = selectedJob?.description?.trim() || "";
    const roleTitle = selectedJob?.title?.trim() || "Candidate";

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interview/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          roleTitle,
          category,
          difficulty,
          countPerCategory: 5,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate questions");
        return;
      }

      const flat = flattenQuestions(data, category);
      if (!flat.length) {
        setError("No questions returned. Try a different category or difficulty.");
        return;
      }

      setQuestions(flat);
      setCurrentIndex(0);
      setAnswers({});
      setUserAnswer("");
      setRating(0);
      setTimerSeconds(0);
      setTimerRunning(true);
    } catch (e) {
      console.error(e);
      setError("An error occurred while generating questions.");
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (index: number) => {
    setAnswers((prev) => {
      const updated =
        userAnswer.trim()
          ? { ...prev, [currentIndex]: { text: userAnswer.trim(), rating: rating || 3 } }
          : prev;
      const saved = updated[index];
      setUserAnswer(saved?.text || "");
      setRating(saved?.rating || 0);
      setCurrentIndex(index);
      return updated;
    });
  };

  const saveAnswer = useCallback(() => {
    if (!userAnswer.trim()) return;
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: { text: userAnswer.trim(), rating: rating || 3 },
    }));
  }, [userAnswer, rating, currentIndex]);

  const resetSession = () => {
    finishSession();
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setUserAnswer("");
    setRating(0);
    setTimerSeconds(0);
    setTimerRunning(false);
    setError(null);
  };

  const stats = useMemo(() => {
    const answered = Object.keys(answers).length;
    const ratings = Object.values(answers).map((a) => a.rating).filter(Boolean);
    const avgScore =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 20)
        : 0;
    return {
      total: questions.length,
      answered,
      avgScore,
    };
  }, [answers, questions.length]);

  const currentQuestion = questions[currentIndex];

  if (status === "loading") {
    return <PageLoading text="Loading Smart Interview Prep..." />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please sign in to access Smart Interview Prep.</p>
      </div>
    );
  }

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#6C63FF] mb-1">
            CareerPilot AI
          </p>
          <h1 className={SECTION_HEADER_CLASS}>Smart Interview Prep</h1>
          <p className={SECTION_SUBTITLE_CLASS}>
            Practice role-specific interview questions generated from curated industry question banks.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,350px)_1fr] gap-8">
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5" />
                  Session Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Target job (optional context)</Label>
                  <Select value={selectedJobId || undefined} onValueChange={setSelectedJobId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a saved job..." />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem key={job._id} value={job._id}>
                          {job.title || "Untitled"} {job.company ? `@ ${job.company}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button
                  onClick={generateQuestions}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white"
                >
                  {loading ? (
                    <>
                      <ButtonLoading />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate Questions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {questions.length > 0 ? "Session Stats" : "Your Progress"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.length > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="h-4 w-4" /> Session duration
                      </span>
                      <span className="font-mono font-semibold">{formatTime(timerSeconds)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Questions practiced</span>
                      <span className="font-semibold">{stats.answered} / {stats.total}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Average rating</span>
                      <span className="font-semibold text-[#6C63FF]">{stats.avgScore}%</span>
                    </div>
                  </>
                )}
                <div className="border-t pt-3 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total practiced</span>
                    <span className="font-semibold">{persistedStats.totalQuestionsPracticed}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Average self-rating</span>
                    <span className="font-semibold">{persistedStats.averageSelfRating || "—"}/5</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Current streak</span>
                    <span className="font-semibold">{persistedStats.practiceStreak} days</span>
                  </div>
                </div>
                {questions.length > 0 && (
                  <Button onClick={resetSession} variant="outline" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Session
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0">
            {questions.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Brain}
                  title="Ready to Practice"
                  description="Choose your settings and generate a question set."
                  helper="Optionally link a saved job for role-specific context."
                />
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Question {currentIndex + 1}
                      </CardTitle>
                      <span className="px-2.5 py-1 bg-[#6C63FF]/10 text-[#6C63FF] rounded-full text-xs font-medium">
                        {currentQuestion?.category}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800 text-lg leading-relaxed p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-4">
                      {currentQuestion?.text}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => navigateTo(currentIndex - 1)}
                        disabled={currentIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          if (currentIndex < questions.length - 1) {
                            navigateTo(currentIndex + 1);
                          } else {
                            saveAnswer();
                            finishSession();
                          }
                        }}
                      >
                        {currentIndex >= questions.length - 1 ? "Finish" : "Next"}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Your Answer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Write your practice answer using STAR (Situation, Task, Action, Result) when applicable..."
                      rows={6}
                      className="resize-none"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500 mr-2">Self-rating:</span>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                            aria-label={`Rate ${n} stars`}
                          >
                            <Star
                              className={`h-5 w-5 ${
                                n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <Button variant="outline" onClick={saveAnswer}>
                        Save Answer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
