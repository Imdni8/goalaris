-- Add blocker_status to action_logs table
-- This allows tracking whether a blocker is active or resolved
ALTER TABLE public.action_logs
ADD COLUMN blocker_status TEXT CHECK (blocker_status IN ('active', 'resolved'));

-- Create index for querying active blockers
CREATE INDEX IF NOT EXISTS idx_action_logs_blocker_status ON public.action_logs(blocker_status);

-- Add comment for documentation
COMMENT ON COLUMN public.action_logs.blocker_status IS 'Status of blocker: active or resolved. NULL if no blocker exists.';
