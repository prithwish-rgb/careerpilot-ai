import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { resumesCollection } from "@/lib/mongodb";
import { analyzeJobMatch } from "@/lib/intelligence";
import { isAIEnabled } from "@/lib/ai";
import { ObjectId } from "mongodb";

async function getUID() {
  const session = await getServerSession(authOptions as never);
  return (session as { user?: { id?: string } } | null)?.user?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const uid = await getUID();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jobDescription, resumeId } = await req.json();
    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: "jobDescription is required" }, { status: 400 });
    }

    const col = await resumesCollection();
    let resume;
    if (resumeId && ObjectId.isValid(resumeId)) {
      resume = await col.findOne({ _id: new ObjectId(resumeId), userId: uid } as never);
    } else {
      resume = await col.findOne({ userId: uid } as never, { sort: { updatedAt: -1 } } as never);
    }

    const blocks = resume?.blocks ?? [];
    const match = analyzeJobMatch(blocks, jobDescription);

    return NextResponse.json({
      data: match,
      aiAvailable: isAIEnabled(),
      source: "rules",
    });
  } catch (e) {
    console.error("[intelligence/match.POST]", e);
    return NextResponse.json({ error: "Match analysis failed" }, { status: 500 });
  }
}
