-- Extended user profile
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  job_title TEXT,
  company TEXT,
  assessment_cycle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  specific TEXT,
  measurable TEXT,
  achievable TEXT,
  relevant TEXT,
  time_bound DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  ai_suggested BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (actionable steps)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'completed')),
  blocker_description TEXT,
  due_date DATE,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action logs (progress entries)
CREATE TABLE IF NOT EXISTS public.action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'blocked')),
  blocker_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI interactions (for context/history)
CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('smart_goal', 'task_breakdown', 'coaching', 'insight')),
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  tokens_used INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON public.tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_action_logs_task_id ON public.action_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_user_id ON public.action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON public.ai_interactions(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for goals
CREATE POLICY "Users can CRUD own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for tasks
CREATE POLICY "Users can CRUD tasks for own goals" ON public.tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.goals WHERE public.goals.id = public.tasks.goal_id AND public.goals.user_id = auth.uid())
);

-- RLS Policies for action logs
CREATE POLICY "Users can CRUD own action logs" ON public.action_logs FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for AI interactions
CREATE POLICY "Users can view own AI interactions" ON public.ai_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create AI interactions" ON public.ai_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
