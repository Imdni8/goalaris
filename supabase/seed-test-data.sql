-- Seed test data for self-assessment feature testing
-- This adds realistic goals, tasks, and action logs for the current authenticated user

-- First, get the current user's ID (will be populated when run in authenticated context)
-- For local testing, you'll need to replace 'YOUR_USER_ID' with your actual user ID from auth.users

-- Insert test goals
INSERT INTO goals (user_id, title, description, specific, measurable, achievable, relevant, time_bound, status, ai_suggested, created_at)
VALUES
  (auth.uid(),
   'Launch Mobile App MVP',
   'Design, develop, and launch the first version of our mobile application for iOS and Android platforms.',
   'Build a cross-platform mobile app with user authentication, core features (profile, feed, messaging), and payment integration.',
   '1. Complete design mockups for all 15 core screens
2. Implement user authentication flow
3. Achieve 1,000 beta user signups
4. Maintain app crash rate below 1%
5. Achieve 4+ star rating on app stores',
   'Team has React Native experience, design resources allocated, and 4-month development timeline is realistic for MVP scope.',
   'Aligns with company goal to expand to mobile-first users and capture younger demographic (18-35).',
   (NOW() + INTERVAL '3 months')::date,
   'active',
   true,
   NOW() - INTERVAL '2 months'),

  (auth.uid(),
   'Improve API Performance by 40%',
   'Optimize backend API response times and reduce infrastructure costs through performance improvements.',
   'Reduce average API response time from 250ms to 150ms and decrease P95 latency from 800ms to 400ms.',
   '1. Reduce average response time to 150ms
2. Reduce P95 latency to 400ms
3. Decrease database query time by 50%
4. Reduce infrastructure costs by 25%
5. Maintain 99.9% uptime',
   'Have identified key bottlenecks through profiling, team has database optimization experience, and allocated 6 weeks for implementation.',
   'Directly impacts user experience and customer retention. Performance is top customer complaint in NPS surveys.',
   (NOW() + INTERVAL '1 month')::date,
   'active',
   false,
   NOW() - INTERVAL '3 months'),

  (auth.uid(),
   'Establish Developer Documentation System',
   'Create comprehensive developer documentation to reduce onboarding time and improve code quality.',
   'Build centralized documentation hub covering API docs, architecture guides, coding standards, and deployment procedures.',
   '1. Document all 25 API endpoints with examples
2. Create 10 architecture decision records (ADRs)
3. Reduce new developer onboarding time from 4 weeks to 2 weeks
4. Achieve 90% team satisfaction score on documentation usefulness',
   'Allocated 3 hours/week, using familiar tools (Notion/GitBook), and have senior developers available for review.',
   'Supports team scaling goals - planning to hire 5 engineers in next quarter. Reduces knowledge silos and improves code quality.',
   (NOW() + INTERVAL '2 months')::date,
   'active',
   false,
   NOW() - INTERVAL '1 month');

-- Get the goal IDs we just created
DO $$
DECLARE
  goal1_id UUID;
  goal2_id UUID;
  goal3_id UUID;
  task1_id UUID;
  task2_id UUID;
  task3_id UUID;
  task4_id UUID;
  task5_id UUID;
  task6_id UUID;
  task7_id UUID;
  task8_id UUID;
