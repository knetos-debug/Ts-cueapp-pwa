-- V2 Fas 1: Staff-tabell för Supabase Auth
-- Personal loggar in via magic link — session kopplas till deras rad här

CREATE TABLE IF NOT EXISTS public.staff (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'staff'
               CHECK (role IN ('staff', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Bara inloggad personal som finns i tabellen kan läsa staff-data
CREATE POLICY "Staff can read staff" ON public.staff
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.staff));

-- ─────────────────────────────────────────────────────────────────────────────
-- Så här lägger du till ett nytt staff-konto efter att personen loggat in:
--
--   1. Be personen klicka magic link → auth.users-raden skapas automatiskt
--   2. Hitta deras UUID i Supabase Dashboard → Authentication → Users
--   3. Kör:
--        INSERT INTO public.staff (id, email, name, role)
--        VALUES ('<uuid>', 'namn@example.com', 'Förnamn Efternamn', 'staff');
-- ─────────────────────────────────────────────────────────────────────────────
