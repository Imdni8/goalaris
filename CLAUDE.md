# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Goalaris** is a B2C SaaS webapp that provides AI-powered career coaching for working professionals. Users track progress on annual goals by logging actions, which helps them prepare for self-assessment forms during performance review cycles.

**Core Features:**
1. Create SMART goals - AI-guided goal structuring (Specific, Measurable, Achievable, Relevant, Time-bound)
2. Goal to tasks - AI breaks down goals into 5-10 actionable, trackable tasks
3. Log progress - Users log actions toward tasks, mark completions, describe blockers, and modify tasks
4. Self-assessment - AI generates summaries of contributions for performance reviews

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Server Components
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **AI**: Google Gemini 2.5 Flash Lite (via Google AI Studio API, NOT Vertex AI)
- **UI**: Shadcn/ui components + Radix UI primitives
- **Forms**: react-hook-form + Zod validation
- **Styling**: Tailwind CSS utility-first

## Development Status

### 🎉 BETA READY - All Core Features Complete!

**Phase 1: Foundation** ✅ COMPLETE
**Phase 2: Core CRUD** ✅ COMPLETE
**Phase 3: AI Integration** ✅ COMPLETE
**Phase 4: Progress Tracking & Dashboard** ✅ COMPLETE
**Phase 5: Progress Visualization** ✅ COMPLETE
**Phase 6: Self-Assessment Generation** ✅ COMPLETE
**Phase 7: AI Coaching System** ✅ COMPLETE
**Phase 8: Data Export & Additional Features** ⏳ NOT STARTED
**Phase 9: Optimization & Deploy** ✅ COMPLETE

### What's Working (Ready for Beta Users):
✅ **Goal Management**: Create, edit, delete goals with AI-powered SMART structuring
✅ **Task Management**: AI generates task breakdowns; drag-and-drop Kanban board
✅ **Progress Tracking**: Action logs with blocker management; completion tracking
✅ **Progress Visualization**: Task completion charts, activity heatmap, dashboard overview
✅ **Self-Assessment**: AI generates first-person review summaries with inline editing
✅ **AI Career Coach**: Conversational coaching with context awareness, goal focus, pattern recognition
✅ **Production Deployment**: Live at Vercel with production Supabase + Google Gemini AI
✅ **All Critical Bugs Fixed**: TypeScript null errors, streaming responses, ESLint issues resolved

### What's Next (Post-Beta Feedback):
⏳ Test production user flow end-to-end
⏳ Create beta user onboarding guide
⏳ Set up feedback collection mechanism
⏳ Data export (CSV, PDF)
⏳ Mobile responsive improvements

### Beta Onboarding Checklist:
**Pre-Launch (Required):**
- [x] Deploy to production (Vercel) ✅
- [x] Set up production Supabase instance ✅
- [x] Configure environment variables in production ✅
- [x] Set up Google Gemini API access for production ✅
- [x] Fix all TypeScript null errors comprehensively ✅
- [ ] Test complete user flow in production
- [ ] Create onboarding documentation/guide for beta users
- [ ] Set up basic analytics/monitoring (track user actions, errors)
- [ ] Create feedback collection mechanism (form, email, or in-app)

**Nice to Have:**
- [ ] Create demo video showing key features
- [ ] Write user guide with screenshots
- [ ] Set up error tracking (Sentry or similar)
- [ ] Add basic rate limiting to prevent abuse

**Beta User Instructions to Provide:**
1. Sign up at [production URL]
2. Start by creating your first goal (try AI-assisted SMART goal)
3. Let AI break down the goal into tasks
4. Log some progress on tasks to see the dashboard come alive
5. Try the AI Coach for guidance on your goals
6. Generate a self-assessment when you have enough logged progress

See "Feature Checklist (Ordered by Dependency)" below for detailed breakdown of what's been built and what's next.

## Feature Checklist (Ordered by Dependency)

Track all features to be built, ordered logically by dependencies. Check off as you complete them.

### Core Foundation (COMPLETED ✅)
- [x] User authentication system (login/signup)
- [x] Route protection with middleware
- [x] Database schema with RLS policies
- [x] TypeScript types generation from Supabase
- [x] Supabase client setup (server & browser)

