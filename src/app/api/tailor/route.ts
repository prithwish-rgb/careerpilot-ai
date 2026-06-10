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
      return NextResponse.json({ error: "jobDescription is required" }, { status: 400 });
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
    return NextResponse.json({
      error: (e as Error).message || "Tailoring failed",
      aiAvailable: isAIEnabled(),
    }, { status: 500 });
  }
}
