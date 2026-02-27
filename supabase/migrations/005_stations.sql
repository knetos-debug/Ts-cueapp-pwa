-- V2 Fas 2: Stations — RLS-policies och seed-data
-- Kör i Supabase SQL Editor

-- 1. RLS-policies
CREATE POLICY "Anyone can read stations" ON public.stations
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Staff can update stations" ON public.stations
  FOR UPDATE TO authenticated
  USING (true);

-- 2. Se till att stations-tabellen är med i realtime-publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.stations;

-- 3. Seed: en rad per maskin-kategori
INSERT INTO public.stations (name, machine_type, status) VALUES
  ('3D-print',      '3D-print',      'available'),
  ('Laserskärning', 'Laserskärning', 'available'),
  ('Plotter',       'Plotter',       'available'),
  ('Printing',      'Printing',      'available'),
  ('Tröjtryck',     'Tröjtryck',     'available'),
  ('Muggtryck',     'Muggtryck',     'available'),
  ('CNC/Verkstad',  'CNC/Verkstad',  'available')
ON CONFLICT DO NOTHING;
