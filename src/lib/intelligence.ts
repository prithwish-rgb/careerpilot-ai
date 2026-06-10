/**
 * ResumeIQ Intelligence Engine
 * Deterministic, zero-cost resume analysis — no API keys required.
 */

import type { ResumeBlock } from "@/lib/mongodb";

// ─── Keyword Taxonomy ─────────────────────────────────────────────────────────

export const TECH_KEYWORDS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python", "Java",
  "Go", "Rust", "C++", "C#", ".NET", "Ruby", "PHP", "Swift", "Kotlin",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD",
  "GraphQL", "REST", "gRPC", "SQL", "MongoDB", "PostgreSQL", "Redis",
  "Tailwind", "CSS", "HTML", "Git", "Agile", "Scrum", "Kafka", "RabbitMQ",
  "Machine Learning", "AI", "Data Science", "TensorFlow", "PyTorch",
  "Figma", "Jira", "Linux", "Microservices", "API", "OAuth", "JWT",
];

export const ACTION_VERBS = [
  "achieved", "built", "created", "delivered", "designed", "developed",
  "drove", "engineered", "established", "executed", "generated", "grew",
  "implemented", "improved", "increased", "launched", "led", "managed",
  "optimized", "orchestrated", "pioneered", "reduced", "scaled", "shipped",
  "spearheaded", "streamlined", "transformed",
];

export const SOFT_SKILLS = [
  "leadership", "communication", "collaboration", "problem-solving",
  "teamwork", "mentoring", "presentation", "negotiation", "adaptability",
];

const REQUIRED_SECTIONS: ResumeBlock["type"][] = ["summary", "experience", "skill"];
const RECOMMENDED_SECTIONS: ResumeBlock["type"][] = ["education", "project"];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ATSScoreResult {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: {
    keywordDensity: number;
    actionVerbs: number;
    quantifiedAchievements: number;
    sectionStructure: number;
    contactInfo: number;
    lengthOptimal: number;
  };
  recommendations: string[];
}

export interface CompletenessResult {
  score: number;
  present: string[];
  missing: string[];
  recommendations: string[];
}

export interface HealthCheckResult {
  status: "excellent" | "good" | "fair" | "needs-work";
  score: number;
  issues: { severity: "critical" | "warning" | "info"; message: string }[];
  strengths: string[];
}

export interface MatchAnalysisResult {
  matchPercent: number;
  verdict: "Strong Match" | "Good Match" | "Partial Match" | "Weak Match";
  matchedKeywords: string[];
  missingKeywords: string[];
  skillGaps: string[];
  strengths: string[];
  recommendations: string[];
}

export interface ResumeAnalytics {
  ats: ATSScoreResult;
  completeness: CompletenessResult;
  health: HealthCheckResult;
  wordCount: number;
  sectionCount: number;
  keywordCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function blocksToText(blocks: ResumeBlock[]): string {
  return blocks.map(b => b.content).join("\n");
}

function findKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter(k => {
    const pattern = k.replace(/[.+]/g, "\\$&").toLowerCase();
    return new RegExp(`\\b${pattern}\\b`, "i").test(lower);
  });
}

function countQuantified(text: string): number {
  const patterns = [
    /\d+%/g,
    /\$\d+/g,
    /\d+\+/g,
    /\d+x/gi,
    /increased.*\d+/gi,
    /reduced.*\d+/gi,
    /saved.*\d+/gi,
    /\d+\s*(users|customers|clients|team members|engineers)/gi,
  ];
  let count = 0;
  for (const p of patterns) {
    const matches = text.match(p);
    if (matches) count += matches.length;
  }
  return count;
}

function countActionVerbs(text: string): number {
  const lower = text.toLowerCase();
  return ACTION_VERBS.filter(v => lower.includes(v)).length;
}

function hasContactInfo(text: string): boolean {
  return /@/.test(text) || /\(\d{3}\)/.test(text) || /linkedin\.com/i.test(text);
}

