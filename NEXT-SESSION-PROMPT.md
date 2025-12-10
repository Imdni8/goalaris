# Next Session: Implement Sentry + Custom Analytics

Hi Claude! Please implement Steps 10 and 11 from @beta-onboarding-actions.md based on the decisions documented in @CLAUDE.md.

## What to do:

### Step 10: Set up Sentry Error Tracking (~15 min)
1. Install `@sentry/nextjs` package
2. Run Sentry wizard to generate config files
3. Add Sentry init to app (capture all errors automatically)
4. Add error boundary integration
5. Test error capture works
6. Tell me to add `SENTRY_DSN` environment variable to Vercel

**Note:** I need to sign up at https://sentry.io and provide you the DSN when you ask.

### Step 11: Set up Basic Analytics (~30 min)
1. Create `analytics_events` table in Supabase with migration:
   - Fields: id, user_id, event_name, properties (jsonb), created_at
   - RLS policies for user isolation
2. Create helper function `trackEvent(eventName, properties)`
3. Add tracking to these 5 key events:
   - `goal_created` (with type: 'ai' | 'manual')
   - `tasks_generated` (with goalId, count)
   - `action_logged` (with taskId)
   - `assessment_generated` (with goalCount)
   - `coach_message_sent` (with conversationId)
4. Create example SQL queries for common analytics questions
5. Document how to query analytics data

**Note:** No charts needed - just SQL queries. Keep it simple.

## Context:
- We decided against Amplitude/PostHog/Vercel Analytics (overkill for beta)
- Sentry free tier is perfect (5k errors/month)
- Custom analytics gives us full control, no external dependency
- See "Monitoring & Analytics Decision" section in @CLAUDE.md for full reasoning

## Expected deliverables:
- [ ] Sentry fully integrated and capturing errors
- [ ] Analytics table created with RLS
- [ ] Tracking helper function implemented
- [ ] 5 key events tracked across the app
- [ ] Documentation with example SQL queries
- [ ] Update @beta-onboarding-actions.md marking Steps 10-11 complete

Let me know when done!
