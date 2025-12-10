# Analytics SQL Queries

This document provides example SQL queries for analyzing user behavior and engagement in Goalaris.

## Table Schema

The `analytics_events` table has the following structure:
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Tracked Events

1. **goal_created** - User creates a goal
   - Properties: `{ type: 'ai' | 'manual' }`

2. **tasks_generated** - AI generates tasks for a goal
   - Properties: `{ goalId: string, count: number }`

3. **action_logged** - User logs progress on a task
   - Properties: `{ taskId: string }`

4. **assessment_generated** - User generates self-assessment
   - Properties: `{ goalCount: number }`

5. **coach_message_sent** - User sends message to AI coach
   - Properties: `{ conversationId: string }`

---

## Common Analytics Queries

### 1. Total Events by Type
```sql
SELECT
  event_name,
  COUNT(*) as event_count
FROM analytics_events
GROUP BY event_name
ORDER BY event_count DESC;
```

### 2. Daily Active Users (last 30 days)
```sql
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as active_users
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 3. User Engagement - Events per User
```sql
SELECT
  user_id,
  COUNT(*) as total_events,
  COUNT(DISTINCT event_name) as unique_event_types,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event
FROM analytics_events
GROUP BY user_id
ORDER BY total_events DESC;
```

### 4. Goal Creation - AI vs Manual
```sql
SELECT
  properties->>'type' as goal_type,
  COUNT(*) as count
FROM analytics_events
WHERE event_name = 'goal_created'
GROUP BY properties->>'type';
```

### 5. Average Tasks Generated per Goal
```sql
SELECT
  AVG((properties->>'count')::int) as avg_tasks_per_goal
FROM analytics_events
WHERE event_name = 'tasks_generated';
```

### 6. Most Active Users (by action logs)
```sql
SELECT
  user_id,
  COUNT(*) as action_logs_count
FROM analytics_events
WHERE event_name = 'action_logged'
GROUP BY user_id
ORDER BY action_logs_count DESC
LIMIT 10;
```

### 7. Coaching Engagement - Messages per Conversation
```sql
SELECT
  properties->>'conversationId' as conversation_id,
  COUNT(*) as messages_sent
FROM analytics_events
WHERE event_name = 'coach_message_sent'
GROUP BY properties->>'conversationId'
ORDER BY messages_sent DESC;
```

### 8. Weekly Event Trends (last 8 weeks)
```sql
SELECT
  DATE_TRUNC('week', created_at) as week,
  event_name,
  COUNT(*) as event_count
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '8 weeks'
GROUP BY week, event_name
ORDER BY week DESC, event_count DESC;
```

### 9. User Retention - Users Active in Week 1 vs Week 2+
```sql
WITH user_first_week AS (
  SELECT
    user_id,
    MIN(DATE_TRUNC('week', created_at)) as first_week
  FROM analytics_events
  GROUP BY user_id
)
SELECT
  u.user_id,
  u.first_week,
  COUNT(DISTINCT DATE_TRUNC('week', e.created_at)) as active_weeks
FROM user_first_week u
LEFT JOIN analytics_events e ON u.user_id = e.user_id
GROUP BY u.user_id, u.first_week
HAVING COUNT(DISTINCT DATE_TRUNC('week', e.created_at)) > 1
ORDER BY active_weeks DESC;
```

### 10. Feature Adoption Rate
```sql
WITH total_users AS (
  SELECT COUNT(DISTINCT user_id) as total FROM analytics_events
)
SELECT
  event_name,
  COUNT(DISTINCT user_id) as users_who_used,
  ROUND(100.0 * COUNT(DISTINCT user_id) / (SELECT total FROM total_users), 2) as adoption_percentage
FROM analytics_events
GROUP BY event_name
ORDER BY adoption_percentage DESC;
```

### 11. User Journey - Event Sequence
```sql
SELECT
  user_id,
  event_name,
  created_at,
  LAG(event_name) OVER (PARTITION BY user_id ORDER BY created_at) as previous_event
FROM analytics_events
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at;
```

### 12. Assessment Generation Patterns
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as assessments_generated,
  AVG((properties->>'goalCount')::int) as avg_goals_per_assessment
FROM analytics_events
WHERE event_name = 'assessment_generated'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Running Queries

### In Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Paste the query and click **Run**

### Using Supabase CLI
```bash
# Connect to local database
npx supabase db connect

# Run query from file
psql -f query.sql
```

### In Production (PostgreSQL)
```bash
# Connect to production database
psql "postgres://user:password@host:port/database"

# Run query
\i query.sql
```

---

## Best Practices

1. **Filter by date range** - Add WHERE clauses to limit data:
   ```sql
   WHERE created_at >= NOW() - INTERVAL '7 days'
   ```

2. **Use indexes** - Queries on `user_id`, `event_name`, and `created_at` are indexed

3. **JSONB queries** - Access properties with `->` or `->>`
   ```sql
   properties->>'type'  -- Returns text
   properties->'count'  -- Returns JSONB (use ::int to cast)
   ```

4. **Aggregate by user** - Always group by `user_id` for user-level metrics

5. **Privacy** - Never share raw user_id values externally; use aggregated metrics

---

## Future Enhancements

Consider adding:
- Funnel analysis (goal created → tasks generated → action logged)
- Cohort retention analysis
- Time-to-first-action metrics
- Event property trend analysis
- Integration with BI tools (Metabase, Redash, etc.)
