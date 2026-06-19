import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import * as cheerio from "cheerio";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth-config";
import { jobsCollection } from "@/lib/mongodb";
import { parseJobDescription, extractJobFromEmail, isAIEnabled } from "@/lib/ai";

const ManualSchema = z.object({
  title:       z.string().trim().max(200).default(""),
  company:     z.string().trim().max(200).default(""),
  description: z.string().trim().max(20000).default(""),
  status:      z.enum(["saved","applied","interview","offer","rejected"]).default("saved"),
});

const PostSchema = z.object({
  url:       z.string().url().optional(),
  emailText: z.string().max(20000).optional(),
  manual:    ManualSchema.optional(),
}).refine(
  v => v.url || v.emailText || (v.manual?.title && v.manual?.company),
  { message: "Provide a URL, email text, or both Title and Company." }
);

async function getUID() {
  const session = await getServerSession(authOptions as never);
  return (session as { user?: { id?: string } } | null)?.user?.id ?? null;
}

export async function GET() {
  try {
    const uid = await getUID();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const col  = await jobsCollection();
    const list = await col.find({ userId: uid } as never).sort({ updatedAt: -1 }).limit(500).toArray();
    return NextResponse.json({ success: true, data: list });
  } catch (e) {
    console.error("[jobs.GET]", e);
    return NextResponse.json({ success: false, error: "Failed to load jobs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const uid = await getUID();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body   = await req.json().catch(() => ({}));
    const parsed = PostSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join("; ") }, { status: 400 });

    const { url, emailText, manual } = parsed.data;
    let source: "manual"|"url"|"email" = "manual";
    let enriched: Partial<{ title:string; company:string; description:string; keywords:string[]; location:string; salaryRange:string }> = {};

    if (url) {
      source = "url";
      try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "Mozilla/5.0 (compatible; AIResumeTrackerBot/1.0)" } });
        if (res.ok) {
          const html = await res.text();
          const $ = cheerio.load(html);
          $("script,style,nav,footer,header,svg,noscript").remove();
          const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 12000);
          if (text.length > 50) {
            const job = await parseJobDescription(text);
            enriched = { title: job.title, company: job.company, description: job.summary, keywords: [...(job.requiredSkills ?? []), ...(job.keywords ?? [])].slice(0, 20), location: job.location, salaryRange: job.salaryRange };
          }
        }
      } catch (e) { console.warn("[jobs.POST] URL parse:", (e as Error).message); }
    } else if (emailText) {
      source = "email";
      try {
        const job = await extractJobFromEmail(emailText);
        if (job.isJobPosting) enriched = { title: job.title, company: job.company, description: job.summary, keywords: job.keySkills ?? [], location: job.location };
      } catch (e) { console.warn("[jobs.POST] email parse:", (e as Error).message); }
    }

    const title   = (enriched.title   || manual?.title   || "").trim();
    const company = (enriched.company || manual?.company || "").trim();
    if (!title || !company)
      return NextResponse.json({ error: "Could not determine title and company. Please fill them in.", needsManual: true, aiEnabled: isAIEnabled() }, { status: 422 });

    const now = new Date();
    const doc = {
      userId: uid, source, url: url ?? "",
      title, company,
      description: (enriched.description || manual?.description || "").trim(),
      keywords:    enriched.keywords    ?? [],
      location:    enriched.location    ?? "",
      salaryRange: enriched.salaryRange ?? "",
      status:      manual?.status       ?? "saved",
      createdAt: now, updatedAt: now,
    };
    const col    = await jobsCollection();
    const result = await col.insertOne(doc as never);
    return NextResponse.json({ id: result.insertedId, data: { ...doc, _id: result.insertedId } }, { status: 201 });
  } catch (e) {
    console.error("[jobs.POST]", e);
    return NextResponse.json({ error: (e as Error).message || "Failed to add job", aiEnabled: isAIEnabled() }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const uid = await getUID();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, updates } = await req.json();
    if (!id || !ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const col = await jobsCollection();
    const r   = await col.updateOne({ _id: new ObjectId(id as string), userId: uid } as never, { $set: { ...updates, updatedAt: new Date() } });
    if (!r.matchedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[jobs.PATCH]", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const uid = await getUID();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await req.json();
    if (!id || !ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const col = await jobsCollection();
    await col.deleteOne({ _id: new ObjectId(id as string), userId: uid } as never);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[jobs.DELETE]", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
