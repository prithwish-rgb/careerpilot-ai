"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import {
  Briefcase,
  FileText,
  BarChart3,
  Brain,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PageLoading } from "@/components/ui/loading-spinner";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

const Hero = dynamic(() => import("@/components/Hero").then(m => ({ default: m.Hero })), {
  loading: () => <div className="h-48 rounded-3xl bg-gray-100 animate-pulse" />,
});
const AnimatedHeadline = dynamic(
  () => import("@/components/AnimatedHeadline").then(m => ({ default: m.AnimatedHeadline })),
  { ssr: false }
);
const Marquee = dynamic(
  () => import("@/components/Marquee").then(m => ({ default: m.Marquee })),
  { ssr: false, loading: () => <div className="h-12 rounded-xl bg-gray-100 animate-pulse" /> }
);

interface Job {
  _id: string;
  title?: string;
  company?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  totals: {
    total: number;
    applied: number;
    interview: number;
    offer: number;
    rejected: number;
  };
  metrics: {
    applicationToInterviewRate: number;
  };
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  applied: <Clock className="w-4 h-4 text-blue-500" />,
  interview: <CheckCircle className="w-4 h-4 text-yellow-500" />,
  offer: <CheckCircle className="w-4 h-4 text-green-500" />,
  rejected: <XCircle className="w-4 h-4 text-red-500" />,
};

const STATUS_COLOR: Record<string, string> = {
  applied: "bg-blue-100 text-blue-800",
  interview: "bg-yellow-100 text-yellow-800",
  offer: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const StatsGrid = memo(function StatsGrid({ analytics }: { analytics: Analytics }) {
  const items = useMemo(
    () => [
      { label: "Total Jobs", value: analytics.totals.total, icon: Briefcase, color: "text-[#6C63FF]" },
      { label: "Applied", value: analytics.totals.applied, icon: Clock, color: "text-blue-600" },
      { label: "Interviews", value: analytics.totals.interview, icon: CheckCircle, color: "text-yellow-600" },
      { label: "Offers", value: analytics.totals.offer, icon: TrendingUp, color: "text-green-600" },
    ],
    [analytics]
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
      {items.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{label}</p>
                <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
              </div>
              <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [dbError, setDbError] = useState(false);

  const loadDashboard = useCallback(async () => {
    setIsFetchingData(true);
    setDbError(false);
    try {
      const [jobsRes, analyticsRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/analytics"),
      ]);

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.data || []);
      } else {
        setJobs([]);
        setDbError(true);
      }

      if (analyticsRes.ok) {
        setAnalytics(await analyticsRes.json());
      } else {
        setAnalytics(null);
        setDbError(true);
      }
    } catch {
      setJobs([]);
      setAnalytics(null);
      setDbError(true);
    } finally {
      setIsFetchingData(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadDashboard();
  }, [status, loadDashboard]);

  const recentJobs = useMemo(() => jobs.slice(0, 5), [jobs]);
  const interviewRate = useMemo(
    () => Math.round((analytics?.metrics.applicationToInterviewRate || 0) * 100),
    [analytics]
  );

  if (status === "loading") {
    return <PageLoading text="Loading CareerPilot..." />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#6C63FF]/10 via-[#00C9A7]/10 to-[#6C63FF]/10">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#6C63FF] mb-1">
              Career Management Platform
            </p>
            <h1 className="text-2xl font-bold mb-2">Welcome to CareerPilot</h1>
            <p className="text-gray-600 mb-6">
              Sign in to optimize your resume, track applications, and prepare for interviews.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/signin">Get Started</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isFetchingData && !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#6C63FF]/5 via-[#00C9A7]/5 to-[#6C63FF]/5 px-4 py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6C63FF]/5 via-[#00C9A7]/5 to-[#6C63FF]/5">
      <div className="w-full mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {dbError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Connection issue:</strong> Verify MONGODB_URI in your environment settings.
            </p>
          </div>
        )}

        <div className="mb-8">
          <Hero />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name}!
          </h1>
          <p className="text-gray-600">Your career command center</p>
          <AnimatedHeadline />
        </div>

        <div className="mb-8">
          <Marquee
            items={[
              "ATS Resume Score",
              "Job Match Analysis",
              "Application Tracking",
              "Smart Interview Prep",
              "Resume Tailoring",
              "Career Analytics",
            ]}
          />
        </div>

        {analytics && <StatsGrid analytics={analytics} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Recent Applications
                </CardTitle>
                {jobs.length > 0 && (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/jobs">View All</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {recentJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No applications tracked yet</p>
                    <Button asChild variant="outline">
                      <Link href="/jobs">Go to Jobs</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentJobs.map(job => (
                      <div
                        key={job._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {job.title || "Untitled Position"}
                          </h3>
                          <p className="text-sm text-gray-600">{job.company || "Unknown Company"}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              STATUS_COLOR[job.status] ?? "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {job.status}
                          </span>
                          {STATUS_ICON[job.status] ?? <Clock className="w-4 h-4 text-gray-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/resumes">
                    <FileText className="h-4 w-4 mr-2" />
                    Build Resume
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/jobs">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Manage Jobs
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/interview-prep">
                    <Brain className="h-4 w-4 mr-2" />
                    Smart Interview Prep
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Career Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Run Resume Intelligence for ATS score and keyword recommendations.
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Progress:</strong> {interviewRate}% application-to-interview rate across{" "}
                    {analytics?.totals.total ?? 0} tracked jobs.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
