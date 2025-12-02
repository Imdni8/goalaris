/**
 * Seed test data for self-assessment feature
 * Run with: npx tsx scripts/seed-test-data.ts
 */

import { createClient } from '@supabase/supabase-js';

// Local Supabase configuration (for development)
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTestData() {
  console.log('🌱 Starting to seed test data...\n');

  // Get the first user from the database (or you can specify a user ID)
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError || !users || users.users.length === 0) {
    console.error('Error: No users found. Please create a user account first.');
    return;
  }

  const userId = users.users[0].id;
  console.log(`Using user ID: ${userId}\n`);

  // Define test goals
  const goals = [
    {
      user_id: userId,
      title: 'Launch Mobile App MVP',
      description: 'Design, develop, and launch the first version of our mobile application for iOS and Android platforms.',
      specific: 'Build a cross-platform mobile app with user authentication, core features (profile, feed, messaging), and payment integration.',
      measurable: '1. Complete design mockups for all 15 core screens\n2. Implement user authentication flow\n3. Achieve 1,000 beta user signups\n4. Maintain app crash rate below 1%\n5. Achieve 4+ star rating on app stores',
      achievable: 'Team has React Native experience, design resources allocated, and 4-month development timeline is realistic for MVP scope.',
      relevant: 'Aligns with company goal to expand to mobile-first users and capture younger demographic (18-35).',
      time_bound: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      ai_suggested: true,
    },
    {
      user_id: userId,
      title: 'Improve API Performance by 40%',
      description: 'Optimize backend API response times and reduce infrastructure costs through performance improvements.',
      specific: 'Reduce average API response time from 250ms to 150ms and decrease P95 latency from 800ms to 400ms.',
      measurable: '1. Reduce average response time to 150ms\n2. Reduce P95 latency to 400ms\n3. Decrease database query time by 50%\n4. Reduce infrastructure costs by 25%\n5. Maintain 99.9% uptime',
      achievable: 'Have identified key bottlenecks through profiling, team has database optimization experience, and allocated 6 weeks for implementation.',
      relevant: 'Directly impacts user experience and customer retention. Performance is top customer complaint in NPS surveys.',
      time_bound: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      ai_suggested: false,
    },
  ];

  console.log('📝 Inserting goals...');
  const { data: insertedGoals, error: goalsError } = await supabase
    .from('goals')
    .insert(goals)
    .select();

  if (goalsError) {
    console.error('Error inserting goals:', goalsError);
    return;
  }

  console.log(`✅ Inserted ${insertedGoals.length} goals\n`);

  // Define tasks for each goal
  const goal1 = insertedGoals[0];
  const goal2 = insertedGoals[1];

  const tasks = [
    // Tasks for Goal 1 (Mobile App)
    { goal_id: goal1.id, title: 'Complete UI/UX Design', description: 'Design all core screens and user flows in Figma', status: 'completed', order_index: 1 },
    { goal_id: goal1.id, title: 'Set up React Native Project', description: 'Initialize project with authentication scaffolding', status: 'completed', order_index: 2 },
    { goal_id: goal1.id, title: 'Implement User Authentication', description: 'Build login, signup, and password reset flows', status: 'completed', order_index: 3 },
    { goal_id: goal1.id, title: 'Build Core Features (Feed & Profile)', description: 'Develop main feed and user profile screens', status: 'in_progress', order_index: 4 },
    { goal_id: goal1.id, title: 'Integrate Payment System', description: 'Add Stripe payment integration', status: 'todo', order_index: 5 },

    // Tasks for Goal 2 (API Performance)
    { goal_id: goal2.id, title: 'Profile and Identify Bottlenecks', description: 'Use APM tools to identify slow queries', status: 'completed', order_index: 1 },
    { goal_id: goal2.id, title: 'Add Database Indexes', description: 'Optimize queries with strategic indexes', status: 'completed', order_index: 2 },
    { goal_id: goal2.id, title: 'Implement Redis Caching', description: 'Cache frequently accessed data', status: 'in_progress', order_index: 3 },
  ];

  console.log('📋 Inserting tasks...');
  const { data: insertedTasks, error: tasksError } = await supabase
    .from('tasks')
    .insert(tasks)
    .select();

  if (tasksError) {
    console.error('Error inserting tasks:', tasksError);
    return;
  }

  console.log(`✅ Inserted ${insertedTasks.length} tasks\n`);

  // Define action logs for each task (using correct column names: title, description, created_at)
  const actionLogs = [
    // Logs for Task 1 (UI/UX Design)
    { task_id: insertedTasks[0].id, user_id: userId, title: 'Created initial wireframes for 15 core screens in Figma', description: 'Established visual direction and user flow. Shared with team for feedback.', created_at: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString() },
    { task_id: insertedTasks[0].id, user_id: userId, title: 'Conducted design review with product and engineering teams', description: 'Got approval on 12 screens, flagged 3 for revision based on technical constraints.', created_at: new Date(Date.now() - 54 * 24 * 60 * 60 * 1000).toISOString() },
    { task_id: insertedTasks[0].id, user_id: userId, title: 'Finalized all 15 screen designs with hi-fi mockups', description: 'Complete design system established. Ready for development handoff.', created_at: new Date(Date.now() - 52 * 24 * 60 * 60 * 1000).toISOString() },

    // Logs for Task 2 (React Native Setup)
    { task_id: insertedTasks[1].id, user_id: userId, title: 'Initialized React Native project with TypeScript and ESLint', description: 'Set up project structure following team coding standards.', created_at: new Date(Date.now() - 53 * 24 * 60 * 60 * 1000).toISOString() },
    { task_id: insertedTasks[1].id, user_id: userId, title: 'Configured CI/CD pipeline with GitHub Actions', description: 'Automated build and test process. Reduced manual deployment effort by 80%.', created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString() },

    // Logs for Task 3 (Authentication)
    { task_id: insertedTasks[2].id, user_id: userId, title: 'Integrated Firebase Authentication SDK', description: 'Supports email/password, Google, and Apple sign-in methods.', created_at: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000).toISOString() },
    { task_id: insertedTasks[2].id, user_id: userId, title: 'Built login, signup, and password reset screens', description: 'Implemented form validation and error handling. 95% test coverage.', created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() },
    { task_id: insertedTasks[2].id, user_id: userId, title: 'Added biometric authentication (Face ID/Touch ID)', description: 'Improved security and user experience. Beta users report 90% satisfaction.', created_at: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString() },

    // Logs for Task 4 (Core Features - in progress)
    { task_id: insertedTasks[3].id, user_id: userId, title: 'Implemented feed pagination with infinite scroll', description: 'Optimized performance - can handle 1000+ items without lag.', created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString() },
    { task_id: insertedTasks[3].id, user_id: userId, title: 'Built user profile page with edit functionality', description: 'Users can update bio, photo, and preferences. Real-time validation.', created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
    { task_id: insertedTasks[3].id, user_id: userId, title: 'Added image upload with compression', description: 'Images auto-compress to save bandwidth. 60% reduction in upload time.', created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
    { task_id: insertedTasks[3].id, user_id: userId, title: 'Implemented push notifications for feed updates', description: 'Integrated FCM. Tested on iOS and Android. 95% delivery rate.', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },

    // Logs for Task 6 (Profiling)
    { task_id: insertedTasks[5].id, user_id: userId, title: 'Set up New Relic APM for API monitoring', description: 'Now have visibility into all endpoint performance metrics.', created_at: new Date(Date.now() - 68 * 24 * 60 * 60 * 1000).toISOString() },
    { task_id: insertedTasks[5].id, user_id: userId, title: 'Analyzed top 20 slowest endpoints', description: 'Identified 5 endpoints responsible for 70% of slow requests. Database queries are main bottleneck.', created_at: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString() },

    // Logs for Task 7 (Database Indexes)
    { task_id: insertedTasks[6].id, user_id: userId, title: 'Added composite indexes on users and posts tables', description: 'Reduced query time for feed endpoint from 450ms to 180ms (60% improvement).', created_at: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000).toISOString() },
    { task_id: insertedTasks[6].id, user_id: userId, title: 'Optimized N+1 queries in relationships', description: 'Replaced 50+ individual queries with 2 batch queries. Massive performance gain.', created_at: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000).toISOString() },

    // Logs for Task 8 (Redis Caching)
    { task_id: insertedTasks[7].id, user_id: userId, title: 'Set up Redis cluster on AWS ElastiCache', description: 'Configured with replication for high availability. 99.9% uptime SLA.', created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString() },
    { task_id: insertedTasks[7].id, user_id: userId, title: 'Implemented cache-aside pattern for user profiles', description: 'Cache hit rate at 85%. Reduced database load by 40%.', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { task_id: insertedTasks[7].id, user_id: userId, title: 'Added cache invalidation logic for data updates', description: 'Ensures data consistency. TTL set to 5 minutes for frequently changing data.', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  console.log('💬 Inserting action logs...');
  const { data: insertedLogs, error: logsError } = await supabase
    .from('action_logs')
    .insert(actionLogs)
    .select();

  if (logsError) {
    console.error('Error inserting action logs:', logsError);
    return;
  }

  console.log(`✅ Inserted ${insertedLogs.length} action logs\n`);

  console.log('🎉 Test data seeding complete!');
  console.log(`\nSummary:`);
  console.log(`  - ${insertedGoals.length} goals`);
  console.log(`  - ${insertedTasks.length} tasks`);
  console.log(`  - ${insertedLogs.length} action logs`);
  console.log(`\nYou can now test the self-assessment feature!`);
}

seedTestData().catch(console.error);
