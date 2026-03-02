-- 008_served_by.sql
-- Spara vilken personal som tagit en person från kön

ALTER TABLE public.queue
  ADD COLUMN IF NOT EXISTS served_by TEXT;
