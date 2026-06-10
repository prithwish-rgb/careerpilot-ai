/**
 * ResumeIQ AI Layer — optional Google Gemini integration.
 * All functions fall back to rule-based intelligence when GEMINI_API_KEY is absent.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  analyzeJobMatch,
  tailorBlocksRuleBased,
  suggestBullets,
  heuristicParseJob,
} from "@/lib/intelligence";
import type { ResumeBlock as MongoResumeBlock } from "@/lib/mongodb";

const apiKey = process.env.GEMINI_API_KEY || "";
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const isAIEnabled = (): boolean => Boolean(apiKey);

export class AIDisabledError extends Error {
  constructor() {
    super("AI enhancement unavailable — using rule-based analysis instead.");
    this.name = "AIDisabledError";
  }
}

let _client: GoogleGenerativeAI | null = null;
function client(): GoogleGenerativeAI {
  if (!apiKey) throw new AIDisabledError();
  if (!_client) _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

function getModel() {
  return client().getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
  });
}

function extractJSON<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.search(/[{[]/);
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (start !== -1 && end > start) {
      const slice = cleaned.slice(start, end + 1).replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(slice) as T;
    }
    throw new Error(`Model did not return valid JSON. Raw: ${text.slice(0, 200)}`);
  }
}

async function generateJSON<T>(prompt: string, attempts = 2): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await getModel().generateContent(prompt);
      return extractJSON<T>(r.response.text());
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (!/429|5\d\d|fetch failed|ECONN/i.test(msg)) throw e;
      await new Promise(res => setTimeout(res, 600 * (i + 1)));
    }
  }
  throw lastErr;
}

// Re-export heuristic parser from intelligence for jobs route
export { heuristicParseJob as parseJobDescriptionFallback };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TailorResult {
  tailoredContent?: string;
  blocks?: MongoResumeBlock[];
  matchScore: number;
  missingKeywords: string[];
  suggestions: string[];
  source: "ai" | "rules";
}

export interface MatchResult {
  verdict: string;
  score: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  source: "ai" | "rules";
}

export interface ParsedJob {
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  workMode: string;
  summary: string;
  keywords: string[];
}

export interface InterviewResult {
  technical: string[];
  behavioral: string[];
  systemDesign: string[];
  situational: string[];
  tipsForEachCategory: Record<string, string>;
}

export interface NegotiationResult {
  script: string;
  keyPoints: string[];
  counterOffer: { base: string; bonus: string; equity: string };
  marketInsight: string;
  doList: string[];
  dontList: string[];
}

export interface ExtractedEmail {
  isJobPosting: boolean;
  title: string;
  company: string;
  location: string;
  applyUrl: string;
  deadline: string;
  salary: string;
  keySkills: string[];
  summary: string;
}

export interface BulletResult {
  bullets: string[];
  source: "ai" | "rules";
}

// ─── Resume Tailoring ───────────────────────────────────────────────────────

export async function tailorResumeBlocks(
  blocks: MongoResumeBlock[],
  jobDescription: string
): Promise<TailorResult> {
  if (!isAIEnabled()) {
    const result = tailorBlocksRuleBased(blocks, jobDescription);
    return { ...result, source: "rules" };
  }

  try {
    const prompt = `You are an ATS resume expert. Rewrite resume blocks to match the job description.
Rules: DO NOT fabricate experience. Preserve block id and type. Mirror JD keywords where candidate has the skill.
Return ONLY valid JSON array of blocks: [{"id":"...","type":"summary|experience|project|education|skill","content":"...","tags":[]}]

JOB DESCRIPTION:
"""${jobDescription.slice(0, 4000)}"""

RESUME BLOCKS:
${JSON.stringify(blocks).slice(0, 8000)}`;

    const tailoredBlocks = await generateJSON<MongoResumeBlock[]>(prompt);
    const match = analyzeJobMatch(blocks, jobDescription);
    return {
      blocks: tailoredBlocks,
      matchScore: match.matchPercent,
      missingKeywords: match.missingKeywords.slice(0, 8),
      suggestions: match.recommendations,
      source: "ai",
    };
  } catch {
    const result = tailorBlocksRuleBased(blocks, jobDescription);
    return { ...result, source: "rules" };
  }
}

/** Legacy text-based tailor — wraps block tailor for string resumes */
export async function tailorResume(
  resumeText: string,
  jobDescription: string
): Promise<TailorResult> {
  const simpleBlocks: MongoResumeBlock[] = [{ id: "body", type: "summary", content: resumeText } as MongoResumeBlock];
  const result = await tailorResumeBlocks(simpleBlocks, jobDescription);
  if (result.blocks) {
    return {
      tailoredContent: result.blocks.map(b => b.content).join("\n\n"),
      matchScore: result.matchScore,
      missingKeywords: result.missingKeywords,
      suggestions: result.suggestions,
      source: result.source,
    };
  }
  return result;
}

