import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { jobsCollection, interviewsCollection } from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = (session as any)?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const jobs = await jobsCollection();
    const interviews = await interviewsCollection();

    const [total, applied, interview, offer, rejected] = await Promise.all([
      jobs.countDocuments({ userId }),
      jobs.countDocuments({ userId, status: "applied" }),
      jobs.countDocuments({ userId, status: "interview" }),
      jobs.countDocuments({ userId, status: "offer" }),
      jobs.countDocuments({ userId, status: "rejected" })
    ]);

    const appToInterviewRate = total ? (interview / Math.max(1, applied)) : 0;

    return NextResponse.json({
      success: true,
      totals: { total, applied, interview, offer, rejected },
      metrics: {
        applicationToInterviewRate: appToInterviewRate,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to load analytics",
    }, { status: 500 });
  }
}


