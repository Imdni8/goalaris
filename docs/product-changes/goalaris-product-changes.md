# Goalaris Product Requirements Document (PRD)

## Product Overview

Goalaris is an AI-powered career coaching platform for working professionals at MNCs. It helps users track annual goals, get coaching, and auto-generate performance review self-assessments.

**Pricing:** INR 199/month or INR 1000/year

---

## Product Changes

### PC-1: User Profile & Onboarding

**Problem:** The AI coach currently lacks persistent context about the user — their role, team, company structure, and career aspirations. This forces the user to provide context repeatedly and limits the quality of coaching and goal suggestions.

**Solution:** Introduce a structured onboarding flow that collects key profile data upfront. This data is stored in the user profile, accessible to the AI coach in every interaction, and editable anytime from settings.

**Data collected during onboarding:**

- Name
- Current role/title
- Team/department
- Company name
- Company's review cycle timing (e.g., Q4 annual, mid-year check-in)
- Career goal — where they want to be in 1-2 years (e.g., "get promoted to Staff Engineer", "move into people management")
- Key skills they want to develop

**Behavior:**

- Onboarding is a short conversational flow (not a form), consistent with the conversational goal-setting approach
- All fields editable anytime via Profile/Settings
- AI coach references this data in goal suggestions, coaching nudges, and self-assessment generation
- Career goal is surfaced as context whenever the AI coaches the user — e.g., "This goal aligns with your aim to move into management"

---

### PC-2: Conversational Goal Setting

**Problem:** Current form-based goal creation puts the burden on users to provide enough context. Users give vague inputs, leading to poor first drafts.

**Solution:** Replace form-based goal creation with an AI-guided conversation. The AI coach already knows the user's profile (PC-1) and asks 3-5 targeted clarifying questions to co-create a SMART goal.

**Flow:**

1. User initiates "Add Goal"
2. AI greets with context: "You mentioned wanting to move into management. What area do you want to focus on this quarter?"
3. AI asks clarifying questions (scope, metrics, timeline, dependencies)
4. AI generates a structured SMART goal draft
5. User reviews, can request edits via conversation
6. User approves → goal is saved → user is redirected to the goal details page (PC-4)

**Constraints:**

- Max 5 clarifying questions to avoid interview fatigue
- User can skip conversation and write a goal manually at any point
- Conversation history for each goal is saved for context

---

### PC-3: Monthly Task Generation on Goal Approval

**Problem:** Generating all tasks upfront for a multi-month goal creates an overwhelming, abstract backlog. Tasks 3 months out feel irrelevant, and their accuracy degrades because the AI lacks context on how earlier work went.

**Solution:** On goal approval, AI generates tasks for the **current month only**, distributed across weeks (Week 1–4). Future months are generated one at a time via a coach-guided check-in (see PC-7).

**Task properties:**

- Title
- Due date (specific day, within the current month)
- Parent goal
- Status: pending / done / dropped
- Optional completion note (see PC-8)
- Reschedule count (internal, tracks how many months a task has been carried forward)
- `is_manual: boolean` (default false)
- `month: string` (e.g., "2026-03") — the month this task belongs to

**On goal approval:**

1. AI generates 5–10 tasks for the current calendar month
2. Each task is assigned a specific due date within that month
3. Tasks are grouped by week (Week 1–4) on the goal details page
4. User is redirected to the goal details page to see their tasks

**User control over tasks (current month only):**

- Users can manually add tasks — only to the current active month
- Users can edit any task (title, due date within the month)
- Users can delete any task
- Users can regenerate AI tasks for the current month (manually added tasks are preserved)

---

### PC-4: Goal Details Page as Post-Goal Landing

**Problem:** After creating a goal, users had no clear "what's next" moment. Tasks were buried, and there was no natural place to see a goal's full picture over time.

**Solution:** After goal approval, user lands on the **goal details page**. This page is organized by month tabs showing tasks grouped by week. It becomes the primary view for a single goal's progress, while the weekly planner homepage (PC-5) remains the cross-goal daily view.

**Layout:**

- **Left sidebar:** Goal card (title, SMART criteria — collapsible), status badge (Active), Edit/Details actions, Attachments section
- **Main area:** Tasks view with month tab navigation
- **Right edge:** Coach side panel toggle ("> coach" / "< coach")

**Month tab behavior:**

- Only **current month + completed past months** are shown as tabs
- Future months are hidden (not grayed out — completely absent)
- Current month tab is selected by default
- Past month tabs show completed tasks (read-only)
- Navigating to a past month shows its tasks in their final state

