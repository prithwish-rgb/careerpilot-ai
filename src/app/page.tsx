"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Briefcase, 
  FileText, 
  BarChart3, 
  Brain, 
  Users, 
  TrendingUp,
  Plus,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AnimatedHeadline } from "@/components/AnimatedHeadline";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { PageLoading, InlineLoading } from "@/components/ui/loading-spinner";

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

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      setIsFetchingData(true);
      Promise.all([fetchJobs(), fetchAnalytics()]).finally(() => {
        setIsFetchingData(false);
      });
    } else if (status === "unauthenticated" || status === "loading") {
      setIsFetchingData(false);
    }
  }, [status]);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setJobs(data.data || []);
      setDbError(false);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      setJobs([]);
      setDbError(true);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setAnalytics(null);
      setDbError(true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "applied": return <Clock className="w-4 h-4 text-blue-500" />;
      case "interview": return <CheckCircle className="w-4 h-4 text-yellow-500" />;
      case "offer": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied": return "bg-blue-100 text-blue-800";
      case "interview": return "bg-yellow-100 text-yellow-800";
      case "offer": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || (status === "authenticated" && isFetchingData)) {
    return <PageLoading text="Loading your dashboard..." />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#6C63FF]/10 via-[#00C9A7]/10 to-[#6C63FF]/10">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Welcome to ResumeIQ</h1>
            <p className="text-gray-600 mb-6">Sign in to optimize your resume, track applications, and accelerate your career</p>
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/auth/signin">Get Started</Link>
              </Button>
              <div className="text-sm text-gray-500">
                <p>Having connection issues? <a href="/api/test-db" target="_blank" className="text-blue-600 hover:underline">Test Database Connection</a></p>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6C63FF]/5 via-[#00C9A7]/5 to-[#6C63FF]/5">
      <div className="w-full mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Error Banner */}
        {dbError && !isFetchingData && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <p className="text-yellow-800 text-sm">
                <strong>Database Not Connected:</strong> If you cannot see your data or add new jobs, please verify your MONGODB_URI in Vercel settings and ensure your MongoDB Atlas IP Access List allows connections from anywhere (0.0.0.0/0).
              </p>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="mb-8">
          <Hero />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name}!
          </h1>
          <p className="text-gray-600">Track your job applications and accelerate your career</p>
          <AnimatedHeadline />
        </div>

        <div className="mb-8">
          <Marquee items={["ATS Resume Score", "Job Match Analysis", "Resume Health Check", "Application Tracking", "Skill Gap Detection", "Gmail Job Import", "Resume Tailoring"]} />
              </div>

        {/* Quick Stats */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Jobs</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{analytics.totals.total}</p>
                  </div>
                  <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-[#6C63FF]" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Applied</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{analytics.totals.applied}</p>
                  </div>
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Interviews</p>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-600">{analytics.totals.interview}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Offers</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{analytics.totals.offer}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Recent Jobs */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Recent Job Applications
                </CardTitle>
                <Button asChild size="sm">
                  <Link href="/jobs">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Job
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No job applications yet</p>
                    <Button asChild>
                      <Link href="/jobs">Add Your First Job</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.slice(0, 5).map((job) => (
                      <div key={job._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{job.title || "Untitled Position"}</h3>
                          <p className="text-sm text-gray-600">{job.company || "Unknown Company"}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                          {getStatusIcon(job.status)}
              </div>
            </div>
                    ))}
                    {jobs.length > 5 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" asChild>
                          <Link href="/jobs">View All Jobs</Link>
                        </Button>
                      </div>
                    )}
              </div>
            )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/jobs">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Job
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/resumes">
                    <FileText className="h-4 w-4 mr-2" />
                    Build Resume
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/interview-prep">
                    <Brain className="h-4 w-4 mr-2" />
                    Interview Prep
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

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Career Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>ATS Tip:</strong> Run Resume Intelligence on your resume to get an ATS score and improvement recommendations
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Progress:</strong> {Math.round((analytics?.metrics.applicationToInterviewRate || 0) * 100)}% application-to-interview rate across {analytics?.totals.total ?? 0} tracked jobs
                    </p>
                  </div>
          </div>
        </CardContent>
      </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

