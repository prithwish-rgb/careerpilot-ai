const STORAGE_KEY = "careerpilot_interview_stats";

export interface InterviewPersistedStats {
  practiceStreak: number;
  totalQuestionsPracticed: number;
  averageSelfRating: number;
  lastCategory: "technical" | "behavioral" | "hr" | "mixed";
  lastDifficulty: "easy" | "medium" | "hard";
  lastPracticeDate: string | null;
  sessionsCompleted: number;
}

const DEFAULT: InterviewPersistedStats = {
  practiceStreak: 0,
  totalQuestionsPracticed: 0,
  averageSelfRating: 0,
  lastCategory: "mixed",
  lastDifficulty: "medium",
  lastPracticeDate: null,
  sessionsCompleted: 0,
};

export function loadInterviewStats(): InterviewPersistedStats {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

export function saveInterviewStats(stats: InterviewPersistedStats): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    /* quota or private mode */
  }
}

export function recordPracticeSession(opts: {
  questionsAnswered: number;
  ratings: number[];
  category: InterviewPersistedStats["lastCategory"];
  difficulty: InterviewPersistedStats["lastDifficulty"];
}): InterviewPersistedStats {
  const prev = loadInterviewStats();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let streak = prev.practiceStreak;
  if (prev.lastPracticeDate === today) {
    /* same day — keep streak */
  } else if (prev.lastPracticeDate === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }

  const newRatings = opts.ratings.filter((r) => r > 0);
  const totalRated = prev.totalQuestionsPracticed + opts.questionsAnswered;
  const prevTotal = prev.averageSelfRating * prev.totalQuestionsPracticed;
  const newAvg =
    newRatings.length > 0
      ? (prevTotal + newRatings.reduce((a, b) => a + b, 0)) /
        Math.max(1, prev.totalQuestionsPracticed + newRatings.length)
      : prev.averageSelfRating;

  const next: InterviewPersistedStats = {
    practiceStreak: streak,
    totalQuestionsPracticed: totalRated,
    averageSelfRating: Math.round(newAvg * 10) / 10,
    lastCategory: opts.category,
    lastDifficulty: opts.difficulty,
    lastPracticeDate: today,
    sessionsCompleted: prev.sessionsCompleted + 1,
  };

  saveInterviewStats(next);
  return next;
}

export function updatePreferences(
  category: InterviewPersistedStats["lastCategory"],
  difficulty: InterviewPersistedStats["lastDifficulty"]
): void {
  const prev = loadInterviewStats();
  saveInterviewStats({ ...prev, lastCategory: category, lastDifficulty: difficulty });
}
