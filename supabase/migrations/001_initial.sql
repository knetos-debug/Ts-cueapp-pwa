-- Köapp: profiles, queue, stations
-- PWA för kösystem till makerspace

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN (
    '3D-print', 'Laserskärning', 'Plotter', 'Printing',
    'Tröjtryck', 'Muggtryck', 'CNC/Verkstad'
  )),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'done')),
  staff_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  machine_type TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'maintenance')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own queue entries"
  ON public.queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own queue entries"
  ON public.queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can read all queue entries"
  ON public.queue FOR SELECT
  USING (true);

CREATE POLICY "Staff can update queue"
  ON public.queue FOR UPDATE
  USING (true);

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.queue;
