-- Extend profiles table with career coaching context fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS team TEXT,
  ADD COLUMN IF NOT EXISTS review_cycle_timing TEXT,
  ADD COLUMN IF NOT EXISTS career_goal TEXT,
  ADD COLUMN IF NOT EXISTS key_skills TEXT[],
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
