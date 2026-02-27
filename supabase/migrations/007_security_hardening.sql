-- 007_security_hardening.sql
-- Rate limiting på inloggning + skydd mot dubbla köposter

-- 1. Lägg till rate limiting-kolumner på app_users
ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS failed_attempts  INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until     TIMESTAMPTZ;

-- 2. Förhindra dubbla "waiting"-poster för samma user_id
--    (partiellt unikt index — gäller bara aktiva vänteposter)
CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_one_waiting_per_user
  ON public.queue (user_id)
  WHERE status = 'waiting';
