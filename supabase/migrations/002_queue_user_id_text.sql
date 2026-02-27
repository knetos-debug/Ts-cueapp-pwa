-- Fix: user_id ska vara text (medlems-ID / QR-sträng), inte uuid
-- Kör i Supabase SQL Editor om queue.user_id är uuid

-- 1. Droppa policies som refererar till user_id (blockerar ALTER COLUMN)
DROP POLICY IF EXISTS "Users can insert own queue entries" ON public.queue;
DROP POLICY IF EXISTS "Users can read own queue entries" ON public.queue;

-- 2. Droppa FK-constraint på user_id (namn kan variera)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey) AND NOT a.attisdropped
    WHERE n.nspname = 'public' AND t.relname = 'queue'
      AND a.attname = 'user_id' AND c.contype = 'f'
  ) LOOP
    EXECUTE format('ALTER TABLE public.queue DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- 3. Ändra kolumntyp
ALTER TABLE public.queue
  ALTER COLUMN user_id TYPE text USING user_id::text;

-- 4. Ersätt NULL (från gamla FK ON DELETE SET NULL) med placeholder
UPDATE public.queue SET user_id = '(okänd)' WHERE user_id IS NULL;

-- 5. Gör user_id NOT NULL (appen skickar alltid medlems-ID)
ALTER TABLE public.queue
  ALTER COLUMN user_id SET NOT NULL;

-- 6. Återskapa policies för kiosk/staff-flöde
CREATE POLICY "Anyone can insert queue entry"
  ON public.queue FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read queue"
  ON public.queue FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can update queue"
  ON public.queue FOR UPDATE
  TO authenticated
  USING (true);
