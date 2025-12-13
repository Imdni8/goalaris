# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Goalaris** is a B2C SaaS webapp that provides AI-powered career coaching for working professionals. Users track progress on annual goals by logging actions, which helps them prepare for self-assessment forms during performance review cycles.

**Core Features:**
1. Create SMART goals - AI-guided goal structuring
2. Goal to tasks - AI breaks down goals into actionable tasks
3. Log progress - Users log actions, mark completions, flag blockers
4. Self-assessment - AI generates summaries for performance reviews
5. AI Career Coach - Conversational coaching with context awareness

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Server Components
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **AI**: Google Gemini 2.5 Flash Lite (via Google AI Studio API, NOT Vertex AI)
- **UI**: Shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS utility-first

## Development Status

### 🎉 IN CLOSED BETA

**What's Working:**
✅ Goal & Task Management (CRUD, AI generation, Kanban board)
✅ Progress Tracking (action logs, blockers, visualization)
✅ Self-Assessment Generation (AI-powered, inline editing)
✅ AI Career Coach (context-aware, goal-focused conversations)
✅ Production Deployed (Vercel + Supabase)
✅ Error Handling (Sentry, error boundaries, user-friendly messages)
✅ Analytics (Custom Supabase table)
✅ **Beta Whitelist** (Email-based access control for closed beta)

**What's Next:**
⏳ Gather beta feedback
⏳ Mobile responsive improvements
⏳ Data export (CSV, PDF)

## Beta Access Control (2025-12-13)

**Implementation:** Email whitelist for closed beta signup

**Database:** `beta_whitelist` table
- Stores whitelisted emails with notes (e.g., job title)
- Tracks signup completion to prevent reuse
- No RLS (server-only access)

**Files:**
- Migration: `supabase/migrations/20251213000000_create_beta_whitelist.sql`
- API Routes:
  - `/api/auth/check-whitelist` - Validates email before signup
  - `/api/auth/mark-signup-complete` - Marks email as used after signup
- UI: `src/app/signup/page.tsx` - Beta banner + validation

**Adding Beta Users:**
Run SQL in Supabase Dashboard → SQL Editor:
```sql
INSERT INTO public.beta_whitelist (email, notes) VALUES
  ('user@example.com', 'Job title or note')
ON CONFLICT (email) DO NOTHING;
```

**Landing Page:** Top nav has Login + Sign Up buttons. Hero/bottom CTAs have "Join Waitlist" (Google Form for non-beta users).

**Rollback (when opening to public):**
Comment out ~10 lines in `src/app/signup/page.tsx`:
- Beta banner (lines ~81-89)
- Whitelist validation (lines ~31-50)
- Mark-complete call (lines ~85-90)

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── login/signup/       # Auth pages
│   ├── dashboard/          # Protected routes
│   ├── api/                # API routes (AI, auth, CRUD)
│   └── page.tsx            # Landing page
├── components/
│   ├── ui/                 # Shadcn components
│   ├── goals/tasks/logs/   # Feature components
│   └── shared/             # Reusable components
├── lib/
│   ├── supabase/           # DB clients (client.ts, server.ts)
│   ├── ai/                 # AI prompts, schemas, functions
│   ├── db/                 # Types, queries
│   └── utils/              # Helpers (null-safe.ts)
└── hooks/                  # Custom React hooks

supabase/
├── migrations/             # Database migrations
└── config.toml
```

## Database Schema

**Core Tables:**
- `profiles` - User profile (job_title, company)
- `goals` - Goals with SMART breakdown
- `tasks` - Actionable steps from goals
- `action_logs` - Progress entries (title, description, blocker_status)
- `assessments` - Saved self-assessments
- `coach_conversations` + `coach_messages` - AI coaching history
- `analytics_events` - Custom analytics
- `beta_whitelist` - Beta access control

**Key Design:**
- Row Level Security (RLS) on all user tables
- Cascade deletes for referential integrity
- Indexes on foreign keys

## Development Commands

```bash
# Setup
npm install
npx supabase start
npx supabase db push

# Development
npm run dev                 # localhost:3000
npm run build               # Production build
npm run type-check          # TypeScript check

