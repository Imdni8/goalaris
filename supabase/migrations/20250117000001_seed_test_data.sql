-- Seed data for testing Coach feature
-- User: tousif@test.com

-- First, we need to get or create the user ID
-- This assumes the user already exists in auth.users

-- Insert a profile for the test user (if not exists)
INSERT INTO profiles (id, full_name, job_title, company, assessment_cycle)
SELECT
  id,
  'Tousif Ahmed',
  'Senior Software Engineer',
  'TechCorp Inc',
  'Annual'
FROM auth.users
WHERE email = 'tousif@test.com'
ON CONFLICT (id) DO NOTHING;

-- Get the user ID for subsequent inserts
DO $$
DECLARE
  test_user_id UUID;
  goal1_id UUID;
  goal2_id UUID;
  goal3_id UUID;
  task1_id UUID;
  task2_id UUID;
  task3_id UUID;
  task4_id UUID;
  task5_id UUID;
  task6_id UUID;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'tousif@test.com';

  IF test_user_id IS NULL THEN
    RAISE NOTICE 'User tousif@test.com not found. Please create the account first.';
    RETURN;
  END IF;

  -- Goal 1: Improve system performance
  INSERT INTO goals (
    user_id,
    title,
    description,
    specific,
    measurable,
    achievable,
    relevant,
    time_bound,
    status,
    ai_suggested
  ) VALUES (
    test_user_id,
    'Improve Backend API Performance',
    'Optimize our core API services to handle increased traffic and reduce response times',
    'Focus on optimizing the three most critical API endpoints: /api/users, /api/products, and /api/orders. Implement caching, database query optimization, and load balancing.',
    E'1. Reduce average API response time from 800ms to under 200ms\n2. Increase throughput to handle 10,000 requests per minute\n3. Reduce database query time by 50%\n4. Achieve 99.9% uptime',
    'We have identified specific bottlenecks through profiling. The team has experience with Redis caching and database optimization. Infrastructure budget is approved.',
    'This directly supports our Q1 objective to scale the platform for enterprise clients. Improved performance will reduce churn and support the sales team''s enterprise deals.',
    '2025-03-15',
    'active',
    true
  ) RETURNING id INTO goal1_id;

  -- Goal 2: Lead technical initiatives
  INSERT INTO goals (
    user_id,
    title,
    description,
    specific,
    measurable,
    achievable,
    relevant,
    time_bound,
    status,
    ai_suggested
  ) VALUES (
    test_user_id,
    'Lead Migration to Microservices Architecture',
    'Successfully migrate our monolithic application to a microservices architecture to improve scalability and team autonomy',
    'Break down the monolith into 5 key microservices: Authentication, User Management, Payment Processing, Notification Service, and Analytics. Establish clear service boundaries and API contracts.',
    E'1. Complete migration of 3 out of 5 services by Q2\n2. Achieve zero downtime during migration\n3. Reduce deployment time from 2 hours to under 30 minutes\n4. Train 8 team members on microservices best practices',
    'We have leadership buy-in and dedicated engineering resources. Similar migrations have been completed by other teams in the company, providing proven patterns to follow.',
    'Aligns with company-wide initiative to modernize our tech stack. Will enable faster feature development and reduce dependencies between teams.',
    '2025-06-30',
    'active',
    true
  ) RETURNING id INTO goal2_id;

  -- Goal 3: Mentorship and team growth
  INSERT INTO goals (
    user_id,
    title,
    description,
    specific,
    measurable,
    achievable,
    relevant,
    time_bound,
    status,
    ai_suggested
  ) VALUES (
    test_user_id,
    'Mentor Junior Engineers and Build Team Capability',
    'Actively mentor 2-3 junior engineers and contribute to building a stronger engineering culture',
    'Provide weekly 1:1 mentorship sessions, conduct code reviews with detailed feedback, and create technical documentation to share knowledge across the team.',
    E'1. Mentor 3 junior engineers to mid-level proficiency\n2. Conduct 20+ code reviews per month with constructive feedback\n3. Create 5 technical guides/documentation pieces\n4. Achieve 90%+ satisfaction score in mentee feedback',
    'I have 5+ years of experience and have successfully mentored engineers in the past. The company encourages mentorship and provides time allocation for these activities.',
    'Developing our junior talent is critical for team sustainability. This supports my growth into a Staff Engineer role and strengthens the overall team.',
    '2025-04-30',
    'active',
    false
  ) RETURNING id INTO goal3_id;

  -- Tasks for Goal 1 (Performance)
  INSERT INTO tasks (goal_id, title, description, status, order_index, ai_generated) VALUES
  (goal1_id, 'Profile and identify performance bottlenecks', 'Use APM tools to identify the slowest endpoints and database queries', 'completed', 1, true)
  RETURNING id INTO task1_id;

  INSERT INTO tasks (goal_id, title, description, status, order_index, ai_generated, blocker_description) VALUES
  (goal1_id, 'Implement Redis caching layer', 'Set up Redis for caching frequently accessed data and reduce database load', 'blocked', 2, true, 'Waiting for DevOps to provision Redis cluster in production environment')
  RETURNING id INTO task2_id;

  INSERT INTO tasks (goal_id, title, description, status, order_index, ai_generated) VALUES
  (goal1_id, 'Optimize database queries and add indexes', 'Analyze slow queries and add appropriate indexes to improve performance', 'in_progress', 3, true)
  RETURNING id INTO task3_id;

  INSERT INTO tasks (goal_id, title, description, status, order_index, ai_generated) VALUES
  (goal1_id, 'Implement connection pooling', 'Configure database connection pooling to reduce connection overhead', 'todo', 4, true);

  INSERT INTO tasks (goal_id, title, description, status, order_index, ai_generated) VALUES
  (goal1_id, 'Load testing and monitoring setup', 'Set up comprehensive monitoring and run load tests to validate improvements', 'todo', 5, true);

  -- Tasks for Goal 2 (Microservices)
  INSERT INTO tasks (goal_id, title, description, status, order_index, ai_generated) VALUES
  (goal2_id, 'Create microservices architecture blueprint', 'Design the overall architecture with service boundaries and communication patterns', 'completed', 1, true)
  RETURNING id INTO task4_id;

  INSERT INTO tasks (goal_id, title, description, status, order_index, ai_generated) VALUES
  (goal2_id, 'Extract Authentication service', 'Build and deploy the authentication microservice as the first migration', 'in_progress', 2, true)
  RETURNING id INTO task5_id;

  INSERT INTO tasks (goal_id, title, description, status, order_index, ai_generated) VALUES
  (goal2_id, 'Set up service mesh and API gateway', 'Implement Kong API Gateway and configure service discovery', 'todo', 3, true);

  INSERT INTO tasks (goal_id, title, description, status, order_index, ai_generated) VALUES
  (goal2_id, 'Extract User Management service', 'Migrate user-related functionality to a dedicated microservice', 'todo', 4, true);

  -- Tasks for Goal 3 (Mentorship)
  INSERT INTO tasks (goal_id, title, description, status, order_index, ai_generated) VALUES
  (goal3_id, 'Establish weekly 1:1 schedule with mentees', 'Set up recurring meetings and create a mentorship framework', 'completed', 1, true)
  RETURNING id INTO task6_id;

  INSERT INTO tasks (goal_id, title, description, status, order_index, ai_generated) VALUES
  (goal3_id, 'Create onboarding documentation for new engineers', 'Write comprehensive guides for codebase, architecture, and team processes', 'in_progress', 2, true);

  INSERT INTO tasks (goal_id, title, description, status, order_index, ai_generated) VALUES
  (goal3_id, 'Conduct monthly knowledge sharing sessions', 'Present technical topics to the team to share expertise', 'todo', 3, true);

  -- Action logs for completed and in-progress tasks

  -- Action logs for Task 1 (Profiling - completed)
  INSERT INTO action_logs (user_id, task_id, title, description, status) VALUES
  (test_user_id, task1_id, 'Set up New Relic APM', 'Configured New Relic for all production services and set up custom dashboards', 'completed');

  INSERT INTO action_logs (user_id, task_id, title, description, status) VALUES
  (test_user_id, task1_id, 'Analyzed top 20 slowest endpoints', 'Identified /api/products/search and /api/orders/history as the main bottlenecks, averaging 1.2s response time', 'completed');

  INSERT INTO action_logs (user_id, task_id, title, description, status) VALUES
  (test_user_id, task1_id, 'Documented findings in Confluence', 'Created detailed report with metrics, graphs, and recommendations for the team', 'completed');

  -- Action logs for Task 2 (Redis - blocked)
  INSERT INTO action_logs (user_id, task_id, title, description, status, blocker_description, blocker_status) VALUES
  (test_user_id, task2_id, 'Submitted infrastructure request for Redis cluster', 'Created Jira ticket DEV-1234 for Redis cluster provisioning in production', 'blocked', 'DevOps team has a 2-week backlog. They estimate Redis setup will be done by Feb 28', 'active');

  INSERT INTO action_logs (user_id, task_id, title, description, status) VALUES
  (test_user_id, task2_id, 'Developed Redis caching layer in staging environment', 'Built and tested caching logic for product and user data. Seeing 60% reduction in DB queries in staging.', 'in_progress');

  -- Action logs for Task 3 (Database optimization - in progress)
  INSERT INTO action_logs (user_id, task_id, title, description, status) VALUES
  (test_user_id, task3_id, 'Added composite index on orders table', 'Created index on (user_id, created_at) which reduced query time from 800ms to 120ms', 'completed');

  INSERT INTO action_logs (user_id, task_id, title, description, status) VALUES
  (test_user_id, task3_id, 'Optimized product search query with full-text search', 'Replaced LIKE queries with PostgreSQL full-text search. Testing shows 70% improvement.', 'in_progress');

  -- Action logs for Task 4 (Architecture blueprint - completed)
  INSERT INTO action_logs (user_id, task_id, title, description, status) VALUES
  (test_user_id, task4_id, 'Facilitated 3-day architecture workshop', 'Led cross-functional workshop with 12 engineers to define service boundaries', 'completed');

  INSERT INTO action_logs (user_id, task_id, title, description, status) VALUES
  (test_user_id, task4_id, 'Created C4 architecture diagrams', 'Documented the target architecture using C4 model - shared with engineering leadership', 'completed');

  -- Action logs for Task 5 (Auth service - in progress)
  INSERT INTO action_logs (user_id, task_id, title, description, status) VALUES
  (test_user_id, task5_id, 'Built authentication service with JWT support', 'Implemented OAuth 2.0 and JWT token management in new auth microservice', 'in_progress');

  INSERT INTO action_logs (user_id, task_id, title, description, status) VALUES
  (test_user_id, task5_id, 'Deployed auth service to staging', 'Successfully deployed and running integration tests. 95% test coverage achieved.', 'in_progress');

  -- Action logs for Task 6 (Mentorship - completed)
  INSERT INTO action_logs (user_id, task_id, title, description, status) VALUES
  (test_user_id, task6_id, 'Assigned 3 junior engineers as mentees', 'Now mentoring Sarah, James, and Priya on backend development and system design', 'completed');

  INSERT INTO action_logs (user_id, task_id, title, description, status) VALUES
  (test_user_id, task6_id, 'Created mentorship framework document', 'Developed a 12-week structured mentorship plan with learning objectives and milestones', 'completed');

  RAISE NOTICE 'Seed data created successfully for user: %', test_user_id;
END $$;
