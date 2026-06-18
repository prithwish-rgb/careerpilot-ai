import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { generateFromBank, type InterviewCategory, type Difficulty } from "@/lib/interview-bank";

async function getUID() {
  const session = await getServerSession(authOptions as never);
  return (session as { user?: { id?: string } } | null)?.user?.id ?? null;
}

const CATEGORIES: InterviewCategory[] = ["technical", "behavioral", "hr", "mixed"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export async function POST(req: Request) {
  try {
    const uid = await getUID();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      jobDescription,
      roleTitle,
      category = "mixed",
      difficulty = "medium",
      countPerCategory = 5,
    } = body;

    if (!jobDescription?.trim() && !roleTitle?.trim()) {
      return NextResponse.json(
        { error: "Provide a job description or role title" },
        { status: 400 }
      );
    }

    const cat = CATEGORIES.includes(category) ? category : "mixed";
    const diff = DIFFICULTIES.includes(difficulty) ? difficulty : "medium";

    const result = generateFromBank({
      roleTitle: roleTitle || "Candidate",
      jobDescription: jobDescription || "",
      category: cat,
      difficulty: diff,
      countPerCategory: Number(countPerCategory) || 5,
    });

    return NextResponse.json({
      ...result,
      // Legacy shape for older clients
      situational: result.hr,
      tipsForEachCategory: {
        technical: "Use STAR for examples; cite specific tools from the JD.",
        behavioral: "Structure answers: Situation, Task, Action, Result.",
        hr: "Research the company mission and align your answers.",
        systemDesign: "Clarify requirements, estimate scale, then diagram components.",
      },
    });
  } catch (e) {
    console.error("[interview.prepare.POST]", e);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}
