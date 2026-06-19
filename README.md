# CareerPilot AI

**Smart Career Management Platform**

A production-quality full-stack SaaS for resume intelligence, job tracking, Smart Interview Prep, and career analytics — built to run at **$0 operational cost** and showcase junior/full-stack engineering skills.

Live: [https://ai-resume-tracker-lake.vercel.app](https://ai-resume-tracker-lake.vercel.app)

## Overview

CareerPilot AI helps job seekers manage their entire career pipeline in one place:

- Build and analyze resumes with ATS intelligence
- Track applications from saved → applied → interview → offer
- Practice interviews with curated, rule-based question banks (no paid APIs)
- View analytics, funnels, and career readiness scores

## Features

| Module | Capabilities |
|---|---|
| **Dashboard** | Career journey animation, readiness score, parallel data loading, skeleton loaders |
| **Resume Builder** | Block-based editor, live preview (`useDeferredValue`), intelligence panel, tailor for job |
| **Jobs** | CRUD, URL/email parsing, status tracking, view/edit/delete with confirmation |
| **Smart Interview Prep** | Category/difficulty selectors, timer, self-rating, localStorage persistence |
| **Analytics** | Application funnel, status donut chart, weekly activity, insights |

### Rule-Based Intelligence (No API Key Required)

- Resume Score, ATS Compatibility, Keyword Strength, Content Quality
- Top Missing Keywords from job descriptions
- Job match analysis with skill gap detection
- Resume tailoring via rule-based keyword optimization

### Optional AI (Google Gemini Free Tier)

When `GEMINI_API_KEY` is set, tailoring and parsing get AI upgrades. Without it, rule-based fallbacks keep everything working.

## Why Rule-Based Interview Prep?

Interview prep uses **curated question banks** (`src/lib/interview-bank.ts`) instead of paid LLM APIs because:

1. **Zero cost** — no per-request billing for portfolio/demo usage
2. **Deterministic** — reproducible for demos and QA
3. **Fast** — instant generation with no network latency
4. **Reliable** — no rate limits, timeouts, or API key management for core flows
5. **Interview-realistic** — questions sourced from common industry patterns (STAR, technical, HR)

Randomization and role context from saved jobs keep sessions fresh without external dependencies.

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Dashboard (Promise.all: jobs, analytics, resumes)
│   ├── jobs/                 # Application tracker
│   ├── resumes/              # Resume builder + intelligence
│   ├── interview-prep/       # Smart Interview Prep
│   ├── analytics/            # Funnel, charts, insights
│   └── api/
│       ├── jobs/             # CRUD + parsing
│       ├── resumes/          # CRUD
│       ├── analytics/        # Aggregated metrics
│       ├── intelligence/     # Score + match (rule-based)
│       ├── tailor/           # Resume tailoring (AI + fallback)
│       └── interview/prepare # Question generation (bank)
├── components/
│   ├── CareerReadinessScore  # Weighted readiness widget
│   ├── IntelligencePanel     # ATS + keywords UI
│   ├── LiveResumePreview     # Deferred preview updates
│   ├── EmptyState            # Shared empty states
│   ├── ConfirmDialog         # Delete confirmations
│   └── charts/               # Donut, funnel (SVG, zero deps)
└── lib/
    ├── intelligence.ts       # Rule-based ATS engine
    ├── interview-bank.ts     # Curated interview questions
    ├── interview-persistence.ts  # localStorage stats
    ├── readiness.ts          # Career readiness calculation
    ├── modal-styles.ts       # Design tokens (single source of truth)
    └── ai.ts                 # Optional Gemini + fallbacks
```

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Database:** MongoDB Atlas
- **Auth:** NextAuth.js (credentials + optional OAuth)
- **UI:** Tailwind CSS 4, shadcn/ui, Radix UI, Framer Motion
- **AI (optional):** Google Gemini 2.5 Flash
- **Deployment:** Vercel

## Performance Optimizations

- `Promise.all` for parallel dashboard/analytics fetching (3 requests max on dashboard)
- Dynamic imports for Hero, Marquee, AnimatedHeadline
- `React.memo` + `useMemo` for stats grids
- `useDeferredValue` for live resume preview
- Skeleton loaders during initial fetch
- SVG charts (no chart library bundle)
- Lazy session stats from localStorage (no DB round-trip)

## Getting Started

```bash
git clone https://github.com/prithwish-rgb/ai-resume-tracker.git
cd ai-resume-tracker
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables

```env
MONGODB_URI="mongodb+srv://..."
NEXTAUTH_SECRET="openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Optional
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

## Testing Checklist

### Jobs
- [ ] Create job (manual, URL, email text)
- [ ] Edit job status and details
- [ ] View job details dialog
- [ ] Delete with confirmation
- [ ] Open original posting link
- [ ] Empty state shows guidance (not error)

### Resumes
- [ ] Create resume and add sections
- [ ] Live preview updates smoothly
- [ ] Analyze resume intelligence
- [ ] Match against job description / saved job
- [ ] Tailor with valid/invalid/short JD

### Smart Interview Prep
- [ ] Generate by category + difficulty
- [ ] Timer runs during session
- [ ] Self-rating saves per question
- [ ] Stats persist after refresh (localStorage)
- [ ] Streak and totals update

### Dashboard
- [ ] First load skeleton → content
- [ ] Empty state for new users
- [ ] Career readiness unlocks with activity
- [ ] Returning user sees readiness score

### Analytics
- [ ] Empty state with CTA
- [ ] Funnel + donut with data
- [ ] Weekly activity chart

## Screenshots / GIF Recommendations

1. Dashboard with Career Journey animation + readiness score
2. Resume Intelligence panel with score rings
3. Smart Interview Prep question workspace
4. Analytics funnel + status donut
5. Mobile responsive jobs list

## Future Improvements

- Unified `/api/dashboard` endpoint (single round-trip)
- E2E tests with Playwright
- Dark mode polish pass
- Export analytics as PDF
- Collaborative resume sharing

## License

MIT