function gradeFromScore(score: number): ATSScoreResult["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function verdictFromPercent(p: number): MatchAnalysisResult["verdict"] {
  if (p >= 75) return "Strong Match";
  if (p >= 55) return "Good Match";
  if (p >= 35) return "Partial Match";
  return "Weak Match";
}

// ─── ATS Score Engine ─────────────────────────────────────────────────────────

export function calculateATSScore(blocks: ResumeBlock[]): ATSScoreResult {
  const text = blocksToText(blocks);
  const recommendations: string[] = [];

  // Keyword density (0-25)
  const foundKw = findKeywords(text, TECH_KEYWORDS);
  const keywordDensity = Math.min(25, Math.round((foundKw.length / 15) * 25));
  if (foundKw.length < 8) recommendations.push("Add more technical keywords relevant to your target roles");

  // Action verbs (0-20)
  const verbCount = countActionVerbs(text);
  const actionVerbs = Math.min(20, Math.round((verbCount / 8) * 20));
  if (verbCount < 5) recommendations.push("Start bullet points with strong action verbs (Led, Built, Optimized)");

  // Quantified achievements (0-20)
  const quantCount = countQuantified(text);
  const quantifiedAchievements = Math.min(20, Math.round((quantCount / 4) * 20));
  if (quantCount < 2) recommendations.push("Add metrics and numbers to demonstrate impact (%, $, team size)");

  // Section structure (0-15)
  const types = new Set(blocks.map(b => b.type));
  const hasRequired = REQUIRED_SECTIONS.every(s => types.has(s));
  const hasRecommended = RECOMMENDED_SECTIONS.filter(s => types.has(s)).length;
  const sectionStructure = (hasRequired ? 10 : 5) + (hasRecommended >= 1 ? 5 : 0);
  if (!hasRequired) recommendations.push("Include Summary, Experience, and Skills sections");

  // Contact info (0-10)
  const contactInfo = hasContactInfo(text) ? 10 : 0;
  if (!hasContactInfo(text)) recommendations.push("Add contact information (email, phone, or LinkedIn)");

  // Length optimal (0-10) — 300-800 words ideal
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  let lengthOptimal = 10;
  if (wordCount < 200) { lengthOptimal = 4; recommendations.push("Resume is too short — aim for 300-800 words"); }
  else if (wordCount > 1000) { lengthOptimal = 6; recommendations.push("Resume may be too long — keep it under 2 pages"); }

  const score = keywordDensity + actionVerbs + quantifiedAchievements + sectionStructure + contactInfo + lengthOptimal;

  return {
    score,
    grade: gradeFromScore(score),
    breakdown: { keywordDensity, actionVerbs, quantifiedAchievements, sectionStructure, contactInfo, lengthOptimal },
    recommendations,
  };
}

// ─── Completeness Score ───────────────────────────────────────────────────────

