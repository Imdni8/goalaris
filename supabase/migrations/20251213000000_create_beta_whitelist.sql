-- Beta whitelist table (temporary - remove after beta)
CREATE TABLE IF NOT EXISTS public.beta_whitelist (
  email TEXT PRIMARY KEY,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  signup_completed_at TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_beta_whitelist_email ON public.beta_whitelist(email);

-- Insert your beta testers (REPLACE WITH REAL EMAILS BEFORE PRODUCTION DEPLOY)
INSERT INTO public.beta_whitelist (email, notes) VALUES
  ('beta1@example.com', 'Early tester 1'),
  ('beta2@example.com', 'Early tester 2'),
  ('beta3@example.com', 'Early tester 3')
ON CONFLICT (email) DO NOTHING;
