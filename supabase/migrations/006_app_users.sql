-- 006_app_users.sql
-- Klassiskt username/password-auth, ersätter Supabase Auth (magic link)

CREATE TABLE IF NOT EXISTS public.app_users (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username         TEXT        NOT NULL UNIQUE,
  password_hash    TEXT        NOT NULL,
  display_name     TEXT        NOT NULL,
  role             TEXT        NOT NULL DEFAULT 'user'
                               CHECK (role IN ('admin','superuser','user','kiosk')),
  visible_password TEXT,       -- lagras bara för kiosk-konton (delas med personal)
  created_by       UUID        REFERENCES public.app_users(id) ON DELETE SET NULL,
  active           BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
-- All åtkomst sker via service role i server actions. Ingen direkt anon-åtkomst.

-- Initial admin-konto: username=admin, password=andramig
-- Byt lösenord direkt via adminpanelen efter första login!
INSERT INTO public.app_users (username, password_hash, display_name, role)
VALUES (
  'admin',
  '$2b$10$jHyr2B76mNWPc3ciJTxo8ewLjkjGjI64oD.qijdx87WCUqOFyjzw6',
  'Administrator',
  'admin'
) ON CONFLICT (username) DO NOTHING;
