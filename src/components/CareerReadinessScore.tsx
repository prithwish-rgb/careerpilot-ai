"use client";

import { memo } from "react";
import { Gauge, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import type { ReadinessResult } from "@/lib/readiness";

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#00C9A7" : score >= 60 ? "#6C63FF" : score >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={8} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">{score}%</span>
      </div>
    </div>
  );
}

export const CareerReadinessScore = memo(function CareerReadinessScore({
  readiness,
}: {
  readiness: ReadinessResult | null;
}) {
  return (
    <Card className="overflow-hidden border-[#6C63FF]/20 bg-gradient-to-br from-white to-[#6C63FF]/5 dark:from-gray-950 dark:to-[#6C63FF]/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-[#6C63FF]" />
            Career Readiness
          </span>
          <Tooltip label="Weighted score: 40% resume strength, 35% job activity, 25% interview practice. Build resumes, track applications, and practice interviews to improve.">
            <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="How is this calculated?">
              <Info className="h-4 w-4" />
            </button>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center pb-6">
        {readiness ? (
          <>
            <ScoreRing score={readiness.score} />
            <p className="mt-3 text-lg font-semibold text-[#6C63FF]">{readiness.label}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-500">
              <div>
                <p className="font-semibold text-gray-800">{readiness.breakdown.resume}%</p>
                <p>Resume</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">{readiness.breakdown.jobs}%</p>
                <p>Jobs</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">{readiness.breakdown.interview}%</p>
                <p>Interview</p>
              </div>
            </div>
          </>
        ) : (
          <div className="py-6 px-2">
            <Gauge className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              Complete more activities to unlock your readiness score.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Create a resume, save a job, or practice interview questions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