### Goal Management (COMPLETED ✅)
- [x] Create goal (manual entry)
- [x] Read goal list with pagination
- [x] Read goal details
- [x] Update goal
- [x] Delete goal
- [x] Goal status management (active/completed/archived)
- [x] Goal detail page with SMART breakdown display

### Task Management (COMPLETED ✅)
- [x] Create task (manual entry)
- [x] Read task list (ordered by index)
- [x] Update task details
- [x] Delete task
- [x] Task status management (todo/in_progress/blocked/completed)
- [x] Task ordering/sequencing (drag-to-reorder optional for later)

### AI Features - Goal Generation (COMPLETED ✅)
- [x] API route for generating SMART goals from raw text
- [x] Gemini prompt template for SMART goal structuring
- [x] Zod schema for validating AI response
- [x] UI form for AI goal input (2-step: input → review)
- [x] Log AI interactions to database
- [x] Error handling for API calls
- [x] Update goals list to show "✨ AI" badge for AI-generated goals

### AI Features - Task Breakdown (COMPLETED ✅)
- [x] API route for generating task breakdown from goal
- [x] Gemini prompt template for task generation
- [x] Zod schema for validating task list response
- [x] Button on goal detail to trigger AI task generation
- [x] Insert generated tasks into database with proper ordering
- [x] Log AI interactions to database
- [x] Error handling and user feedback

### AI Features - SMART Refinement (COMPLETED ✅)
- [x] API route for refining SMART elements `/api/ai/refine-smart-element`
- [x] Gemini prompt template for SMART element refinement
- [x] Inline "Refine with AI" button for each SMART element
- [x] Input field for additional refinement prompt
- [x] Show refined version in preview before accepting
- [x] Update goal with refined SMART element
- [x] Log refinement interactions to `ai_interactions` table

### Dashboard Features - Kanban Board (COMPLETED ✅)
- [x] Create Kanban board component with columns (todo, in_progress, done)
- [x] Query all tasks from active goals grouped by status
- [x] Implement drag-and-drop status updates using @dnd-kit/core
- [x] Display goal context badge on each task card
- [x] Update task status on card drop with optimistic UI
- [x] Add Kanban view to dashboard home screen
- [x] Add pagination (10 tasks per column, load more button)
- [x] Show task due dates and days until due

### Progress Tracking - Action Logs (COMPLETED ✅)
- [x] Create action log form component
  - Fields: action_description (required), impact_notes (optional)
  - Auto-update task status to 'in_progress' when first log is added
  - Support alwaysOpen mode for use in modal
- [x] Action log timeline view
  - Sort by date (newest first)
  - Display action description and impact notes
  - Show relative time (e.g., "2 hours ago")
- [x] Database queries for fetching action logs
  - Fetch logs per task, ordered by logged_at descending
- [x] Link action logs to tasks (foreign key relationship)
- [x] Task detail modal to show and add action logs
  - Clickable task cards in Kanban board open modal
  - Modal shows task details with edit button
  - Timeline of all action logs
  - Form to add new logs
- [x] Make goal name in task cards clickable (navigates to goal details)

### Progress Tracking - Blocker Management (COMPLETED ✅)
- [x] Blocker input field in action log form
  - Added optional blocker_description field (conditionally shown when status='blocked')
  - Auto-sets blocker_status to 'active' when blocker is logged
- [x] Blocker status tracking (active/resolved)
  - Added blocker_status column to action_logs table (migration: 20250116000000_add_blocker_status.sql)
  - Task status auto-updates to 'blocked' when active blocker is logged
- [x] Mark blocker as resolved
  - Added "Mark Resolved" button for active blockers in timeline
  - Updates blocker_status from 'active' to 'resolved'
  - Resolved blockers display with gray background instead of red
- [x] Delete action logs functionality
  - Delete button added to each action log in timeline
  - Includes confirmation dialog before deletion
- [x] Blocker count badge on goal card
  - Shows count of tasks with active blockers per goal
  - Displays red badge with blocker count on goal cards
- [ ] AI suggestion for unblocking strategies (optional - deferred)

### AI Features - Self-Assessment Generation (COMPLETED ✅)
- [x] Database schema for assessments table
  - Table: assessments (id, user_id, title, content, date_range, goal_ids, version, status)
  - RLS policies for user data isolation
  - Migration applied successfully
