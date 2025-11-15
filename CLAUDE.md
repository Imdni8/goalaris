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
- **AI**: Anthropic Claude Sonnet 4.5 (via Google Cloud Vertex AI)
- **UI**: Shadcn/ui components + Radix UI primitives
- **Forms**: react-hook-form + Zod validation
- **Styling**: Tailwind CSS utility-first

## Development Status

**Phase 1: Foundation** ✅ COMPLETE
**Phase 2: Core CRUD** ✅ COMPLETE
**Phase 3: AI Integration** ✅ COMPLETE (Switched from Anthropic API to Google Cloud Vertex AI for Claude access)
**Phase 4: Progress Tracking** ⏳ IN PROGRESS
**Phase 5: Insights & Export** ⏳ NOT STARTED
**Phase 6: Optimization & Deploy** ⏳ NOT STARTED

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
- [x] Claude prompt template for SMART goal structuring
- [x] Zod schema for validating AI response
- [x] UI form for AI goal input (2-step: input → review)
- [x] Log AI interactions to database
- [x] Error handling for API calls
- [x] Update goals list to show "✨ AI" badge for AI-generated goals

### AI Features - Task Breakdown (COMPLETED ✅)
- [x] API route for generating task breakdown from goal
- [x] Claude prompt template for task generation
- [x] Zod schema for validating task list response
- [x] Button on goal detail to trigger AI task generation
- [x] Insert generated tasks into database with proper ordering
- [x] Log AI interactions to database
- [x] Error handling and user feedback

### Progress Tracking - Action Logs (IN PROGRESS ⏳)
- [ ] Create action log form component
  - Fields: title, description, blockers, task_id reference
  - Status indicators (on_track, at_risk, blocked)
- [ ] Action log list/timeline view
  - Sort by date (newest first)
  - Filter by task or status
  - Show task context
- [ ] API route for creating action logs
- [ ] API route for updating action logs
- [ ] API route for deleting action logs
- [ ] Database queries for fetching action logs
- [ ] Link action logs to tasks (foreign key)
- [ ] Update task detail page to show related action logs

### Progress Tracking - Blocker Management (IN PROGRESS ⏳)
- [ ] Blocker input field in action log form
- [ ] Blocker status tracking (active/resolved)
- [ ] Blocker list view with filtering
- [ ] Mark blocker as resolved
- [ ] AI suggestion for unblocking strategies (optional)
- [ ] Blocker count badge on goal card

### Progress Visualization (IN PROGRESS ⏳)
- [ ] Task completion percentage chart per goal
- [ ] Timeline view of action logs
- [ ] Progress indicators (on_track vs at_risk vs blocked)
- [ ] Heatmap of activity by date
- [ ] Goal progress dashboard widget
- [ ] Export progress chart as image (optional)

### AI Features - Insights & Coaching (NOT STARTED ⏳)
- [ ] API route for coaching feedback
  - Input: goal + action logs
  - Output: personalized coaching suggestions
- [ ] Claude prompt template for coaching
- [ ] Coaching feedback display on goal page
- [ ] Coaching history view
- [ ] Rate limiting for coaching API

### AI Features - Self-Assessment Generation (NOT STARTED ⏳)
- [ ] API route for self-assessment summary
  - Input: goal + all action logs
  - Output: narrative summary for performance review
- [ ] Claude prompt template for self-assessment
- [ ] Self-assessment view/modal
- [ ] Edit/customize generated assessment
- [ ] Save assessment versions

### Data Export (NOT STARTED ⏳)
- [ ] Export goal summary as PDF
- [ ] Export self-assessment as PDF/Word
- [ ] Export action logs timeline as CSV
- [ ] Email export functionality (optional)

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

## AI Integration Details

### When Claude is Called

1. **SMART Goal Creation** - User submits raw goal → Claude structures it
2. **Task Breakdown** - Goal created → Claude generates 5-10 tasks
3. **Coaching Feedback** - On-demand or periodic → Claude analyzes progress
4. **Assessment Summary** - Pre-review → Claude generates contribution summary

### Prompt Strategy

- Use structured output templates (JSON responses)
- Include context from existing goals/tasks when providing coaching
- Store all interactions for audit trail and future context
- Implement rate limiting to prevent abuse

### Error Handling in AI

All Claude API calls:
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

# Google Cloud Vertex AI Configuration (for AI features)
GCP_PROJECT_ID=[your-gcp-project-id]
GCP_REGION=[gcp-region-with-vertex-ai]
```

**Note:** AI features use Google Cloud Vertex AI with Claude models via Application Default Credentials (ADC). No API key is stored in `.env.local`.

### Row Level Security (RLS)

All tables have RLS enabled with policies:
- Users can only read/write their own data
- Tasks are accessible if goal belongs to user
- Middleware ensures auth token is passed

## Google Cloud Vertex AI Setup

### Initial Setup (One-time)

1. **Install Google Cloud SDK:**
   ```bash
   brew install google-cloud-sdk
   ```

2. **Set up Application Default Credentials (ADC):**
   ```bash
   gcloud auth application-default login
   ```
   This opens a browser for authentication and saves credentials to `~/.config/gcloud/application_default_credentials.json`

3. **Enable Vertex AI API** in [Google Cloud Console](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com):
   - Go to APIs & Services > Library
   - Search for "Vertex AI API"
   - Click "Enable" for your GCP project

4. **Add environment variables** to `.env.local`:
   ```
   GCP_PROJECT_ID=your-project-id
   GCP_REGION=region-with-vertex-ai  # e.g., asia-south1, us-east5
   ```

### How It Works

- The app uses `@anthropic-ai/vertex-sdk` for Claude API access via Google Cloud
- Authentication happens via ADC (Application Default Credentials) - no API keys needed in `.env.local`
- All Claude calls in `src/lib/ai/claude.ts` automatically use the authenticated Vertex AI client
- Supports same Claude models as direct API with same function signatures

### Available Regions with Claude

Check [Vertex AI documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models) for current Claude availability. Common regions:
- `asia-south1` (Mumbai)
- `us-east5` (New Jersey)
- `us-central1` (Iowa)

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
3. **API Keys** - Rotate Claude API key in production
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

### Integrating Claude for New Feature

1. Add prompt template to `src/lib/ai/prompts.ts`
2. Add schema to `src/lib/ai/schemas.ts`
3. Add function to `src/lib/ai/claude.ts`
4. Create API route in `src/app/api/ai/[feature]/route.ts`
5. Call from client via fetch

## Performance Considerations

- Use Server Components to reduce JS bundle
- Implement pagination for goal/task lists (if many)
- Cache Claude prompts when possible
- Use Supabase real-time for live progress updates (phase 2)
- Image optimization via Next.js Image component

## Security Notes

- Never expose ANTHROPIC_API_KEY in client code (use API routes only)
- RLS policies ensure data isolation
- Validate all user input with Zod
- Use Supabase auth for token generation
- Escape user content when displaying (React does this by default)

## Future Enhancements

**Phase 2:**
- Real-time progress updates with Supabase Realtime
- Collaborative goal sharing
- Goal templates and marketplace
- Integration with Slack/email notifications

**Phase 3:**
- Analytics dashboard with insights
- Team/org features
- Advanced coaching features
- Mobile app (React Native/Expo)

## Useful Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Anthropic Claude Docs](https://docs.anthropic.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
