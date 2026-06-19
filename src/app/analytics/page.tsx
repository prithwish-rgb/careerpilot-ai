"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Award,
  Briefcase,
  Brain,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/EmptyState";
import { DonutChart } from "@/components/charts/DonutChart";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { PAGE_CONTAINER_CLASS, SECTION_HEADER_CLASS, SECTION_SUBTITLE_CLASS } from "@/lib/modal-styles";
import Link from "next/link";

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

interface Job {
  _id: string;
  title?: string;
  company?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  keywords?: string[];
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    if (status === "authenticated") fetchData();
  }, [status, timeRange]);

  const fetchData = async () => {
    setFetchError(null);
    try {
      const [analyticsRes, jobsRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/jobs"),
      ]);

      if (!analyticsRes.ok || !jobsRes.ok) {
        setFetchError("Unable to load analytics data.");
        setAnalytics(null);
        setJobs([]);
        return;
      }

      setAnalytics(await analyticsRes.json());
      const jobsData = await jobsRes.json();
      setJobs(jobsData.data ?? []);
    } catch {
      setFetchError("Unable to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  const getJobsInTimeRange = () => {
    const days = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return jobs.filter((job) => new Date(job.createdAt) >= cutoffDate);
  };

  const statusDistribution = useMemo(() => {
    const recentJobs = getJobsInTimeRange();
    const distribution = recentJobs.reduce(
      (acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return Object.entries(distribution).map(([label, value]) => ({ label, value }));
  }, [jobs, timeRange]);

  const weeklyActivity = useMemo(() => {
    const recentJobs = getJobsInTimeRange();
    const weeks: Record<string, number> = {};
    recentJobs.forEach((job) => {
      const date = new Date(job.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      weeks[weekKey] = (weeks[weekKey] || 0) + 1;
    });
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8);
  }, [jobs, timeRange]);

  const getInterviewRate = () =>
    (analytics?.metrics.applicationToInterviewRate ?? 0) * 100;

  const getSuccessRate = () => {
    if (!analytics) return 0;
    const total = analytics.totals.applied;
    if (total === 0) return 0;
    return (analytics.totals.offer / total) * 100;
  };

  const hasData = (analytics?.totals.total ?? 0) > 0;

  if (status === "loading" || loading) {
    return <PageLoading text="Loading analytics..." />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view analytics.</p>
      </div>
    );
  }

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#6C63FF] mb-1">
              CareerPilot AI
            </p>
            <h1 className={SECTION_HEADER_CLASS}>Analytics Dashboard</h1>
            <p className={SECTION_SUBTITLE_CLASS}>Track your job search progress and insights</p>
          </div>
          <div className="flex gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C63FF] text-sm bg-white"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <Button onClick={fetchData} variant="outline">Refresh</Button>
          </div>
        </div>

        {fetchError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            {fetchError}
          </div>
        )}

        {!hasData && !fetchError ? (
          <Card>
            <EmptyState
              icon={BarChart3}
              title="No application data yet"
              description="Start tracking job applications to unlock analytics, funnels, and activity charts."
              action={
                <Button asChild>
                  <Link href="/jobs">Add Your First Job</Link>
                </Button>
              }
            />
          </Card>
        ) : analytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Total Applications", value: analytics.totals.total, icon: Briefcase, color: "text-[#6C63FF]" },
                { label: "Interview Rate", value: `${Math.round(getInterviewRate())}%`, icon: TrendingUp, color: "text-blue-600" },
                { label: "Success Rate", value: `${Math.round(getSuccessRate())}%`, icon: Award, color: "text-green-600" },
                { label: "Active Pipeline", value: analytics.totals.applied + analytics.totals.interview, icon: Clock, color: "text-yellow-600" },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{label}</p>
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                      </div>
                      <Icon className={`h-8 w-8 ${color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Application Funnel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FunnelChart
                    applied={analytics.totals.applied}
                    interview={analytics.totals.interview}
                    offer={analytics.totals.offer}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusDistribution.length === 0 ? (
                    <p className="text-sm text-gray-500">No applications in the selected period.</p>
                  ) : (
                    <DonutChart data={statusDistribution} />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Activity Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {weeklyActivity.length === 0 ? (
                    <p className="text-sm text-gray-500">No activity in the selected period. Add jobs to see weekly trends.</p>
                  ) : (
                    <div className="space-y-2">
                      {weeklyActivity.map(([week, count]) => (
                        <div key={week} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{new Date(week).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-[#00C9A7] h-2 rounded-full"
                                style={{
                                  width: `${(count / Math.max(...weeklyActivity.map(([, c]) => c), 1)) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium w-6 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getInterviewRate() > 20 ? (
                    <div className="p-3 bg-green-50 rounded-lg text-sm text-green-800">
                      Your {Math.round(getInterviewRate())}% interview rate is above average. Keep tailoring applications.
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                      Focus on tailoring resumes to job descriptions to improve your interview rate.
                    </div>
                  )}
                  <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    {analytics.totals.offer > 0
                      ? `Congratulations on ${analytics.totals.offer} offer${analytics.totals.offer > 1 ? "s" : ""}!`
                      : "Use Smart Interview Prep to build confidence before your next interview."}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
