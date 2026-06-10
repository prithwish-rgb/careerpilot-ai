import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { resumesCollection } from "@/lib/mongodb";
import { scoreJobMatch, isAIEnabled } from "@/lib/ai";

async function getUID() {
  const session = await getServerSession(authOptions as never);
  return (session as { user?: { id?: string } } | null)?.user?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const uid = await getUID();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jobDescription } = await req.json();
    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: "jobDescription is required" }, { status: 400 });
    }

    const col = await resumesCollection();
    const primary = await col.findOne({ userId: uid } as never, { sort: { updatedAt: -1 } } as never) as { blocks?: { type: string; content: string }[] } | null;

    const resumeText = primary?.blocks
      ?.map(b => `[${b.type.toUpperCase()}]\n${b.content}`)
      .join("\n\n") ?? "";

    const result = await scoreJobMatch(resumeText, jobDescription);
    return NextResponse.json({ ...result, aiAvailable: isAIEnabled() });
  } catch (e) {
    console.error("[recommend.POST]", e);
    return NextResponse.json({ error: (e as Error).message || "Scoring failed", aiAvailable: isAIEnabled() }, { status: 500 });
  }
}