# Database
npm run db:types            # Generate types after schema changes
npx tsx scripts/seed-test-data.ts  # Seed test data
```

## Key Architectural Patterns

### 1. Server Components by Default
- Use async Server Components for data fetching
- Only use 'use client' when state/event listeners needed
- Reduces bundle size, improves security

### 2. AI API Routes
- All AI operations server-side (keeps API key secret)
- Log interactions to `ai_interactions` table
- Validate responses with Zod schemas

### 3. Authentication
- Supabase auth (email/password)
- Auth state persists via HTTP-only cookies
- Middleware protects dashboard routes

### 4. Null Safety
**CRITICAL:** Database Row types have nullable fields.

Use helpers from `src/lib/utils/null-safe.ts`:
- `ensureTaskStatus(status)` - Converts null to 'todo'
- `ensureGoalStatus(status)` - Converts null to 'active'
- `safeString(value)` - Converts null to empty string

**Always handle nulls in form state:**
```typescript
// ✅ GOOD
const [formData, setFormData] = useState({
  status: ensureTaskStatus(task.status),
  due_date: safeString(task.due_date),
});
```

Run `npm run build` locally to catch null errors.

### 5. Self-Assessment Editing
- Uses Claude artifact-style pattern
- Two modes: View (AI refinement) and Edit (manual)
- Action logs use: `title`, `description`, `created_at` (not action_description/impact_notes/logged_at)

## AI Integration

### Google Gemini Setup

**Service:** Google AI Studio API (NOT Vertex AI)
- Model: `gemini-2.5-flash-lite`
- Auth: API key as query param
- Implementation: Direct fetch() calls

**Environment Variable:**
```env
GOOGLE_AI_API_KEY=your-api-key-here
```

Get key: [Google AI Studio](https://aistudio.google.com/apikey)

**Note:** `src/lib/ai/claude.ts` filename is historical - uses Gemini.

### When AI is Called
1. SMART Goal Creation - Structures raw input
2. Task Breakdown - Generates 5-10 tasks
3. Coaching - Context-aware advice
4. Assessment Summary - Generates review text
5. SMART/Text Refinement - Improves specific sections

## Monitoring & Analytics

### Sentry Error Tracking
- Tracks client/server errors
- Error boundaries integrated
- Test: `/api/sentry-test`

**Setup:** Free tier at sentry.io

### Custom Analytics
- Table: `analytics_events` in Supabase
- Events: goal_created, tasks_generated, action_logged, assessment_generated, coach_message_sent
- Query via SQL Editor (see `docs/analytics-queries.md`)

**Why custom:** Free, privacy-friendly, full control

## Code Quality

### Naming
- Files: kebab-case (`goal-list.tsx`)
- Components: PascalCase
- Variables: camelCase
- Database: snake_case

### TypeScript
- Strict mode enabled
- Use generated Supabase types (`src/lib/db/types.ts`)
- Validate AI responses with Zod

### Styling
- Tailwind utility-first
- Mobile-first responsive
- Consistent spacing (4px baseline)

## Common Tasks

### Add API Endpoint
1. Create `src/app/api/[path]/route.ts`
2. Get auth user: `const { data: { user } } = await supabase.auth.getUser()`
3. Validate input with Zod
4. Return JSON response

### Add AI Feature
1. Add prompt to `src/lib/ai/prompts.ts`
2. Add schema to `src/lib/ai/schemas.ts`
3. Add function to `src/lib/ai/claude.ts`
4. Create API route in `src/app/api/ai/[feature]/route.ts`

### Add Analytics Event
```typescript
import { trackEvent } from '@/lib/analytics';
await trackEvent('event_name', { prop: 'value' });
```

## Environment Variables

**Required:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
GOOGLE_AI_API_KEY=xxx
NEXT_PUBLIC_SENTRY_DSN=xxx  # Optional
```

**Local (for testing):**
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from supabase status]
```

## Production Deployment

**Platform:** Vercel
**Database:** Supabase (production instance)

**Checklist:**
1. Set env vars in Vercel
2. Apply migrations: Supabase Dashboard → SQL Editor
3. Push to GitHub → auto-deploys
4. Test signup flow with whitelisted email

## Security Notes

- API keys only in server routes (never client)
- RLS policies on all user tables
- Validate all input with Zod
- Supabase auth for token generation

## Coach Quality Improvements

**Context Analyzer** (`src/lib/coaching/context-analyzer.ts`):
- Computes health metrics: stalled goals, chronic blockers, velocity trends
- Detects blocker patterns (recurring themes, resolution time)
- Time-based filtering (30 days vs arbitrary limit)

**Goal-Focused Mode:**
- Users can focus conversation on specific goal
- Fetches complete history for that goal
- AI sees full context for deep-dive coaching

**Structured Responses:**
- Format: Analysis → Insights → Actions → Resources
- Emoji indicators for urgency (🔴🟡🟢) and trends (📈📉)
- Specific, data-driven, actionable advice

## Important Notes

- Action logs: Use `title`, `description`, `created_at` (not old field names)
- Always run `npm run build` before deploying (catches TypeScript errors)
- Test AI features with real data (seed script available)
- Document bugs in `testing/bug-fixes/` with RCA
- Don't commit without asking first
- Reply briefly to non-coding requests

## Useful Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Google AI Studio](https://aistudio.google.com)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
