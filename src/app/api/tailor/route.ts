import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { resumesCollection } from "@/lib/mongodb";
import { tailorResumeBlocks, isAIEnabled } from "@/lib/ai";
import { ObjectId } from "mongodb";

async function getUID() {
  const session = await getServerSession(authOptions as never);
  return (session as { user?: { id?: string } } | null)?.user?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const uid = await getUID();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jobDescription, baseResumeId } = await req.json();
    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }
    if (jobDescription.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide a more detailed job description (at least 20 characters)." },
        { status: 400 }
      );
    }

    const col = await resumesCollection();
    let primary;
    if (baseResumeId && ObjectId.isValid(baseResumeId)) {
      primary = await col.findOne({ _id: new ObjectId(baseResumeId), userId: uid } as never);
    } else {
      primary = await col.findOne({ userId: uid } as never, { sort: { updatedAt: -1 } } as never);
    }

    if (!primary?.blocks?.length) {
      return NextResponse.json({ error: "No resume found. Build one in Resume Builder first." }, { status: 404 });
    }

    const result = await tailorResumeBlocks(primary.blocks, jobDescription);

    return NextResponse.json({
      name: `${primary.name} (Tailored)`,
      blocks: result.blocks,
      matchScore: result.matchScore,
      missingKeywords: result.missingKeywords,
      suggestions: result.suggestions,
      source: result.source,
      aiAvailable: isAIEnabled(),
      sourceName: primary.name ?? "Resume",
    });
  } catch (e) {
    console.error("[tailor.POST]", e);
    const msg = (e as Error).message?.toLowerCase() ?? "";
    const isTransient = /429|quota|timeout|econn|fetch failed|5\d\d/i.test(msg);
    return NextResponse.json({
      error: isTransient
        ? "Unable to tailor your resume right now. Please try again later."
        : "Unable to tailor your resume right now. Please try again later.",
      aiAvailable: isAIEnabled(),
    }, { status: 500 });
  }
}
