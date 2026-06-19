export interface ReadinessInput {
  resumeCount: number;
  resumeBlockCount: number;
  resumeScore?: number | null;
  jobCount: number;
  appliedCount: number;
  interviewCount: number;
  questionsPracticed: number;
}

export interface ReadinessResult {
  score: number;
  label: string;
  sufficient: boolean;
  breakdown: {
    resume: number;
    jobs: number;
    interview: number;
  };
}

const LABELS: { min: number; label: string }[] = [
  { min: 90, label: "Outstanding" },
  { min: 75, label: "Excellent" },
  { min: 60, label: "Good" },
  { min: 40, label: "Developing" },
  { min: 0, label: "Getting Started" },
];

export function hasSufficientReadinessData(input: ReadinessInput): boolean {
  return (
    input.resumeCount > 0 ||
    input.jobCount > 0 ||
    input.questionsPracticed > 0 ||
    input.interviewCount > 0
  );
}

export function calculateCareerReadiness(input: ReadinessInput): ReadinessResult | null {
  if (!hasSufficientReadinessData(input)) return null;

  const resumeComponent =
    input.resumeScore != null
      ? Math.min(100, input.resumeScore)
      : Math.min(100, input.resumeBlockCount * 12 + (input.resumeCount > 0 ? 20 : 0));

  const jobsComponent = Math.min(
    100,
    input.jobCount * 15 + input.appliedCount * 10 + (input.appliedCount > 0 ? 10 : 0)
  );

  const interviewComponent = Math.min(
    100,
    input.questionsPracticed * 3 + input.interviewCount * 5
  );

  const score = Math.round(
    resumeComponent * 0.4 + jobsComponent * 0.35 + interviewComponent * 0.25
  );

  const label = LABELS.find((l) => score >= l.min)?.label ?? "Getting Started";

  return {
    score,
    label,
    sufficient: true,
    breakdown: {
      resume: Math.round(resumeComponent),
      jobs: Math.round(jobsComponent),
      interview: Math.round(interviewComponent),
    },
  };
}
