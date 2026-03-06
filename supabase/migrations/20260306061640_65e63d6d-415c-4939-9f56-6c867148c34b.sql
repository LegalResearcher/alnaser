ALTER TABLE public.levels ADD COLUMN is_disabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.levels ADD COLUMN disabled_message text;