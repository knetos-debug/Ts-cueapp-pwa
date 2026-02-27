-- V2 Fas 1: Säkerhetshärdning av queue-tabellen
-- Kör i Supabase SQL Editor (eller via Supabase CLI)

-- 1. Ta bort den öppna INSERT-policyn från migration 002
DROP POLICY IF EXISTS "Anyone can insert queue entry" ON public.queue;

-- 2. Ersätt med validerad INSERT-policy
--    - Kategori måste vara ett av de godkända värdena
--    - user_id (medlems-ID) måste ha rimligt format: 3–20 alfanumeriska tecken
--    - Samma person får inte redan stå i kön med status 'waiting'
CREATE POLICY "Validated insert" ON public.queue
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    category IN (
      '3D-print', 'Laserskärning', 'Plotter', 'Printing',
      'Tröjtryck', 'Muggtryck', 'CNC/Verkstad'
    )
    AND user_id ~ '^[a-zA-Z0-9]{3,20}$'
    AND NOT EXISTS (
      SELECT 1 FROM public.queue existing
      WHERE existing.user_id = user_id
        AND existing.status = 'waiting'
    )
  );

-- 3. Ge authenticated (personal) rätt att DELETE via RLS
--    (server action verifierar dessutom att användaren finns i staff-tabellen)
CREATE POLICY "Staff can delete queue entries" ON public.queue
  FOR DELETE TO authenticated
  USING (true);
