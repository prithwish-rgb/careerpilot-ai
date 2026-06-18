"use client";

import { useDeferredValue } from "react";
import { ResumePreview } from "@/components/ResumePreview";

interface ResumeBlock {
  id: string;
  type: "summary" | "experience" | "project" | "education" | "skill";
  content: string;
  tags?: string[];
}

export function LiveResumePreview({
  name,
  blocks,
}: {
  name: string;
  blocks: ResumeBlock[];
}) {
  const deferredBlocks = useDeferredValue(blocks);
  const isStale = deferredBlocks !== blocks;

  return (
    <div className={isStale ? "opacity-80 transition-opacity" : "transition-opacity"}>
      <ResumePreview name={name} blocks={deferredBlocks} />
    </div>
  );
}