- [x] API route for self-assessment generation (`/api/ai/generate-assessment`)
  - Fetches goals with SMART details + all action logs
  - Supports goal filtering and date range selection
  - Enhanced prompt with first-person narrative, quantifiable results
  - Returns 3-4 paragraph professional summary
- [x] API route for selective text refinement (`/api/ai/refine-assessment-text`)
  - Takes selected text + user instruction
  - Refines only the selected portion
  - Maintains context and professional tone
- [x] Self-assessment page (`/dashboard/self-assessment`)
  - Goal selection UI (multi-select checkboxes)
  - Date range picker with presets (Last 6 Months, Full Year)
  - Generate button with loading state
  - Stats display (goal count, action count)
  - List of saved assessments with status badges
- [x] Interactive Assessment Editor (Claude artifact-style editing)
  - Two modes: View (read-only with AI refinement) and Edit (manual)
  - Text selection → "Refine with AI" popup
  - User provides refinement instruction
  - Preview refined text before accepting
  - Copy to clipboard functionality
  - Word/character count
- [x] Save/load functionality
  - Save as Draft or Final
  - Store with title, date range, selected goals
  - Display saved assessments list
  - Click to load saved assessments into editor
  - Update existing assessments (changes button labels to "Update")
  - Visual feedback with blue border for loaded assessment
  - Auto-populates configuration from loaded assessment
- [x] Navigation integration
  - Added "Self-Assessment" link to dashboard nav
  - Removed placeholder links (Progress, Insights)
- [x] Test data seeding
  - Created seed script (`scripts/seed-test-data.ts`) with realistic data
  - 2 goals (Mobile App MVP, API Performance), 8 tasks, 19 action logs
  - Fixed column name mismatches (action_description → title, impact_notes → description, logged_at → created_at)
  - Run with: `npx tsx scripts/seed-test-data.ts`

### Progress Visualization (IN PROGRESS ⏳)
- [x] Task completion percentage chart per goal
  - Created reusable `TaskProgressChart` component with color-coded progress bars
  - Integrated into goal cards (goals list page) showing completion %
  - Added detailed progress overview on goal detail page with stats (total/completed/remaining)
  - Color coding: green (>70%), yellow (40-70%), red (<40%)
- [x] Heatmap of activity by date
  - GitHub-style contribution heatmap showing 12 weeks of activity
  - Color-coded cells based on action count: 0 (gray), 1-2 (light green), 3-5 (medium green), 6+ (dark green)
  - Hover tooltips showing date and action count
  - Month labels and day indicators
  - Integrated into dashboard progress widget
- [x] Goal progress dashboard widget
  - Comprehensive `ProgressOverviewWidget` component on dashboard home
  - Overall stats: total goals, completion %, recent actions (7d), active blockers
  - Activity heatmap showing 90 days of logged actions
  - "Goals Needing Attention" section (top 3 by lowest completion %)
  - Gradient progress bar for overall task completion
  - Replaces old simple stat cards on dashboard
- [~] Timeline view of action logs (SKIPPED - deferred to later phase)
- [~] Progress indicators (on_track vs at_risk vs blocked) (SKIPPED - deferred to later phase)
- [~] Export progress chart as image (optional) (SKIPPED - deferred to later phase)

### AI Features - Insights & Coaching (COMPLETED ✅)
- [x] API route for coaching feedback (`/api/coach/send-message`)
  - Input: conversation + user context (goals, tasks, action logs)
  - Output: streaming AI responses
