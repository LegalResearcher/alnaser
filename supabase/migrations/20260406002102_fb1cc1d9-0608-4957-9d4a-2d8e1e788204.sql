
CREATE TABLE IF NOT EXISTS public.app_installs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   TEXT NOT NULL UNIQUE,
  platform    TEXT DEFAULT 'android',
  installed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   TEXT NOT NULL,
  opened_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app can insert installs" ON public.app_installs FOR INSERT WITH CHECK (true);
CREATE POLICY "app can insert sessions" ON public.app_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "admin reads installs" ON public.app_installs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin reads sessions" ON public.app_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_app_sessions_opened ON public.app_sessions(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_sessions_device ON public.app_sessions(device_id);

ALTER TABLE public.platform_stats
  ADD COLUMN IF NOT EXISTS total_app_installs BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_app_sessions BIGINT NOT NULL DEFAULT 0;
