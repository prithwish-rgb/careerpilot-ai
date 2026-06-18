"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CareerJourney } from "@/components/CareerJourney";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#6C63FF]/15 via-[#00C9A7]/15 to-[#6C63FF]/15 p-8 sm:p-12">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#6C63FF]/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#00C9A7]/20 blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#6C63FF] mb-2">
            Career Management Platform
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            CareerPilot
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-xl">
            ATS optimization, resume intelligence, job tracking, and interview prep — built to run at zero cost.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/resumes">Build Resume</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/jobs">View Applications</Link>
            </Button>
          </div>
        </div>

        <CareerJourney />
      </div>
    </section>
  );
}