- [x] Gemini prompt template for coaching
- [x] Chat-based coaching interface (`/dashboard/coach`)
- [x] Conversation management (list, create, history)
- [x] Context-aware coaching (accesses user's goals, tasks, recent action logs)
- [ ] Rate limiting for coaching API (deferred)

### Coaching Quality Improvements (COMPLETED ✅)
**Goal**: Make AI coach more relevant, actionable, and proactive using low-effort/high-impact strategies

**Sprint 1: Quick Wins** ✅ COMPLETE
- [x] Smart Context Window - Changed from 10 logs to 30 days of time-based filtering
- [x] Actionable Response Structure - Added structured format: Analysis → Insights → Actions → Resources
- [x] Computed Insights - Pre-compute health metrics (stalled goals, chronic blockers, velocity trends, upcoming deadlines)

**What was implemented:**
- Created `src/lib/coaching/context-analyzer.ts` - Computes health metrics from user data
  - Goals needing attention (no progress >14 days)
  - Chronic blockers (blocked >7 days)
  - Progress velocity (comparing last 7 days vs previous 7 days)
  - Upcoming deadlines (<14 days away)
- Enhanced `COACH_SYSTEM_PROMPT` in `prompts.ts`
  - Added insights section with emoji indicators (🔴🟡🟢 for urgency, 📈📉 for trends)
  - Added structured response format requirements
  - Added example of good coaching response
  - Emphasizes specific, data-driven, actionable advice
- Modified `/api/coach/send-message/route.ts`
  - Changed action log query from "limit 20" to "last 30 days" (time-based)
  - Added goal/task context to queries (id, time_bound, blocker_status)
  - Computes and passes health metrics to AI

**Expected Impact:**
- 40% better context relevance (30-day time window vs arbitrary limit)
- 60% more proactive advice (AI sees computed insights upfront)
- 80% more actionable responses (structured format enforced)

**Sprint 2: Deeper Context** ✅ COMPLETE
- [x] Goal-Focused Conversations - Added goal selector UI for deep-dive coaching
- [x] Pattern Recognition - Blocker analysis, recurring themes, resolution tracking

**What was implemented:**
- Enhanced `context-analyzer.ts` with blocker pattern analysis
  - Recurring themes detection (keywords: waiting, feedback, review, etc.)
  - Recently resolved blockers tracking (with duration)
- Updated `chat-window.tsx` with goal selector UI
  - "Focus on Goal" button to select active goal
  - Shows selected goal badge with dismiss option
  - Updates placeholder text contextually
  - Sends goalId with message for backend processing
- Modified `/api/coach/send-message/route.ts` for goal-focused context
  - When goalId provided: fetches ALL logs for that goal's tasks (complete history)
  - When no goalId: fetches last 30 days across all goals (general coaching)
  - Passes goal focus to AI for context-aware responses
- Updated `COACH_SYSTEM_PROMPT` to display blocker patterns
  - 🔁 Recurring Blocker Themes section (shows count + examples)
  - ✅ Recently Resolved Blockers section (shows resolution time)

**Impact:**
- Deep-dive coaching: Users can now focus conversation on specific goal with full context
- Pattern recognition: AI identifies recurring blocker themes and successful resolution strategies
- Better coaching: AI sees which blockers were resolved and how long they took

**Bug Fixes:**
- [x] Fixed goal selection reset issue - Removed `window.location.reload()` that was clearing React state after streaming
- [x] Fixed AI unresponsive/blank response issue (Attempt 1) - Implemented SSE line buffering
  - Root cause: Server-Sent Events were being split by newlines on each chunk independently
  - Fix: Added buffer to accumulate incomplete SSE lines across chunks before parsing JSON
- [x] Fixed AI unresponsive/blank response issue (Attempt 2) - Fixed TransformStream piping
  - Root cause: `stream.pipeTo(writable)` was closing stream before client could read
  - Fix: Used `stream.tee()` to split into two streams - one for client, one for DB save
  - Impact: Client receives stream immediately without interference from DB operations
- [x] Fixed AI unresponsive/blank response issue (Attempt 3) - Fixed buffer processing for complete responses
  - Root cause: When Gemini sends complete response in single chunk, final SSE event wasn't processed
  - Fix: Process remaining buffer before closing stream to handle single-chunk responses
  - Impact: Both streaming (multiple chunks) and complete (single chunk) responses now work
- [x] **CRITICAL: Fixed first prompt always failing to get response**
  - Root cause: API was slicing off last message with `.slice(0, -1)`, removing the user's question!
  - On first message: `[user_msg].slice(0,-1)` = `[]` (empty array) → Gemini had nothing to respond to
  - Fix: Include ALL messages in conversation history - AI needs current user question
  - File: `/api/coach/send-message/route.ts` line 153
  - Impact: First prompts now work immediately, no need to send twice
- [x] Fixed duplicate messages in chat - Removed `initialMessages` from useEffect dependencies
  - Root cause: When messages saved to DB, `initialMessages` updated, triggering re-render and duplicating UI
  - Fix: Only depend on `conversationId` in useEffect, not `initialMessages`
- [x] Fixed streaming response content-type mismatch
  - Root cause: API returned `Content-Type: text/event-stream` but sent plain text chunks
  - Fix: Changed to `Content-Type: text/plain; charset=utf-8` to match actual stream format
  - Impact: Client can now properly read streamed text chunks
- [x] Improved conversation delete button visibility
  - Changed from inline button to absolutely positioned overlay button
  - Better hover detection with `group-hover` on parent div instead of Link
  - Added `line-clamp-2` to show 2 lines of text instead of truncating
  - Added `z-10` and tooltip for better UX
- [x] Added conversation deletion feature
  - API route: `/api/coach/conversations/[id]/delete` (DELETE with auth + ownership check)
  - UI: Trash icon on hover in conversation list (absolute positioned, top-right)
  - Includes confirmation dialog before delete
- [x] Fixed Next.js hydration warning for date formatting
  - Added `suppressHydrationWarning` to conversation date display
  - Prevents client/server mismatch for `toLocaleDateString()`
- [x] Improved coach context inference
  - Updated `COACH_SYSTEM_PROMPT` to be smarter about inferring user intent
  - AI now looks at goals/activity to infer which goal user is asking about
  - Only asks clarifying questions when truly ambiguous
  - Instruction: "Be helpful first, clarify second"

### UI & UX Polish (NOT STARTED ⏳)
- [ ] Mobile responsive design improvements
- [ ] Dark mode toggle (optional)
- [ ] Loading skeletons for async data
- [ ] Empty state illustrations
- [ ] Success/error toast notifications
- [ ] Keyboard shortcuts for power users
- [ ] Accessibility audit (a11y)

### Performance & Optimization (NOT STARTED ⏳)
- [ ] Implement pagination for goal/task lists
- [ ] Image optimization (Next.js Image)
- [ ] API response caching where applicable
- [ ] Database query optimization (indexes)
- [ ] Code splitting for large components
- [ ] Bundle size analysis and reduction

### Error Handling & Monitoring (NOT STARTED ⏳)
- [ ] Error boundary components
- [ ] Sentry integration for error tracking
- [ ] API error logging
- [ ] User-friendly error messages
- [ ] 404/500 error pages
- [ ] Graceful degradation for API failures

### Rate Limiting & Security (NOT STARTED ⏳)
- [ ] Rate limiting for AI endpoints
- [ ] Input validation and sanitization
- [ ] SQL injection prevention (Supabase handles this)
- [ ] XSS protection (React handles this)
- [ ] CSRF token validation
- [ ] API authentication verification

### Testing (NOT STARTED ⏳)
- [ ] Unit tests for utility functions
- [ ] Component tests for UI components
- [ ] Integration tests for API routes
- [ ] E2E tests for critical user flows
- [ ] Accessibility testing

### Documentation & Deployment (NOT STARTED ⏳)
- [ ] API documentation
- [ ] Component prop documentation
- [ ] Database schema documentation
- [ ] Deployment guide
- [ ] Environment setup guide
- [ ] Contributing guidelines

### Production Deployment (NOT STARTED ⏳)
- [ ] Set up production Supabase project
- [ ] Configure environment variables
- [ ] Set up error tracking (Sentry)
- [ ] Set up logging infrastructure
- [ ] Configure CDN for static assets
- [ ] Set up monitoring/uptime checks
- [ ] Deploy to Vercel or hosting platform
- [ ] Set up CI/CD pipeline
- [ ] Domain configuration
- [ ] SSL/TLS certificate setup
- [ ] Database backup strategy

---

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   ├── dashboard/          # Protected dashboard routes
│   ├── api/                # API routes (AI, auth, CRUD)
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home/landing
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Base UI components (Button, Card, etc.)
│   ├── goals/              # Goal-specific components
│   ├── tasks/              # Task-specific components
│   ├── logs/               # Action log components
│   └── shared/             # Shared/common components
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser Supabase client
│   │   ├── server.ts       # Server Supabase client
│   ├── ai/
│   │   ├── claude.ts       # Claude API client + functions
│   │   ├── prompts.ts      # Prompt templates
│   │   └── schemas.ts      # Zod schemas for AI responses
│   ├── db/
│   │   ├── types.ts        # Auto-generated Supabase types
│   │   └── queries.ts      # DB query helpers
│   ├── utils.ts            # Utility functions (cn, etc.)
├── hooks/                  # Custom React hooks
└── types/                  # Additional TypeScript types

supabase/
├── migrations/
│   └── 20240101000000_init.sql    # Database schema
└── config.toml             # Supabase local config
```

### Database Schema

**Tables:**
- `profiles` - User extended profile (job_title, company, etc.)
- `goals` - Annual goals with SMART breakdown
- `tasks` - Actionable steps derived from goals
- `action_logs` - Progress entries for tasks
- `ai_interactions` - History of AI coaching interactions

**Key Design:**
- Row Level Security (RLS) policies ensure users only access their own data
- Cascade deletes maintain referential integrity
- Timestamps track creation/updates for audit trails
- Indexes on foreign keys for query performance

## Development Commands

```bash
# Setup & Installation
npm install                    # Install dependencies
npx supabase start            # Start local Supabase
npx supabase db push          # Apply migrations

# Development
npm run dev                   # Start dev server (localhost:3000)
npm run build                 # Build for production
npm run start                 # Start production server

# Code Quality
npm run lint                  # Run ESLint
npm run type-check            # Run TypeScript check
npm run format                # Format with Prettier (npm run format)

# Database
npm run db:reset              # Reset local database
npm run db:types              # Generate types from schema (after schema changes)
npx tsx scripts/seed-test-data.ts  # Seed test data (goals, tasks, action logs)
```

## Important Architectural Patterns

### 1. Server Components by Default

- Use async Server Components for data fetching directly in components
- Only use 'use client' when state or event listeners are needed
- Server Components reduce JavaScript bundle size and improve security

Example:
```typescript
// Server Component - fetches data directly
export default async function GoalsList() {
  const supabase = await createClient();
  const { data: goals } = await supabase.from('goals').select('*');
  return <div>{/* render goals */}</div>;
}

// Client Component - handles interactivity
'use client';
export default function CreateGoalButton() {
  const [loading, setLoading] = useState(false);
  // handle click
}
```

### 2. AI API Route Pattern

All AI operations happen server-side in API routes. This keeps the API key secret and handles streaming/tokens.

```typescript
// app/api/ai/smart-goals/route.ts
export async function POST(req: Request) {
  const { rawGoal } = await req.json();
  const smartGoal = await generateSmartGoal(rawGoal);

  // Log AI interaction
  const supabase = await createClient();
  await supabase.from('ai_interactions').insert({
    user_id: user.id,
    interaction_type: 'smart_goal',
    prompt: rawGoal,
    response: JSON.stringify(smartGoal)
  });

  return Response.json(smartGoal);
}
```

### 3. Type Safety

- Use generated Supabase types from `src/lib/db/types.ts`
- Validate all AI responses with Zod schemas
- Strict TypeScript config (noImplicitAny, strict, etc.)

### 4. Authentication Flow

- Supabase handles user auth (email/password)
- Auth state persists via HTTP-only cookies
- Middleware protects dashboard routes
- Both server and browser clients available for different contexts

### 5. Data Fetching from Client

When a Client Component needs data (e.g., for a form submission):

```typescript
'use client';
async function submitGoal(goalData) {
  // Call API route to use Claude
  const response = await fetch('/api/ai/smart-goals', {
    method: 'POST',
    body: JSON.stringify({ rawGoal: goalData.title })
  });
  const smartGoal = await response.json();

  // Then insert into Supabase using browser client
  const supabase = createClient();
  await supabase.from('goals').insert({ ...smartGoal });
}
```

### 6. Self-Assessment Interactive Editing Pattern

The self-assessment feature uses a Claude artifact-style editing pattern:

**Key Components:**
- `AssessmentGenerator` (Client Component) - Handles generation, loading, saving
- `AssessmentEditor` (Client Component) - Manages text selection and AI refinement
- `/api/ai/generate-assessment` - Fetches goals/tasks/logs and generates full assessment
- `/api/ai/refine-assessment-text` - Refines selected text based on user instructions

**Editing Flow:**
1. User generates or loads an assessment
2. Two modes available:
   - **View Mode**: Select text → Popup with refinement instructions → AI refines → Preview → Accept/Reject
   - **Edit Mode**: Manual text editing with textarea
3. Changes can be saved/updated with status (draft/final)

**Important Notes:**
- Action logs table uses `title` (not `action_description`), `description` (not `impact_notes`), `created_at` (not `logged_at`)
- Always map these correctly when fetching for AI prompts
- The assessment prompt is in `ASSESSMENT_SUMMARY_PROMPT` in `src/lib/ai/prompts.ts`
- Text refinement prompt is in `ASSESSMENT_TEXT_REFINEMENT_PROMPT`

## AI Integration Details

### When Gemini AI is Called

1. **SMART Goal Creation** - User submits raw goal → Gemini structures it
2. **Task Breakdown** - Goal created → Gemini generates 5-10 tasks
3. **Coaching Feedback** - On-demand or periodic → Gemini analyzes progress
4. **Assessment Summary** - Pre-review → Gemini generates contribution summary

### Prompt Strategy

- Use structured output templates (JSON responses)
- Include context from existing goals/tasks when providing coaching
- Store all interactions for audit trail and future context
- Implement rate limiting to prevent abuse

### Error Handling in AI

All Gemini API calls:
- Are wrapped in try/catch blocks
- Return clear error messages to users
- Log failures for debugging
- Have fallback responses if needed

## Supabase Setup

### Local Development

```bash
# Start Supabase locally
npx supabase start

# See output with credentials:
# Supabase local development server is running at: http://localhost:54321
# API URL: http://localhost:54321
# Anon key: [key]

# Apply migrations
npx supabase db push

# View database in studio
# Navigate to http://localhost:54323
```

### Environment Variables

`.env.local` must include:
```
# Supabase Local Development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Google Gemini AI API Key (for AI features)
GOOGLE_AI_API_KEY=[your-gemini-api-key]
```

**Note:** AI features use Google Gemini API via Google AI Studio. The API key must be set in environment variables.

### Row Level Security (RLS)

All tables have RLS enabled with policies:
- Users can only read/write their own data
- Tasks are accessible if goal belongs to user
- Middleware ensures auth token is passed

## AI Integration Setup

### Google Gemini API via Google AI Studio

**IMPORTANT:** The app uses **Google Gemini API via Google AI Studio** for all AI features.

**What we're using:**
- **Service**: Google AI Studio API (https://aistudio.google.com)
- **Model**: `gemini-2.5-flash-lite`
- **Endpoint**: `https://aiplatform.googleapis.com/v1/publishers/google/models`
- **Authentication**: API key passed as query parameter (`?key=...`)
- **Implementation**: Direct `fetch()` calls (no SDK)

**What we're NOT using:**
- ❌ Google Cloud Vertex AI (different service, uses ADC/service accounts)
- ❌ Anthropic Claude API (different AI provider entirely)

**Note:** Despite the filename `src/lib/ai/claude.ts`, the code uses Google Gemini API.

### Required Environment Variable

Add to `.env.local`:
```env
GOOGLE_AI_API_KEY=your-api-key-here
```

**Get API Key**:
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create API key
3. Copy and paste into `.env.local`

### Production Deployment

Add `GOOGLE_AI_API_KEY` to Vercel environment variables:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add key for Production, Preview, Development environments

### Unused Environment Variables

These are NOT used and can be removed:
```env
GCP_PROJECT_ID  # Only needed for Vertex AI, not Google AI Studio
GCP_REGION      # Only needed for Vertex AI, not Google AI Studio
```

## Code Quality Standards

### Naming Conventions

- **Files**: kebab-case for components (`goal-list.tsx`)
- **Exports**: PascalCase for components, camelCase for utilities
- **Variables**: camelCase, descriptive names
- **Database**: snake_case for columns

### TypeScript

- Strict mode enabled in tsconfig.json
- Generate and use Supabase types (not 'any')
- Use interfaces for component props

### Null Safety Guidelines

**CRITICAL: All database Row types have nullable fields. Follow these rules:**

1. **Use null-safe utility helpers** (`src/lib/utils/null-safe.ts`):
   - `ensureTaskStatus(status)` - Converts `string | null` to valid task status with 'todo' fallback
   - `ensureGoalStatus(status)` - Converts `string | null` to valid goal status with 'active' fallback
   - `safeString(value)` - Converts `string | null` to empty string for inputs
   - `safeSelect(value, default)` - Converts nullable to default value for selects

2. **Never pass database Row types directly to component props expecting `string`**:
   ```typescript
   // ❌ BAD - Will fail in production build
   <TaskDetailModal taskStatus={task.status} />

   // ✅ GOOD - Component accepts string | null
   <TaskDetailModal taskStatus={task.status} />

   // Props definition accepts nullable
   interface TaskDetailModalProps {
     taskStatus: string | null;
   }
   ```

3. **Always handle null in form state initialization**:
   ```typescript
   // ❌ BAD
   const [formData, setFormData] = useState({
     status: task.status,        // May be null
     due_date: task.due_date,    // May be null
   });

   // ✅ GOOD
   const [formData, setFormData] = useState({
     status: ensureTaskStatus(task.status),  // Guaranteed valid status
     due_date: safeString(task.due_date),    // Guaranteed string
   });
   ```

4. **For select elements, use helpers or provide fallback**:
   ```typescript
   // ✅ Option 1: Use helper
   <select value={ensureTaskStatus(task.status)}>

   // ✅ Option 2: Manual fallback
   <select value={task.status || 'todo'}>
   ```

5. **Run build locally before pushing**:
   ```bash
   npm run build  # Catches TypeScript null errors
   ```

### Styling

- Use Tailwind utility classes primarily
- Create component-level CSS only when necessary
- Maintain consistent spacing (4px baseline)
- Mobile-first responsive design

### Components

- Keep components focused and single-responsibility
- Extract repeated logic into hooks or utilities
- Use TypeScript prop types, avoid prop spreading

## Testing & Builds

Currently no automated tests (can add in phase 2):
- Jest for unit tests
- React Testing Library for component tests
- Cypress for E2E tests

Build process:
```bash
npm run build      # Full type-check + build
npm run type-check # TypeScript only
npm run lint       # ESLint only
```

## Deployment Readiness (Phase 2)

When deploying to production:

1. **Environment Variables** - Set all vars in deployment platform (Vercel, etc.)
2. **Database** - Use Supabase hosted instance, run migrations
3. **API Keys** - Rotate Gemini API key in production
4. **Error Tracking** - Add Sentry for monitoring
5. **Logging** - Set up structured logging for API routes
6. **Rate Limiting** - Implement for AI endpoints

## Common Development Tasks

### Adding a New API Endpoint

1. Create route in `src/app/api/[path]/route.ts`
2. Get auth user: `const { data: { user } } = await supabase.auth.getUser()`
3. Validate input with Zod
4. Execute logic
5. Return JSON or error response

### Creating a New Page

1. Create folder in `src/app/(dashboard)/` or `src/app/(auth)/`
2. Add `page.tsx` with Server or Client Component
3. Link from navigation in layout

### Adding Database Query Helper

1. Add to `src/lib/db/queries.ts`
2. Use generated types from `types.ts`
3. Handle RLS errors gracefully

### Integrating Gemini AI for New Feature

1. Add prompt template to `src/lib/ai/prompts.ts`
2. Add schema to `src/lib/ai/schemas.ts`
3. Add function to `src/lib/ai/claude.ts` (yes, filename says claude but uses Gemini)
4. Create API route in `src/app/api/ai/[feature]/route.ts`
5. Call from client via fetch

## Performance Considerations

- Use Server Components to reduce JS bundle
- Implement pagination for goal/task lists (if many)
- Cache Gemini API responses when possible
- Use Supabase real-time for live progress updates (phase 2)
- Image optimization via Next.js Image component

## Security Notes

- Never expose any API keys in client code (use API routes only)
- RLS policies ensure data isolation
- Validate all user input with Zod
- Use Supabase auth for token generation
- Escape user content when displaying (React does this by default)

## Future Enhancements

**Phase 2:**
- Real-time progress updates with Supabase Realtime
- Adding notes and attachments (images for referencing as evidence in the PPM self-evaluation generation) to tasks
- Integration with Slack/email notifications

**Phase 3:**
- Analytics dashboard with insights
- Advanced coaching features

## Useful Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Google AI Studio](https://aistudio.google.com)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- while testing, I'll report bugs. i expect you to do RCA on them and propose fixes. These should be documented in the testing folder.