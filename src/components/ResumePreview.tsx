"use client";

interface ResumeBlock {
  id: string;
  type: "summary" | "experience" | "project" | "education" | "skill";
  content: string;
  tags?: string[];
}

const SECTION_LABELS: Record<ResumeBlock["type"], string> = {
  summary: "Professional Summary",
  experience: "Experience",
  project: "Projects",
  education: "Education",
  skill: "Skills",
};

export function ResumePreview({
  name,
  blocks,
}: {
  name: string;
  blocks: ResumeBlock[];
}) {
  if (!blocks.length) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center text-gray-400 text-sm">
        Add sections to see live preview
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 sm:p-8 text-sm leading-relaxed max-h-[600px] overflow-y-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-1">{name}</h2>
      <div className="h-px bg-gray-200 my-4" />

      {blocks.map(block => (
        <div key={block.id} className="mb-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6C63FF] mb-1.5">
            {SECTION_LABELS[block.type]}
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap">{block.content}</p>
          {block.tags && block.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {block.tags.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