**Week grouping within a month:**

- Tasks within each month tab are organized under Week 1, Week 2, Week 3, Week 4 headers
- Tasks appear under the week their due date falls into

---

### PC-5: Homepage — 5-Column Weekly Planner

**Problem:** Users need a reason to return to the app weekly. Current homepage doesn't provide an actionable at-a-glance view.

**Solution:** Redesign homepage as a Monday–Friday day view. Each column shows tasks from ALL goals for that day. This is the default landing screen.

**Behavior:**

- 5 columns: Mon, Tue, Wed, Thu, Fri
- Each column shows date and all tasks due that day
- Tasks are color-coded by goal
- Tasks can be checked off directly from this view
- Users can navigate to previous/future weeks
- Default view is always the current week

---

### PC-6: Tasks Scoped to Monthly Generation

**Problem:** Generating all tasks at goal creation means the AI is guessing about work 3–6 months out without knowing how the first month went. This leads to irrelevant tasks and a disconnected experience.

**Solution:** Tasks exist in monthly scopes. Each month's tasks are generated fresh by the AI coach with full context of what happened in prior months. Within each month, tasks are displayed grouped by week.

**Behavior:**

- On goal approval: AI generates tasks for current month only
- Future months have no tasks until explicitly generated
- Within each month, tasks display under Week 1–4 headers based on due dates
- The weekly planner homepage (PC-5) pulls tasks from the current month across all goals

**Month unlocking rules:**

- A new month's tasks can be generated when **either**:
  - All tasks in the current month are resolved (done or dropped), **or**
  - The calendar month naturally arrives (i.e., it's now April, so April's tasks can be generated even if March has pending items)
- When the next month is available for generation, the goal details page shows a prompt on the new month tab: _"Generate tasks for this month. You can give coach more context based on your experience so far to help them customise tasks better for you."_
- A text input field + "Generate" button appears below the prompt
- Clicking "Generate" opens the **coach side panel** for a guided monthly check-in (see PC-7)

---

### PC-7: Monthly Coach Check-in

**Problem:** Tasks accumulate silently across weeks, creating a demoralizing backlog. Monthly boundaries are a natural cadence for recalibration.

**Solution:** When the user generates tasks for a new month, the AI coach opens a guided conversation in the side panel. The coach reviews the previous month, resolves any pending tasks collaboratively, and then generates contextually accurate tasks for the new month.

**Trigger:** User clicks "Generate" on the new month's tab in the goal details page.

**Coach side panel conversation flow:**

1. **Review previous month:** Coach summarizes what was completed, what's still pending, and overall progress toward the goal.

2. **Resolve pending tasks (if any):** For each pending task from the previous month, the coach and user collaboratively decide:
   - **Carry forward** to the new month (task moves to new month with incremented reschedule count)
   - **Break down** into smaller, more actionable tasks for the new month
   - **Drop** — no longer relevant (marked as dropped, preserved for audit trail)
   - **Other** — user can explain their situation in free text, coach suggests appropriate action

3. **Context gathering:** Coach asks if anything has changed — new priorities, blockers, learnings from last month — that should shape this month's tasks.

4. **Generate new month's tasks:** Based on the goal, resolved pending items, and new context, AI generates tasks for the new month distributed across Week 1–4.

5. **Tasks appear** on the goal details page under the new month tab.

**Escalating tone for carried-forward tasks:**

- `reschedule_count = 0`: Normal tone, carry-forward is presented as a reasonable option
- `reschedule_count = 1`: Mild flag — "This was carried over from last month already."
- `reschedule_count >= 2`: Urgent tone — "⚠️ This task has been pending for N months. Let's either break it down into something more actionable, rethink the approach, or drop it if it's no longer relevant." Break-down is highlighted as the recommended action; carry-forward is dimmed with "(this will be carry-forward #N)"

**After 2+ carry-forwards,** coach proactively drives toward resolution: "This has been sitting for N months — that's a signal. What's actually blocking this?"

**Key design principle:** This is a collaborative conversation, not a rigid wizard. The coach guides but the user can steer. Free-text input is always available. The coach adapts suggestions based on what the user says.

---

### PC-8: Progress Logs — Optional, Reduced Emphasis

**Problem:** Mandatory progress logging adds friction to a tool meant to reduce it. But without any logging, self-assessments lack raw material.