BEGIN
  -- Get goal IDs
  SELECT id INTO goal1_id FROM goals WHERE user_id = auth.uid() AND title = 'Launch Mobile App MVP' LIMIT 1;
  SELECT id INTO goal2_id FROM goals WHERE user_id = auth.uid() AND title = 'Improve API Performance by 40%' LIMIT 1;
  SELECT id INTO goal3_id FROM goals WHERE user_id = auth.uid() AND title = 'Establish Developer Documentation System' LIMIT 1;

  -- Insert tasks for Goal 1 (Mobile App)
  INSERT INTO tasks (goal_id, title, description, status, order_index, created_at)
  VALUES
    (goal1_id, 'Complete UI/UX Design', 'Design all core screens and user flows in Figma', 'completed', 1, NOW() - INTERVAL '60 days'),
    (goal1_id, 'Set up React Native Project', 'Initialize project with authentication scaffolding', 'completed', 2, NOW() - INTERVAL '55 days'),
    (goal1_id, 'Implement User Authentication', 'Build login, signup, and password reset flows', 'completed', 3, NOW() - INTERVAL '45 days'),
    (goal1_id, 'Build Core Features (Feed & Profile)', 'Develop main feed and user profile screens', 'in_progress', 4, NOW() - INTERVAL '30 days'),
    (goal1_id, 'Integrate Payment System', 'Add Stripe payment integration', 'todo', 5, NOW() - INTERVAL '25 days')
  RETURNING id INTO task1_id, task2_id, task3_id, task4_id, task5_id;

  -- Insert tasks for Goal 2 (API Performance)
  INSERT INTO tasks (goal_id, title, description, status, order_index, created_at)
  VALUES
    (goal2_id, 'Profile and Identify Bottlenecks', 'Use APM tools to identify slow queries', 'completed', 1, NOW() - INTERVAL '70 days'),
    (goal2_id, 'Add Database Indexes', 'Optimize queries with strategic indexes', 'completed', 2, NOW() - INTERVAL '50 days'),
    (goal2_id, 'Implement Redis Caching', 'Cache frequently accessed data', 'in_progress', 3, NOW() - INTERVAL '20 days')
  RETURNING id INTO task6_id, task7_id, task8_id;

  -- Now insert action logs for these tasks

  -- Logs for Task 1 (UI/UX Design - completed)
  INSERT INTO action_logs (task_id, user_id, action_description, impact_notes, logged_at)
  VALUES
    (task1_id, auth.uid(), 'Created initial wireframes for 15 core screens in Figma', 'Established visual direction and user flow. Shared with team for feedback.', NOW() - INTERVAL '58 days'),
    (task1_id, auth.uid(), 'Conducted design review with product and engineering teams', 'Got approval on 12 screens, flagged 3 for revision based on technical constraints.', NOW() - INTERVAL '54 days'),
    (task1_id, auth.uid(), 'Finalized all 15 screen designs with hi-fi mockups', 'Complete design system established. Ready for development handoff.', NOW() - INTERVAL '52 days');

  -- Logs for Task 2 (React Native Setup - completed)
  INSERT INTO action_logs (task_id, user_id, action_description, impact_notes, logged_at)
  VALUES
    (task2_id, auth.uid(), 'Initialized React Native project with TypeScript and ESLint', 'Set up project structure following team coding standards.', NOW() - INTERVAL '53 days'),
    (task2_id, auth.uid(), 'Configured CI/CD pipeline with GitHub Actions', 'Automated build and test process. Reduced manual deployment effort by 80%.', NOW() - INTERVAL '50 days');

  -- Logs for Task 3 (Authentication - completed)
  INSERT INTO action_logs (task_id, user_id, action_description, impact_notes, logged_at)
  VALUES
    (task3_id, auth.uid(), 'Integrated Firebase Authentication SDK', 'Supports email/password, Google, and Apple sign-in methods.', NOW() - INTERVAL '43 days'),
    (task3_id, auth.uid(), 'Built login, signup, and password reset screens', 'Implemented form validation and error handling. 95% test coverage.', NOW() - INTERVAL '40 days'),
    (task3_id, auth.uid(), 'Added biometric authentication (Face ID/Touch ID)', 'Improved security and user experience. Beta users report 90% satisfaction.', NOW() - INTERVAL '38 days');

  -- Logs for Task 4 (Core Features - in progress)
  INSERT INTO action_logs (task_id, user_id, action_description, impact_notes, logged_at)
  VALUES
    (task4_id, auth.uid(), 'Implemented feed pagination with infinite scroll', 'Optimized performance - can handle 1000+ items without lag.', NOW() - INTERVAL '28 days'),
    (task4_id, auth.uid(), 'Built user profile page with edit functionality', 'Users can update bio, photo, and preferences. Real-time validation.', NOW() - INTERVAL '20 days'),
    (task4_id, auth.uid(), 'Added image upload with compression', 'Images auto-compress to save bandwidth. 60% reduction in upload time.', NOW() - INTERVAL '12 days'),
    (task4_id, auth.uid(), 'Implemented push notifications for feed updates', 'Integrated FCM. Tested on iOS and Android. 95% delivery rate.', NOW() - INTERVAL '5 days');

  -- Logs for Task 6 (Profiling - completed)
  INSERT INTO action_logs (task_id, user_id, action_description, impact_notes, logged_at)
  VALUES
    (task6_id, auth.uid(), 'Set up New Relic APM for API monitoring', 'Now have visibility into all endpoint performance metrics.', NOW() - INTERVAL '68 days'),
    (task6_id, auth.uid(), 'Analyzed top 20 slowest endpoints', 'Identified 5 endpoints responsible for 70% of slow requests. Database queries are main bottleneck.', NOW() - INTERVAL '65 days'),
    (task6_id, auth.uid(), 'Created optimization roadmap with priority ranking', 'Estimated 40% improvement achievable by addressing top 3 issues.', NOW() - INTERVAL '62 days');

  -- Logs for Task 7 (Database Indexes - completed)
  INSERT INTO action_logs (task_id, user_id, action_description, impact_notes, logged_at)
  VALUES
    (task7_id, auth.uid(), 'Added composite indexes on users and posts tables', 'Reduced query time for feed endpoint from 450ms to 180ms (60% improvement).', NOW() - INTERVAL '48 days'),
    (task7_id, auth.uid(), 'Optimized N+1 queries in relationships', 'Replaced 50+ individual queries with 2 batch queries. Massive performance gain.', NOW() - INTERVAL '44 days'),
    (task7_id, auth.uid(), 'Ran EXPLAIN ANALYZE on all slow queries', 'Documented query plans. Identified missing indexes on 3 foreign keys.', NOW() - INTERVAL '42 days');

  -- Logs for Task 8 (Redis Caching - in progress)
  INSERT INTO action_logs (task_id, user_id, action_description, impact_notes, logged_at)
  VALUES
    (task8_id, auth.uid(), 'Set up Redis cluster on AWS ElastiCache', 'Configured with replication for high availability. 99.9% uptime SLA.', NOW() - INTERVAL '18 days'),
    (task8_id, auth.uid(), 'Implemented cache-aside pattern for user profiles', 'Cache hit rate at 85%. Reduced database load by 40%.', NOW() - INTERVAL '10 days'),
    (task8_id, auth.uid(), 'Added cache invalidation logic for data updates', 'Ensures data consistency. TTL set to 5 minutes for frequently changing data.', NOW() - INTERVAL '3 days');

  -- Insert a few more action logs for recent activity
  INSERT INTO action_logs (task_id, user_id, action_description, impact_notes, logged_at)
  VALUES
    (task4_id, auth.uid(), 'Fixed bug in feed refresh logic', 'Feed now properly updates when pulling to refresh. Improved UX.', NOW() - INTERVAL '2 days'),
    (task8_id, auth.uid(), 'Monitored cache performance in production', 'Avg response time down to 120ms (52% improvement). On track to hit 150ms goal.', NOW() - INTERVAL '1 day');

END $$;
