"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonLoading } from "@/components/ui/loading-spinner";
import {
  Shield, CheckCircle, AlertTriangle, Target, Sparkles, TrendingUp,
} from "lucide-react";

interface ATSScore {
  score: number;
  grade: string;
  breakdown: Record<string, number>;
  recommendations: string[];
}

interface Completeness {
  score: number;
  present: string[];
  missing: string[];
  recommendations: string[];
}

interface Health {
  status: string;
  score: number;
  issues: { severity: string; message: string }[];
  strengths: string[];
}

interface Analytics {
  ats: ATSScore;
  completeness: Completeness;
  health: Health;
  wordCount: number;
  sectionCount: number;
  keywordCount: number;
}

interface MatchData {
  matchPercent: number;
  verdict: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  skillGaps: string[];
  strengths: string[];
  recommendations: string[];
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#00C9A7" : score >= 60 ? "#6C63FF" : score >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900">
        {score}
      </div>
    </div>
  );
}

export function IntelligencePanel({ resumeId }: { resumeId: string | null }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [jd, setJd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (!resumeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intelligence/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalytics(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const runMatch = async () => {
    if (!resumeId || !jd.trim()) return;
    setMatchLoading(true);
    try {
      const res = await fetch("/api/intelligence/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobDescription: jd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Match failed");
      setMatch(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Match analysis failed");
    } finally {
      setMatchLoading(false);
    }
  };

  const healthColor = (status: string) => {
    if (status === "excellent") return "text-green-600 bg-green-50";
    if (status === "good") return "text-blue-600 bg-blue-50";
    if (status === "fair") return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-[#6C63FF]" />
            Resume Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runAnalysis} disabled={!resumeId || loading} className="w-full">
            {loading && <ButtonLoading />}
            {loading ? "Analyzing..." : "Run ATS Analysis"}
          </Button>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}

          {analytics && (
            <div className="space-y-4">
              {/* Score rings */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="flex flex-col items-center">
                  <ScoreRing score={analytics.ats.score} />
                  <p className="text-xs font-medium mt-1">ATS Score</p>
                  <span className="text-xs text-gray-500">Grade {analytics.ats.grade}</span>
                </div>
                <div className="flex flex-col items-center">
                  <ScoreRing score={analytics.completeness.score} />
                  <p className="text-xs font-medium mt-1">Complete</p>
                </div>
                <div className="flex flex-col items-center">
                  <ScoreRing score={analytics.health.score} />
                  <p className="text-xs font-medium mt-1">Health</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${healthColor(analytics.health.status)}`}>
                    {analytics.health.status}
                  </span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-semibold text-gray-900">{analytics.wordCount}</div>
                  <div className="text-gray-500">Words</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-semibold text-gray-900">{analytics.sectionCount}</div>
                  <div className="text-gray-500">Sections</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-semibold text-gray-900">{analytics.keywordCount}</div>
                  <div className="text-gray-500">Keywords</div>
                </div>
              </div>

              {/* Recommendations */}
              {analytics.ats.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Recommendations
                  </p>
                  <ul className="space-y-1">
                    {analytics.ats.recommendations.map((r, i) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                        <TrendingUp className="h-3 w-3 text-[#6C63FF] shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Health issues */}
              {analytics.health.issues.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1.5">Health Issues</p>
                  <ul className="space-y-1">
                    {analytics.health.issues.map((issue, i) => (
                      <li key={i} className="text-xs flex gap-1.5">
                        {issue.severity === "critical" ? (
                          <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0 mt-0.5" />
                        )}
                        <span className="text-gray-600">{issue.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strengths */}
              {analytics.health.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1.5">Strengths</p>
                  <ul className="space-y-1">
                    {analytics.health.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                        <CheckCircle className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Match */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-[#00C9A7]" />
            Job Match Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder="Paste job description to analyze match..."
            rows={4}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF] resize-none"
          />
          <Button
            onClick={runMatch}
            disabled={!resumeId || !jd.trim() || matchLoading}
            variant="outline"
            className="w-full"
          >
            {matchLoading && <ButtonLoading />}
            {matchLoading ? "Matching..." : "Analyze Match"}
          </Button>

          {match && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{match.verdict}</span>
                <span className="text-2xl font-bold text-[#6C63FF]">{match.matchPercent}%</span>
              </div>

              {match.matchedKeywords.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Matched Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {match.matchedKeywords.map((k, i) => (
                      <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {match.missingKeywords.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Missing Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {match.missingKeywords.slice(0, 8).map((k, i) => (
                      <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {match.recommendations.length > 0 && (
                <ul className="space-y-1">
                  {match.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-gray-600">{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