**Solution:** Progress logs remain but are optional and low-friction. Tasks are primarily check-off (done/not done). An optional completion note is prompted on task completion.

**Behavior:**

- When user checks off a task, a subtle prompt appears: "Quick note on what you did?" (dismissable)
- Notes are stored and used by AI for self-assessment generation
- No progress log required for task completion
- Progress log feature still available for users who want detailed tracking (accessible from task detail, not prominent in main flow)

---

### PC-9: Attachment Uploads

**Problem:** Self-assessments lack concrete evidence. Screenshots of praise, metrics dashboards, and testimonials exist on user devices but aren't connected to goals.

**Solution:** Add upload capability for attachments tied to goals.

**Behavior:**

- Users can upload images, PDFs, screenshots to any goal
- Upload option surfaces within the task completion flow ("Attach evidence?") and on goal detail page
- AI uses attachment content (via OCR/image analysis) when generating self-assessments
- Example use: screenshot of a Slack message praising the user, metrics dashboard, client testimonial

---

### PC-10: Goals Page UI Refresh + Multi-Select & Bulk Delete

**Problem:** The goals page currently shows goals as a simple list/grid that doesn't scale well as users accumulate goals across months. There's also no efficient way to clean up obsolete or test goals — users have to delete them one at a time, which is tedious during pruning or end-of-cycle cleanup.

**Solution:** Refresh the goals page UI for better hierarchy, scannability, and density, and introduce a multi-select mode that allows users to delete several goals in a single action.

**UI improvements:**

- Cleaner card design consistent with the goal details page (PC-4) — goal number eyebrow, title, status chip, due/time-bound info
- Better visual grouping by status (Active, Completed, Archived) with collapsible sections
- Improved empty state and loading skeletons
- Sort/filter controls (by status, by created date, by goal number)
- Hover/focus states reveal quick actions (open, edit, delete) without crowding the resting card

**Multi-select behavior:**

- "Select" mode toggle in the page header enters selection mode
- Each goal card shows a checkbox in selection mode
- Selecting one or more goals reveals a sticky action bar with the count and a "Delete selected" button
- "Delete selected" opens a confirmation dialog listing the goals being deleted (titles + count)
- On confirm: cascade-delete goals and their tasks/logs/attachments per existing referential integrity rules
- "Cancel" exits selection mode and clears selection
- Keyboard accessible: Space toggles selection, Esc exits selection mode

**Constraints:**

- Deletion is permanent (no soft-delete in this iteration); the confirmation dialog must make the destructive nature clear
- Selection state is local to the page (does not persist across navigation)
- Bulk delete uses a single API call (not N individual deletes) to keep the operation atomic and fast

---

## Implementation Plan

This plan is structured for sequential implementation with Claude Code. Each phase builds on the previous one. Phases are ordered by dependency and user impact.

**Phases 1 and 2 are already implemented.**

### Phase 1: Data Model & User Profile (PC-1) ✅ DONE

**Goal:** Establish the foundation — user profile schema and onboarding flow.

**Tasks:**

1. Define user profile schema:
   - `name: string`
   - `role: string`
   - `team: string`
   - `company: string`
   - `review_cycle: string` (e.g., "Q4 annual", "bi-annual")
   - `career_goal: text`
   - `skills_to_develop: string[]`
   - `created_at, updated_at: timestamp`

2. Create profile settings page — form-based edit for all profile fields

3. Build onboarding flow:
   - Conversational UI (reusable chat component)
   - 5-7 step flow collecting profile data
   - Skip option at each step
   - Save to user profile on completion
   - Flag `onboarding_completed: boolean` on user record

4. Gate main app behind onboarding for new users

**Acceptance criteria:**
- New user sees onboarding on first login
- Profile data persists and is editable from settings
- Existing users see a prompt to complete their profile (not blocking)

---

### Phase 2: Task Data Model Refactor (PC-3, PC-6) ✅ DONE

**Goal:** Restructure tasks to support monthly scoping, weekly grouping, manual tasks, and reschedule tracking.

**Tasks:**

1. Update task schema:
   - `id: uuid`
   - `goal_id: foreign key`
   - `title: string`
   - `due_date: date`
   - `month: string` (e.g., "2026-03") — the month scope this task belongs to
   - `status: enum (pending, done, dropped)`
   - `completion_note: text (nullable)`
   - `reschedule_count: integer (default 0)` — tracks monthly carry-forwards
   - `is_manual: boolean (default false)`
   - `created_at, updated_at: timestamp`
   - `completed_at: timestamp (nullable)`

