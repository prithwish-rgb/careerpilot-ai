# CareerPilot

**Career Management Platform**

A full-stack web application for ATS optimization, resume intelligence, job match analysis, and application tracking — built to run at **$0 operational cost**.

Live: [https://ai-resume-tracker-lake.vercel.app](https://ai-resume-tracker-lake.vercel.app)

## Features

### Rule-Based Intelligence (No API Key Required)

| Feature | Description |
|---|---|
| **ATS Resume Score** | Grades your resume A–F based on keyword density, action verbs, quantified achievements, and structure |
| **Resume Completeness** | Checks for required sections (summary, experience, skills) and recommends missing ones |
| **Resume Health Check** | Identifies critical issues, warnings, and strengths |
| **Job Match Analysis** | Compares resume keywords against a job description with match percentage |
| **Skill Gap Detection** | Highlights missing skills from the job description |
| **Resume Analytics** | Word count, section count, keyword density |
| **Application Tracking** | Track jobs through saved → applied → interview → offer → rejected |
| **Career Dashboard** | Progress metrics, recent applications, and insights |
| **Gmail Job Import** | Import job postings from Gmail (requires Google OAuth setup) |

### Optional AI Enhancement (Google Gemini Free Tier)

When `GEMINI_API_KEY` is set, these features get AI-powered upgrades. Without it, rule-based fallbacks keep everything working:

- Resume Tailoring
- Resume Bullet Generation
- Resume Section Rewriting
- Interview Question Generation
- Job Description Parsing
- Negotiation Scripts

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Database:** MongoDB Atlas (free tier)
- **Auth:** NextAuth.js (credentials + optional OAuth)
- **Styling:** Tailwind CSS 4 + Radix UI
- **AI (optional):** Google Gemini 2.5 Flash (free tier)
- **Deployment:** Vercel (free tier)

## Getting Started

```bash
git clone https://github.com/prithwish-rgb/ai-resume-tracker.git
cd ai-resume-tracker
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
# Required
MONGODB_URI="mongodb+srv://..."
NEXTAUTH_SECRET="openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Optional — OAuth providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Optional — Gmail import
GOOGLE_REFRESH_TOKEN=""

# Optional — AI enhancement (free tier at https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash"
```

The app is **fully functional without `GEMINI_API_KEY`**. All intelligence features use deterministic rule-based algorithms.

## Architecture

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── intelligence/   # ATS score, job match (rule-based)
│   │   ├── tailor/         # Resume tailoring (AI + fallback)
│   │   ├── bullets/        # Bullet generation (AI + fallback)
│   │   ├── jobs/           # Job CRUD + parsing
│   │   └── resumes/        # Resume CRUD
│   ├── resumes/            # Resume builder with live preview
│   ├── jobs/               # Application tracker
│   └── analytics/          # Career progress dashboard
├── components/
│   ├── IntelligencePanel   # ATS score, health, match UI
│   ├── ResumePreview       # Live resume preview
│   └── Hero, Navbar, etc.
└── lib/
    ├── intelligence.ts     # Rule-based ATS/match/health engine
    ├── ai.ts               # Optional Gemini integration + fallbacks
    ├── mongodb.ts          # Database helpers
    └── auth-config.ts      # NextAuth configuration
```

## Portfolio Highlights

- **Zero-cost production deployment** on Vercel + MongoDB Atlas free tiers
- **Graceful degradation** — every feature works without paid APIs
- **Deterministic intelligence engine** with 50+ tech keywords, action verb detection, and quantified achievement scoring
- **Full authentication** with credentials and optional OAuth
- **Responsive UI** with live resume preview and real-time ATS analysis

## License

MIT
