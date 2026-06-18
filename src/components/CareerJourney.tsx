"use client";

import { motion } from "framer-motion";
import {
  Upload,
  ScanSearch,
  Briefcase,
  MessageSquare,
  Trophy,
  ChevronRight,
} from "lucide-react";

const STEPS = [
  { icon: Upload, label: "Resume Upload", color: "from-violet-500 to-indigo-500" },
  { icon: ScanSearch, label: "AI Analysis", color: "from-indigo-500 to-blue-500" },
  { icon: Briefcase, label: "Job Tracking", color: "from-blue-500 to-cyan-500" },
  { icon: MessageSquare, label: "Interview Prep", color: "from-cyan-500 to-teal-500" },
  { icon: Trophy, label: "Offer Ready", color: "from-teal-500 to-emerald-500" },
];

export function CareerJourney() {
  return (
    <div className="aspect-[4/3] w-full rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 overflow-hidden">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4 text-center">
        Your Career Journey
      </p>
      <div className="flex flex-col justify-center h-[calc(100%-2rem)] gap-2 sm:gap-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.3 }}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} text-white shadow-md`}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {step.label}
                </p>
                <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${step.color}`}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.5 + i * 0.2, duration: 0.8 }}
                  />
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 hidden sm:block" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