2. Add goal-level month tracking:
   - `goal.current_month: string` — the active month for task generation
   - `goal.months_generated: string[]` — list of months that have had tasks generated

3. Migrate existing tasks to new schema (assign `month` based on due_date, set reschedule_count to 0)

4. Update task CRUD API:
   - Create (manual task creation — restricted to current active month)
   - Update (edit title, due_date within the month)
   - Delete
   - Regenerate (for a given goal + month, regenerate AI tasks; preserve manual tasks)

5. Update AI task generation:
   - Accept `month` parameter — generate tasks for that month only
   - Assign specific due dates distributed across Week 1–4 of that month
   - Accept optional context string (user input from generation prompt)

6. Month unlock logic:
   - Check if all tasks in current month are resolved (done/dropped) → unlock next month
   - Check if calendar has advanced past current month → unlock next month
   - Return unlock status via API for frontend to show/hide generation prompt

**Acceptance criteria:**
- Tasks have due dates and month scope
- Users can add/edit/delete/regenerate tasks within current month only
- Manual tasks survive regeneration
- Reschedule count tracks carry-forwards correctly
- Month unlock logic works for both conditions (all resolved OR calendar advance)

---

### Phase 3: Homepage — Weekly Planner (PC-5) + Goal Details Page (PC-4)

**Status: ✅ PC-4 COMPLETE | ⏳ PC-5 NEXT**

**Goal:** Build both the cross-goal weekly planner homepage and the single-goal details page with month tabs.

#### PC-4: Goal Details Page ✅ COMPLETE (2026-04-18)

**Completion Date:** 2026-04-18

**What's implemented:**
- ✅ Goal details page as post-goal landing screen
- ✅ Month tab navigation (current + completed past months only; future months hidden)
- ✅ Week grouping (Week 1–4) within each month
- ✅ Task cards with title, due date, status
- ✅ Task check-off interaction (toggle done/pending, updates DB optimistically)
- ✅ Read-only view for past months (tasks cannot be edited)
- ✅ Sidebar with goal card (Variant A redesign, see details below)
- ✅ Sticky card stack (goal card + attachments card together)
- ✅ Coach side panel toggle (UI present, PC-7 implementation pending)
- ✅ Auto-generation of tasks for current month on goal approval
- ✅ Post-goal-creation redirect to goal details page working