export function calculateCompleteness(blocks: ResumeBlock[]): CompletenessResult {
  const types = new Set(blocks.map(b => b.type));
  const sectionLabels: Record<ResumeBlock["type"], string> = {
    summary: "Professional Summary",
    experience: "Work Experience",
    skill: "Skills",
    education: "Education",
    project: "Projects",
  };

  const allSections = [...REQUIRED_SECTIONS, ...RECOMMENDED_SECTIONS] as ResumeBlock["type"][];
  const present = allSections.filter(s => types.has(s)).map(s => sectionLabels[s]);
  const missing = allSections.filter(s => !types.has(s)).map(s => sectionLabels[s]);

  const requiredPresent = REQUIRED_SECTIONS.filter(s => types.has(s)).length;
  const recommendedPresent = RECOMMENDED_SECTIONS.filter(s => types.has(s)).length;
  const score = Math.round(
    (requiredPresent / REQUIRED_SECTIONS.length) * 70 +
    (recommendedPresent / RECOMMENDED_SECTIONS.length) * 30
  );

  const recommendations: string[] = [];
  if (!types.has("summary")) recommendations.push("Add a professional summary to introduce yourself");
  if (!types.has("experience")) recommendations.push("Add work experience with bullet-point achievements");
  if (!types.has("skill")) recommendations.push("List your technical and soft skills");
  if (!types.has("education")) recommendations.push("Include your education background");
  if (!types.has("project")) recommendations.push("Showcase personal or professional projects");

  return { score, present, missing, recommendations };
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export function runHealthCheck(blocks: ResumeBlock[]): HealthCheckResult {
  const text = blocksToText(blocks);
  const issues: HealthCheckResult["issues"] = [];
  const strengths: string[] = [];

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 150) issues.push({ severity: "critical", message: "Resume is too short to be effective" });
  if (wordCount > 1200) issues.push({ severity: "warning", message: "Resume exceeds recommended length" });

  const quantCount = countQuantified(text);
  if (quantCount === 0) issues.push({ severity: "critical", message: "No quantified achievements found" });
  else if (quantCount >= 3) strengths.push(`${quantCount} quantified achievements detected`);

  const verbCount = countActionVerbs(text);
  if (verbCount < 3) issues.push({ severity: "warning", message: "Few action verbs — use Led, Built, Delivered" });
  else strengths.push(`Strong action verb usage (${verbCount} found)`);

  const foundKw = findKeywords(text, TECH_KEYWORDS);
  if (foundKw.length < 5) issues.push({ severity: "warning", message: "Low keyword density for ATS scanning" });
  else strengths.push(`${foundKw.length} ATS-relevant keywords detected`);

  const types = new Set(blocks.map(b => b.type));
  if (!types.has("summary")) issues.push({ severity: "critical", message: "Missing professional summary section" });
  if (!types.has("experience")) issues.push({ severity: "critical", message: "Missing work experience section" });

  const emptyBlocks = blocks.filter(b => !b.content.trim());
  if (emptyBlocks.length > 0) issues.push({ severity: "info", message: `${emptyBlocks.length} empty section(s) — fill or remove them` });

  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const healthScore = Math.max(0, 100 - criticalCount * 25 - warningCount * 10);

  let status: HealthCheckResult["status"] = "needs-work";
  if (healthScore >= 85) status = "excellent";
  else if (healthScore >= 70) status = "good";
  else if (healthScore >= 50) status = "fair";

  return { status, score: healthScore, issues, strengths };
}

// ─── Job Match Analysis ───────────────────────────────────────────────────────

export function analyzeJobMatch(
  blocks: ResumeBlock[],
  jobDescription: string
): MatchAnalysisResult {
  const resumeText = blocksToText(blocks);
  const jdLower = jobDescription.toLowerCase();
  const resumeLower = resumeText.toLowerCase();

  const jdKeywords = findKeywords(jobDescription, TECH_KEYWORDS);
  const jdSoftSkills = findKeywords(jobDescription, SOFT_SKILLS);
  const allJdTerms = [...new Set([...jdKeywords, ...jdSoftSkills])];

  const matchedKeywords = allJdTerms.filter(k => resumeLower.includes(k.toLowerCase()));
  const missingKeywords = allJdTerms.filter(k => !resumeLower.includes(k.toLowerCase()));

  const matchPercent = allJdTerms.length > 0
    ? Math.round((matchedKeywords.length / allJdTerms.length) * 100)
    : Math.min(100, Math.round((findKeywords(resumeText, TECH_KEYWORDS).length / 10) * 100));

  const skillGaps = missingKeywords.slice(0, 10);
  const strengths = matchedKeywords.slice(0, 8).map(k => `${k} aligns with job requirements`);

  const recommendations: string[] = [];
  if (missingKeywords.length > 0) {
    recommendations.push(`Add these JD keywords where applicable: ${missingKeywords.slice(0, 5).join(", ")}`);
  }
  if (quantCount(resumeText) < 2) {
    recommendations.push("Add measurable outcomes to strengthen your match profile");
  }
  const expBlock = blocks.find(b => b.type === "experience");
  if (!expBlock) recommendations.push("Add a work experience section to improve match relevance");

  return {
    matchPercent,
    verdict: verdictFromPercent(matchPercent),
    matchedKeywords,
    missingKeywords,
    skillGaps,
    strengths,
    recommendations,
  };
}

