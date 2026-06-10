"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#6C63FF]/15 via-[#00C9A7]/15 to-[#6C63FF]/15 p-8 sm:p-12">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#6C63FF]/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#00C9A7]/20 blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Intelligent Resume &amp; Career Management Platform
          </h1>
          <p className="mt-4 text-gray-600 max-w-xl">
            ATS optimization, resume intelligence, job match analysis, application tracking, and optional AI tailoring — all at zero cost.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/jobs">Add First Job</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/resumes">Build Resume</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-[4/3] w-full rounded-2xl bg-white shadow-xl border border-gray-100 p-4">
            <div className="h-full w-full rounded-lg bg-gradient-to-br from-[#6C63FF]/20 to-[#00C9A7]/20 flex items-center justify-center text-center">
              <div>
                <div className="text-sm text-gray-500">Animated Preview</div>
                <div className="mt-2 text-lg font-semibold">Score • Match • Track • Win</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


