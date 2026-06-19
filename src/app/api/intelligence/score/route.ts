import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { resumesCollection } from "@/lib/mongodb";
import { analyzeResume } from "@/lib/intelligence";
import { ObjectId } from "mongodb";

async function getUID() {
  const session = await getServerSession(authOptions as never);
  return (session as { user?: { id?: string } } | null)?.user?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const uid = await getUID();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { resumeId } = await req.json();
    const col = await resumesCollection();

    let resume;
    if (resumeId && ObjectId.isValid(resumeId)) {
      resume = await col.findOne({ _id: new ObjectId(resumeId), userId: uid } as never);
    } else {
      resume = await col.findOne({ userId: uid } as never, { sort: { updatedAt: -1 } } as never);
    }

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (!resume.blocks?.length) {
      return NextResponse.json({
        success: true,
        empty: true,
        message: "Add sections to your resume to run analysis.",
        data: null,
      });
    }

    const analytics = analyzeResume(resume.blocks);
    return NextResponse.json({ success: true, data: analytics, resumeName: resume.name });
  } catch (e) {
    console.error("[intelligence/score.POST]", e);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
