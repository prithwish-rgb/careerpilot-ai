import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { generateBullets, isAIEnabled } from "@/lib/ai";

async function getUID() {
  const session = await getServerSession(authOptions as never);
  return (session as { user?: { id?: string } } | null)?.user?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const uid = await getUID();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role, context, count } = await req.json();
    if (!role?.trim()) {
      return NextResponse.json({ error: "role is required" }, { status: 400 });
    }

    const result = await generateBullets(role, context ?? "", count ?? 3);
    return NextResponse.json({ ...result, aiAvailable: isAIEnabled() });
  } catch (e) {
    console.error("[bullets.POST]", e);
    return NextResponse.json({ error: "Bullet generation failed" }, { status: 500 });
  }
}