// ─── Job Match Scoring ──────────────────────────────────────────────────────

export async function scoreJobMatch(
  resumeText: string,
  jobDescription: string
): Promise<MatchResult> {
  const blocks: MongoResumeBlock[] = [{ id: "body", type: "summary", content: resumeText } as MongoResumeBlock];
  const ruleResult = analyzeJobMatch(blocks, jobDescription);

  if (!isAIEnabled()) {
    return {
      verdict: ruleResult.verdict,
      score: ruleResult.matchPercent,
      strengths: ruleResult.strengths,
      gaps: ruleResult.skillGaps,
      recommendation: ruleResult.recommendations.join(" "),
      source: "rules",
    };
  }

  try {
    const prompt = `Score resume vs job description. Return ONLY JSON:
{"verdict":"Strong Match|Good Match|Partial Match|Weak Match","score":<0-100>,"strengths":["..."],"gaps":["..."],"recommendation":"..."}

JD: """${jobDescription.slice(0, 3000)}"""
RESUME: """${resumeText.slice(0, 4000)}"""`;
    const ai = await generateJSON<Omit<MatchResult, "source">>(prompt);
    return { ...ai, source: "ai" };
  } catch {
    return {
      verdict: ruleResult.verdict,
      score: ruleResult.matchPercent,
      strengths: ruleResult.strengths,
      gaps: ruleResult.skillGaps,
      recommendation: ruleResult.recommendations.join(" "),
      source: "rules",
    };
  }
}

// ─── Bullet Generator ─────────────────────────────────────────────────────────

export async function generateBullets(
  role: string,
  context: string,
  count = 3
): Promise<BulletResult> {
  const skills = context.split(/[,;\n]/).map(s => s.trim()).filter(Boolean).slice(0, 5);

  if (!isAIEnabled()) {
    return { bullets: suggestBullets(role, skills, count), source: "rules" };
  }

  try {
    const prompt = `Generate ${count} resume bullet points for a ${role}.
Use strong action verbs and include metrics. Context: ${context.slice(0, 1000)}
Return ONLY JSON: {"bullets":["..."]}`;
    const result = await generateJSON<{ bullets: string[] }>(prompt);
    return { bullets: result.bullets, source: "ai" };
  } catch {
    return { bullets: suggestBullets(role, skills, count), source: "rules" };
  }
}

// ─── Job Description Parser ─────────────────────────────────────────────────

export async function parseJobDescription(rawText: string): Promise<ParsedJob> {
  if (!isAIEnabled()) return heuristicParseJob(rawText) as ParsedJob;

  try {
    const prompt = `Parse job posting. Return ONLY JSON:
{"title":"","company":"","location":"","salaryRange":"","requiredSkills":[],"niceToHaveSkills":[],"responsibilities":[],"qualifications":[],"workMode":"remote|hybrid|onsite|unknown","summary":"","keywords":[]}

TEXT: """${rawText.slice(0, 8000)}"""`;
    return await generateJSON<ParsedJob>(prompt);
  } catch {
    return heuristicParseJob(rawText) as ParsedJob;
  }
}

// ─── Interview Questions ────────────────────────────────────────────────────

export async function generateInterviewQuestions(
  jobDescription: string,
  resumeText: string,
  numQuestions = 5
): Promise<InterviewResult> {
  if (!isAIEnabled()) {
    return generateInterviewQuestionsRuleBased(jobDescription, resumeText, numQuestions);
  }

  try {
    const n = Math.min(Math.max(numQuestions, 1), 15);
    const prompt = `Generate interview questions. Return ONLY JSON:
{"technical":["..."],"behavioral":["..."],"systemDesign":["..."],"situational":["..."],"tipsForEachCategory":{"technical":"...","behavioral":"...","systemDesign":"...","situational":"..."}}

JD: """${jobDescription.slice(0, 3000)}"""
RESUME: """${resumeText.slice(0, 4000)}"""
Generate ${n} per category.`;
    return await generateJSON<InterviewResult>(prompt);
  } catch {
    return generateInterviewQuestionsRuleBased(jobDescription, resumeText, numQuestions);
  }
}

