"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonLoading } from "@/components/ui/loading-spinner";
import { Shield, Target, Sparkles, TrendingUp } from "lucide-react";

interface ATSScore {
  score: number;
  grade: string;
  breakdown: {
    keywordDensity: number;
    actionVerbs: number;
    quantifiedAchievements: number;
    sectionStructure: number;
    contactInfo: number;
    lengthOptimal: number;
  };
  recommendations: string[];
}

interface Completeness {
  recommendations: string[];
}

interface Analytics {
  ats: ATSScore;
  completeness: Completeness;
  wordCount: number;
  sectionCount: number;
  keywordCount: number;
}

interface MatchData {
  matchPercent: number;
  verdict: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
}

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#00C9A7" : score >= 60 ? "#6C63FF" : score >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-base font-bold text-gray-900">
        {score}
      </div>
    </div>
  );
}

function deriveMetrics(analytics: Analytics) {
  const b = analytics.ats.breakdown;
  const atsCompat = Math.min(100, Math.round((b.keywordDensity / 25) * 50 + (b.sectionStructure / 15) * 50));
  const keywordStrength = Math.min(100, Math.round((analytics.keywordCount / 15) * 100));
  const contentQuality = Math.min(100, Math.round((b.actionVerbs / 20) * 50 + (b.quantifiedAchievements / 20) * 50));
  const suggestions = [
    ...analytics.ats.recommendations,
    ...analytics.completeness.recommendations,
  ].filter((s, i, arr) => arr.indexOf(s) === i);

  return {
    resumeScore: analytics.ats.score,
    atsCompatibility: atsCompat,
    keywordStrength,
    contentQuality,
    suggestions,
    grade: analytics.ats.grade,
  };
}

export function IntelligencePanel({ resumeId }: { resumeId: string | null }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [jd, setJd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const metrics = useMemo(() => (analytics ? deriveMetrics(analytics) : null), [analytics]);

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
            {loading ? "Analyzing..." : "Analyze Resume"}
          </Button>

          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

          {metrics && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <ScoreRing score={metrics.resumeScore} />
                  <p className="text-xs font-semibold mt-2">Resume Score</p>
                  <p className="text-xs text-gray-500">Grade {metrics.grade}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <ScoreRing score={metrics.atsCompatibility} />
                  <p className="text-xs font-semibold mt-2">ATS Compatibility</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <ScoreRing score={metrics.keywordStrength} />
                  <p className="text-xs font-semibold mt-2">Keyword Strength</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <ScoreRing score={metrics.contentQuality} />
                  <p className="text-xs font-semibold mt-2">Content Quality</p>
                </div>
              </div>

              {metrics.suggestions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Improvement Suggestions
                  </p>
                  <ul className="space-y-1.5">
                    {metrics.suggestions.map((r, i) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                        <TrendingUp className="h-3 w-3 text-[#6C63FF] shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-[#00C9A7]" />
            Job Match
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder="Paste job description..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] resize-none"
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
              {match.missingKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {match.missingKeywords.slice(0, 6).map((k, i) => (
                    <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs">{k}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
