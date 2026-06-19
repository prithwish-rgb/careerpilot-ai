/** Map tailor API / network errors to user-safe messages */

export function getTailorErrorMessage(
  status: number,
  body?: { error?: string; code?: string }
): string {
  const raw = body?.error?.toLowerCase() ?? "";

  if (status === 401) return "Please sign in to tailor your resume.";
  if (status === 400) {
    if (raw.includes("jobdescription")) return "Please paste a job description to continue.";
    return "Invalid request. Check your job description and try again.";
  }
  if (status === 404) {
    return "Add at least one section to your resume before tailoring.";
  }
  if (status === 429 || raw.includes("quota") || raw.includes("429")) {
    return "Unable to tailor your resume right now. Please try again later.";
  }
  if (raw.includes("timeout") || raw.includes("econn") || raw.includes("fetch failed")) {
    return "Unable to tailor your resume right now. Please try again later.";
  }
  if (raw.includes("api key") || raw.includes("invalid") && raw.includes("key")) {
    return "Tailoring completed using rule-based optimization (AI unavailable).";
  }
  if (status >= 500) {
    return "Unable to tailor your resume right now. Please try again later.";
  }

  return "Unable to tailor your resume right now. Please try again later.";
}