function generateInterviewQuestionsRuleBased(
  jobDescription: string,
  resumeText: string,
  n: number
): InterviewResult {
  const jdLower = jobDescription.toLowerCase();
  const techStack = ["React", "TypeScript", "Node.js", "Python", "AWS", "SQL", "Docker"]
    .filter(t => jdLower.includes(t.toLowerCase()));

  return {
    technical: [
      `Explain your experience with ${techStack[0] ?? "the primary tech stack"} mentioned in the JD`,
      "Walk me through a challenging technical problem you solved recently",
      "How do you approach debugging production issues?",
      "Describe your experience with system design at scale",
      "What's your approach to writing maintainable, testable code?",
    ].slice(0, n),
    behavioral: [
      "Tell me about a time you had to meet a tight deadline",
      "Describe a situation where you disagreed with a team member",
      "Give an example of when you took initiative beyond your role",
      "Tell me about a failure and what you learned from it",
      "Describe a time you mentored or helped a colleague grow",
    ].slice(0, n),
    systemDesign: [
      "How would you design a URL shortener service?",
      "Design a real-time notification system for millions of users",
    ],
    situational: [
      "How would you handle a critical bug discovered right before launch?",
      "Your team is behind schedule — what's your plan?",
    ],
    tipsForEachCategory: {
      technical: "Use the STAR method and reference specific projects from your resume",
      behavioral: "Prepare 5 STAR stories covering leadership, conflict, failure, initiative, and teamwork",
      systemDesign: "Start with requirements, estimate scale, then draw components",
      situational: "Show structured thinking — clarify, plan, execute, follow up",
    },
  };
}

// ─── Negotiation ──────────────────────────────────────────────────────────────

export async function generateNegotiationScript(params: {
  role: string;
  company: string;
  offeredBase: string;
  offeredBonus?: string;
  offeredEquity?: string;
  location: string;
  yearsExperience: string;
  targetBase?: string;
}): Promise<NegotiationResult> {
  if (!isAIEnabled()) {
    return generateNegotiationRuleBased(params);
  }

  try {
    const prompt = `Salary negotiation coach. Return ONLY JSON:
{"script":"<email>","keyPoints":["..."],"counterOffer":{"base":"","bonus":"","equity":""},"marketInsight":"...","doList":["..."],"dontList":["..."]}

Role: ${params.role} at ${params.company}, ${params.location}
Experience: ${params.yearsExperience} yrs | Offered: ${params.offeredBase}${params.targetBase ? ` | Target: ${params.targetBase}` : ""}`;
    return await generateJSON<NegotiationResult>(prompt);
  } catch {
    return generateNegotiationRuleBased(params);
  }
}

function generateNegotiationRuleBased(params: {
  role: string;
  company: string;
  offeredBase: string;
  location: string;
  yearsExperience: string;
  targetBase?: string;
}): NegotiationResult {
  return {
    script: `Dear Hiring Manager,\n\nThank you for the offer for the ${params.role} position at ${params.company}. I'm excited about the opportunity. Based on my ${params.yearsExperience} years of experience and market research for ${params.location}, I'd like to discuss the base salary component of the offer.\n\nI believe a figure of ${params.targetBase ?? "[your target]"} would better reflect the value I bring. I'm confident I can make a significant impact on your team.\n\nI look forward to discussing this further.\n\nBest regards`,
    keyPoints: [
      "Express enthusiasm before negotiating",
      "Anchor with market data for your location and experience level",
      "Focus on total compensation, not just base salary",
      "Be prepared to discuss equity and benefits",
    ],
    counterOffer: { base: params.targetBase ?? "10-15% above offer", bonus: "Request signing bonus", equity: "Negotiate refresh grants" },
    marketInsight: `For ${params.role} roles in ${params.location} with ${params.yearsExperience} years experience, market rates typically range 10-20% above entry offers.`,
    doList: ["Research market rates on Levels.fyi and Glassdoor", "Negotiate after receiving written offer", "Get everything in writing"],
    dontList: ["Don't accept immediately", "Don't reveal your current salary", "Don't make it personal"],
  };
}

// ─── Email Job Extractor ──────────────────────────────────────────────────────

export async function extractJobFromEmail(emailText: string): Promise<ExtractedEmail> {
  if (!isAIEnabled()) {
    const parsed = heuristicParseJob(emailText);
    return {
      isJobPosting: true,
      title: parsed.title,
      company: parsed.company,
      location: parsed.location,
      applyUrl: "",
      deadline: "",
      salary: parsed.salaryRange,
      keySkills: parsed.requiredSkills,
      summary: parsed.summary,
    };
  }

  try {
    const prompt = `Parse job alert email. Return ONLY JSON:
{"isJobPosting":true,"title":"","company":"","location":"","applyUrl":"","deadline":"","salary":"","keySkills":[],"summary":""}

EMAIL: """${emailText.slice(0, 6000)}"""`;
    return await generateJSON<ExtractedEmail>(prompt);
  } catch {
    const parsed = heuristicParseJob(emailText);
    return {
      isJobPosting: true,
      title: parsed.title,
      company: parsed.company,
      location: parsed.location,
      applyUrl: "",
      deadline: "",
      salary: parsed.salaryRange,
      keySkills: parsed.requiredSkills,
      summary: parsed.summary,
    };
  }
}