function quantCount(text: string): number {
  return countQuantified(text);
}

// ─── Full Resume Analytics ────────────────────────────────────────────────────

export function analyzeResume(blocks: ResumeBlock[]): ResumeAnalytics {
  const text = blocksToText(blocks);
  return {
    ats: calculateATSScore(blocks),
    completeness: calculateCompleteness(blocks),
    health: runHealthCheck(blocks),
    wordCount: text.split(/\s+/).filter(Boolean).length,
    sectionCount: blocks.length,
    keywordCount: findKeywords(text, TECH_KEYWORDS).length,
  };
}

// ─── Rule-Based Tailoring (no AI) ─────────────────────────────────────────────

export function tailorBlocksRuleBased(
  blocks: ResumeBlock[],
  jobDescription: string
): { blocks: ResumeBlock[]; matchScore: number; missingKeywords: string[]; suggestions: string[] } {
  const match = analyzeJobMatch(blocks, jobDescription);
  const jdKeywords = findKeywords(jobDescription, TECH_KEYWORDS);

  const tailored = blocks.map(block => {
    if (block.type !== "summary" && block.type !== "experience" && block.type !== "skill") {
      return { ...block };
    }

    let content = block.content;
    const missingInBlock = jdKeywords.filter(
      k => jobDescription.toLowerCase().includes(k.toLowerCase()) &&
           !content.toLowerCase().includes(k.toLowerCase())
    );

    if (missingInBlock.length > 0 && block.type === "skill") {
      const newTags = [...new Set([...(block.tags ?? []), ...missingInBlock.slice(0, 3)])];
      return { ...block, tags: newTags, content: content + (content ? ", " : "") + missingInBlock.slice(0, 3).join(", ") };
    }

    return { ...block };
  });

  return {
    blocks: tailored,
    matchScore: match.matchPercent,
    missingKeywords: match.missingKeywords.slice(0, 8),
    suggestions: match.recommendations,
  };
}

// ─── Rule-Based Bullet Suggestions ────────────────────────────────────────────

export function heuristicParseJob(text: string) {
  const t = text.replace(/\s+/g, " ").trim();
  const title = t.match(/(?:position|role|title)[:\-–]\s*([A-Z][\w\s/&]{2,60})/i)?.[1]?.trim() ?? "";
  const company = t.match(/(?:at|@|company)[:\-–\s]+([A-Z][\w&.\- ]{1,50})/i)?.[1]?.trim() ?? "";
  const location = t.match(/\b(remote|hybrid|on-?site|[A-Z][a-z]+,\s*[A-Z]{2})\b/i)?.[0] ?? "";
  const salary = t.match(/\$\d{2,3}[kK](?:\s*[-–]\s*\$?\d{2,3}[kK])?|\d{1,3}(?:,\d{3})*\s*(?:LPA|lpa)/)?.[0] ?? "";
  const keywords = findKeywords(t, TECH_KEYWORDS);
  return {
    title, company, location, salaryRange: salary,
    requiredSkills: keywords, niceToHaveSkills: [] as string[],
    responsibilities: [] as string[], qualifications: [] as string[],
    workMode: /remote/i.test(t) ? "remote" : /hybrid/i.test(t) ? "hybrid" : "unknown",
    summary: t.slice(0, 300), keywords,
  };
}

export function suggestBullets(
  role: string,
  skills: string[],
  count = 3
): string[] {
  const verbs = ["Developed", "Led", "Optimized", "Implemented", "Designed", "Delivered"];
  const metrics = ["30%", "50+", "2x", "$100K", "10 team members", "99.9% uptime"];
  const bullets: string[] = [];

  for (let i = 0; i < count; i++) {
    const verb = verbs[i % verbs.length];
    const skill = skills[i % Math.max(skills.length, 1)] ?? "key technologies";
    const metric = metrics[i % metrics.length];
    bullets.push(`${verb} ${role.toLowerCase()} solutions using ${skill}, achieving ${metric} improvement in performance`);
  }
  return bullets;
}
