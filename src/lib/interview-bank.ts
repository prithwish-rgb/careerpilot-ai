/**
 * Curated interview question banks — zero API cost, rule-based generation.
 */

export type InterviewCategory = "technical" | "behavioral" | "hr" | "mixed";
export type Difficulty = "easy" | "medium" | "hard";

export interface GeneratedInterviewSet {
  technical: string[];
  behavioral: string[];
  hr: string[];
  systemDesign: string[];
  source: "bank";
  meta: {
    role: string;
    category: InterviewCategory;
    difficulty: Difficulty;
    totalCount: number;
  };
}

const TECH = {
  easy: [
    "Explain the difference between let, const, and var in JavaScript.",
    "What is the purpose of version control with Git?",
    "Describe what an API is and why REST is commonly used.",
    "What is the difference between SQL and NoSQL databases?",
    "Explain what responsive design means in web development.",
  ],
  medium: [
    "How would you optimize a slow React application?",
    "Explain the event loop in Node.js and why it matters.",
    "Describe how you would design a caching strategy for a read-heavy API.",
    "What trade-offs exist between monolithic and microservices architectures?",
    "How do you handle authentication and authorization in a web app?",
    "Explain database indexing and when it helps or hurts performance.",
  ],
  hard: [
    "Design a rate limiter for a public API serving millions of requests.",
    "How would you debug a memory leak in a long-running Node.js service?",
    "Explain CAP theorem and how it applies to distributed databases.",
    "Walk through designing a real-time notification system at scale.",
    "How would you migrate a monolith to microservices with zero downtime?",
  ],
};

const BEHAVIORAL = {
  easy: [
    "Tell me about yourself and your background.",
    "Why are you interested in this role?",
    "Describe a project you are proud of.",
    "What are your greatest strengths?",
    "Where do you see yourself in three years?",
  ],
  medium: [
    "Tell me about a time you had to meet a tight deadline.",
    "Describe a situation where you disagreed with a teammate. How did you resolve it?",
    "Give an example of when you took initiative beyond your job description.",
    "Tell me about a failure and what you learned from it.",
    "Describe a time you had to learn a new technology quickly.",
  ],
  hard: [
    "Tell me about a time you influenced stakeholders without direct authority.",
    "Describe your most complex cross-functional project and your role in it.",
    "Give an example of when you had to make a decision with incomplete information.",
    "Tell me about a time you recovered a project that was off track.",
  ],
};

const HR = {
  easy: [
    "Why do you want to work at our company?",
    "What type of work environment helps you perform best?",
    "What are your salary expectations for this role?",
    "Are you open to relocation or hybrid work?",
    "When would you be available to start?",
  ],
  medium: [
    "How do you handle feedback from managers?",
    "Describe your ideal team culture.",
    "What motivates you beyond compensation?",
    "How do you prioritize work when everything feels urgent?",
  ],
  hard: [
    "Why are you leaving your current role?",
    "How do you handle competing offers or counter-offers?",
    "Describe a time you navigated company politics professionally.",
  ],
};

const ROLE_PREFIXES: Record<string, string[]> = {
  engineer: [
    "As a software engineer, how would you approach",
    "For this engineering role, explain",
  ],
  frontend: [
    "For a frontend-focused role, describe how you would",
    "As a frontend engineer, walk me through",
  ],
  backend: [
    "For backend systems, explain how you would",
    "As a backend engineer, describe your approach to",
  ],
  data: [
    "In a data-focused role, how would you",
    "For analytics and data work, explain",
  ],
  product: [
    "From a product perspective, how would you",
    "As a product-minded contributor, describe",
  ],
  default: [
    "For this role, how would you",
    "In this position, describe how you would",
  ],
};

function detectRoleKey(title: string): keyof typeof ROLE_PREFIXES {
  const t = title.toLowerCase();
  if (/front|ui|react|web/.test(t)) return "frontend";
  if (/back|api|server|node/.test(t)) return "backend";
  if (/data|analyst|ml|science/.test(t)) return "data";
  if (/product|pm/.test(t)) return "product";
  if (/engineer|developer|dev|software|swe/.test(t)) return "engineer";
  return "default";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(pool: string[], count: number): string[] {
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

function roleTailor(questions: string[], roleTitle: string): string[] {
  const key = detectRoleKey(roleTitle);
  const prefixes = ROLE_PREFIXES[key];
  return questions.map((q, i) => {
    if (i % 3 === 0 && roleTitle.trim()) {
      const prefix = prefixes[i % prefixes.length];
      return `${prefix} ${q.charAt(0).toLowerCase()}${q.slice(1)}`;
    }
    return roleTitle.trim() ? `[${roleTitle}] ${q}` : q;
  });
}

function extractKeywords(jd: string): string[] {
  const known = ["React", "TypeScript", "Node", "Python", "AWS", "Docker", "SQL", "Agile", "Leadership"];
  const lower = jd.toLowerCase();
  return known.filter(k => lower.includes(k.toLowerCase()));
}

function jdSpecificQuestions(jd: string, difficulty: Difficulty, count: number): string[] {
  const kws = extractKeywords(jd);
  if (!kws.length) return [];
  const level = difficulty === "easy" ? "basic experience with" : difficulty === "hard" ? "deep expertise in" : "practical experience with";
  return pick(
    kws.map(k => `Describe your ${level} ${k} based on the job requirements.`),
    count
  );
}

export function generateFromBank(params: {
  roleTitle?: string;
  jobDescription?: string;
  category: InterviewCategory;
  difficulty: Difficulty;
  countPerCategory?: number;
}): GeneratedInterviewSet {
  const {
    roleTitle = "this role",
    jobDescription = "",
    category,
    difficulty,
    countPerCategory = 5,
  } = params;

  const n = Math.min(Math.max(countPerCategory, 3), 10);
  const jdQs = jdSpecificQuestions(jobDescription, difficulty, 2);

  let technical: string[] = [];
  let behavioral: string[] = [];
  let hr: string[] = [];
  let systemDesign: string[] = [];

  if (category === "technical" || category === "mixed") {
    technical = pick(TECH[difficulty], n);
    if (difficulty !== "easy") {
      systemDesign = pick(TECH.hard, category === "mixed" ? 2 : 3);
    }
    technical = [...technical, ...jdQs];
  }
  if (category === "behavioral" || category === "mixed") {
    behavioral = pick(BEHAVIORAL[difficulty], n);
  }
  if (category === "hr" || category === "mixed") {
    hr = pick(HR[difficulty], category === "mixed" ? Math.ceil(n / 2) : n);
  }

  if (category === "technical") {
    technical = [...pick(TECH[difficulty], n), ...jdQs];
  }

  technical = roleTailor(technical, roleTitle);
  behavioral = roleTailor(behavioral, roleTitle);
  hr = roleTailor(hr, roleTitle);

  const totalCount = technical.length + behavioral.length + hr.length + systemDesign.length;

  return {
    technical,
    behavioral,
    hr,
    systemDesign,
    source: "bank",
    meta: { role: roleTitle, category, difficulty, totalCount },
  };
}

/** Flat list for practice UI with category tags */
export function flattenQuestions(set: GeneratedInterviewSet): { question: string; category: string }[] {
  return [
    ...set.technical.map(q => ({ question: q, category: "Technical" })),
    ...set.behavioral.map(q => ({ question: q, category: "Behavioral" })),
    ...set.hr.map(q => ({ question: q, category: "HR" })),
    ...set.systemDesign.map(q => ({ question: q, category: "System Design" })),
  ];
}