**Goal Card Redesign (Variant A):**
- ✅ New layout: Goal number eyebrow ("GOAL 01") + wrapped title + status chip + details link
- ✅ Edit button hidden by default, appears on hover/focus with fade transition (120ms)
- ✅ Separate attachments card below main card (not nested)
- ✅ Status-aware chip colors: green for active/completed (#d8ecdf bg, #2f7a54 text), grey for archived
- ✅ Added `goal_number` DB column with per-user sequential numbering
- ✅ Keyboard accessible: Enter/Space opens read-only modal
- ✅ Proper spacing and sticky positioning

**Database additions:**
- ✅ Migration: `20260418000000_add_goal_number.sql` — added goal_number column
- ✅ Backfill: existing goals assigned sequential numbers per user
- ✅ Goal creation updated to auto-compute next goal_number on insert

**Key commits:**
- `8cbaeee` — Redesign goal card sidebar (Variant A) and add goal_number
- `583fb16` — Update page title from 'Create Goal with AI' to 'Review Goal'
- `80c6b8c` — Fix ESLint error: escape apostrophe in JSX text

**Testing:** End-to-end flow verified locally (goal creation → review → details page). Deployed to production via Vercel.

---

#### PC-5: Homepage Weekly Planner ⏳ READY TO START

**What's needed:**
1. Build 5-column week view component (homepage):
   - Mon–Fri columns with date headers
   - Tasks grouped by day across all goals (from current month's tasks)
   - Goal color-coding on task chips
   - Check-off interaction directly in the view

2. Week navigation:
   - Left/right arrows to browse weeks
   - "Today" button to snap back to current week
   - Visual indicator for current day

3. Task completion flow:
   - Checkbox toggles task to done
   - Optional completion note prompt (small inline input, dismissable)
   - Task visually dims/crosses out on completion

4. Month generation prompt (for PC-4 goal details):
   - When next month is unlocked, show prompt on new month tab area
   - Text: "Generate tasks for this month. You can give coach more context based on your experience so far to help them customise tasks better for you."
   - Free-text input field + "Generate" button
   - "Generate" click triggers coach side panel (Phase 5)

5. Restructure navigation:
   - Homepage = weekly planner (default)
   - Sidebar/nav shows goals list
   - Goal detail page accessible from task chip or sidebar

**Acceptance criteria:**
- Homepage shows current week's tasks across all goals
- Users can check off tasks and optionally add notes
- Week navigation works correctly
- Month generation prompt appears when next month is unlocked (requires PC-6 month unlock logic)
- Post-goal-creation redirects to goal details page ✅ (already working)

---

### Phase 4: Conversational Goal Setting (PC-2)

**Goal:** Replace form-based goal creation with AI conversation.

**Tasks:**

1. Build reusable chat/conversation UI component (if not built in Phase 1 onboarding):
   - Message bubbles (user + AI)
   - Text input
   - Structured response rendering (goal preview card)
   - "Approve" / "Edit" / "Start over" actions on AI-generated goal

2. Implement goal-setting conversation logic:
   - System prompt includes user profile data from PC-1
   - AI asks clarifying questions (max 5)
   - AI generates SMART goal draft
   - User can iterate via conversation
   - On approval: save goal, auto-generate tasks for current month only (PC-3), redirect to goal details page (PC-4)

3. Manual goal creation fallback:
   - "Skip conversation, write my own" option
   - Simple form input for goal title + description
   - Tasks still auto-generate for current month after manual creation

**Acceptance criteria:**
- AI conversation references user's role, team, and career goal
- Goal is created with SMART structure after user approval
- Tasks auto-generate for current month on goal approval
- User lands on goal details page after approval
- Manual fallback works

---

### Phase 5: Monthly Coach Check-in (PC-7)

**Goal:** Build the monthly coach check-in that resolves pending tasks and generates next month's tasks.

**Tasks:**

1. Build coach side panel:
   - Slide-in panel from the right on goal details page
   - Toggle via "> coach" / "< coach" button
   - Conversational UI (reuse chat component from Phase 1/4)
   - Panel persists across navigation within goal details

2. Monthly check-in conversation logic:
   - **Trigger:** User clicks "Generate" on unlocked month's tab
   - **Step 1 — Review:** Coach summarizes previous month (completed count, pending count, overall progress)
   - **Step 2 — Resolve pending:** For each pending task, coach presents options:
     - Carry forward (increment reschedule_count, assign to new month)
     - Break down (create subtasks in new month, mark original as done)
     - Drop (mark as dropped)
     - Free-text input for user to explain → coach regenerates options
   - **Step 3 — Context:** Coach asks about changes, new priorities, blockers
   - **Step 4 — Generate:** AI generates new month's tasks based on goal + resolved items + new context
   - Tasks populate the new month tab

3. Escalation logic:
   - `reschedule_count = 0`: normal coach tone, carry-forward is default
   - `reschedule_count = 1`: mild flag — "This was carried over from last month already."
   - `reschedule_count >= 2`: urgent tone — "⚠️ This has been pending for N months." Break-down highlighted, carry-forward dimmed with "(this will be carry-forward #N)"

4. Edge cases:
   - **No pending tasks:** Coach skips resolution step, goes straight to context + generation
   - **First month (goal just created):** No check-in needed, tasks generated directly on goal approval
   - **User skips context input:** Coach generates tasks with available information

**Acceptance criteria:**
- Coach side panel opens when "Generate" is clicked
- Previous month's pending tasks are surfaced for resolution
- Each pending task gets contextual AI suggestions with escalating tone
- Free-text input regenerates appropriate options
- New month's tasks are generated and appear on goal details page
- Escalation tone changes based on reschedule count
- Edge cases handled gracefully

---

### Phase 6: Attachments (PC-9)

**Goal:** Enable evidence collection for richer self-assessments.

**Tasks:**

1. Build attachment storage:
   - File upload (images, PDFs) tied to a goal
   - Store metadata: filename, type, upload date, goal_id
   - Cloud storage integration (S3 or equivalent)

2. Upload entry points:
   - Goal detail page: "Attach evidence" button
   - Task completion flow: "Attach screenshot?" option alongside completion note
   - Drag-and-drop support

3. AI integration:
   - When generating self-assessments, include attachment content as context
   - OCR/image analysis for screenshots (can use AI vision)
   - Reference specific attachments in generated text where relevant

**Acceptance criteria:**
- Users can upload files to goals
- Attachments are accessible from goal detail
- AI references attachment content in self-assessments

---

### Phase 7: Self-Assessment Generation (Enhancement)

**Goal:** With all the new data sources (profile, tasks, completion notes, attachments), enhance the self-assessment generator.

**Tasks:**

1. Update AI prompt to include:
   - User profile (role, career goal, skills)
   - Completed tasks with dates and completion notes, organized by month
   - Attachment content (OCR'd text, image descriptions)
   - Dropped task context (for honest framing)
   - Monthly carry-forward patterns (for narrative around challenges overcome)

2. Generate first-person narrative that:
   - Aligns accomplishments with career goal
   - Includes specific evidence from attachments
   - Frames challenges constructively
   - Uses company-appropriate language

**Acceptance criteria:**
- Self-assessment reflects actual work logged
- Completion notes and attachments are woven into narrative
- Output is ready to paste into review forms

---

## Implementation Priority & Dependencies

```
Phase 1 (Profile) ──→ Phase 2 (Task Refactor) ──→ Phase 3a (Goal Details Page PC-4)
   ✅ DONE               ✅ DONE                        ✅ DONE (2026-04-18)
                                                        │
                   Phase 4 (Goal Conversation) ←────────┘
                     ✅ DONE                             │
                                                        │
                        Phase 3b (Homepage Weekly Planner PC-5) ⏳ READY TO START
                                                        │
                              Phase 5 (Monthly Coach Check-in) ──→ Phase 6 (Attachments)
                                ⏳ PENDING                         ⏳ PENDING
                                                                           │
                                                            Phase 7 (Self-Assessment) ←─ ⏳ PENDING
```

**Progress Summary (as of 2026-04-18):**
- ✅ Phase 1: PC-1 User Profile — DONE
- ✅ Phase 2: PC-3/PC-6 Task Data Model — DONE
- ✅ Phase 4: PC-2 Goal Conversation — DONE (implemented before PC-3/PC-4)
- ✅ Phase 3a: PC-4 Goal Details Page — DONE
  - Goal card redesign (Variant A) with goal_number
  - Month tabs + week grouping
  - Task check-off interaction
  - Sticky sidebar architecture
- ⏳ Phase 3b: PC-5 Homepage Weekly Planner — READY TO START
- ⏳ Phase 5: PC-7 Monthly Coach Check-in — PENDING
- ⏳ Phase 6: PC-9 Attachments — PENDING
- ⏳ Phase 7: Self-Assessment Enhancement — PENDING

**Estimated effort remaining:**
- Phase 3b (PC-5 Homepage): ~1 week
- Phase 5 (PC-7 Coach Check-in): ~1.5 weeks
- Phase 6 (PC-9 Attachments): ~1 week
- Phase 7 (Self-Assessment): ~1 week

**Total Remaining: ~4.5 weeks**

---

## Detailed Progress Notes

### PC-4 Implementation Details (2026-04-18)

**Goal Card Redesign (Variant A):**
- Replaces scattered edit/details buttons with hidden-by-default edit pencil (appears on hover/focus)
- New visual hierarchy: goal number eyebrow → title → status chip → details link
- Separate attachments card (not nested) directly below goal card
- Added `goal_number` DB column: sequential per-user, auto-computed on goal creation
- Migration: `supabase/migrations/20260418000000_add_goal_number.sql`

**Goal Details Page:**
- Month tab navigation shows only current + completed past months
- Future months completely hidden until unlocked (via PC-6 month unlock logic)
- Tasks organized by week (Week 1–4) within each month
- Past months read-only; current month allows task check-off
- Task check-off updates DB optimistically (good UX)
- Sticky sidebar keeps goal + attachments cards in view while scrolling tasks

**Post-Goal-Creation Flow:**
- After approval, users land directly on goal details page (not goals list)
- Tasks auto-generated for current month
- Page title: "Review Goal" (reflects post-conversation context)
- Redirect happens after goal_number is assigned

**Files Changed:**
- `src/components/goals/goal-smart-card.tsx` — complete rewrite (Variant A)
- `src/components/goals/conversational-goal-form.tsx` — added goal_number computation
- `src/app/dashboard/goals/[id]/page.tsx` — sticky sidebar structure
- `supabase/migrations/20260418000000_add_goal_number.sql` — new migration
- `src/lib/db/types.ts` — regenerated with goal_number field

**Testing & Deployment:**
- Tested end-to-end locally: goal creation → conversation → review → details page
- Deployed to Vercel (auto-deploy on main)
- ESLint error fixed (apostrophe escaping)
