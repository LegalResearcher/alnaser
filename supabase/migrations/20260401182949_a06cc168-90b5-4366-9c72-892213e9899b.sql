
-- 1. تحديث جدول battle_rooms بأعمدة جديدة
ALTER TABLE public.battle_rooms
  ADD COLUMN IF NOT EXISTS password        TEXT,
  ADD COLUMN IF NOT EXISTS is_private      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scheduled_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS allow_teams     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS team1_name      TEXT DEFAULT 'الفريق الأول',
  ADD COLUMN IF NOT EXISTS team2_name      TEXT DEFAULT 'الفريق الثاني',
  ADD COLUMN IF NOT EXISTS question_type   TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS exam_form_id    TEXT,
  ADD COLUMN IF NOT EXISTS locked          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS extra_time_minutes INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS settings        JSONB DEFAULT '{}';

-- 2. تحديث جدول battle_players بأعمدة جديدة
ALTER TABLE public.battle_players
  ADD COLUMN IF NOT EXISTS team            TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS kicked          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS answers_json    JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avatar_color    TEXT DEFAULT '#6366f1';

-- 3. جدول سجل الغرف (battle_history)
CREATE TABLE IF NOT EXISTS public.battle_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code    TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  played_at    TIMESTAMPTZ DEFAULT NOW(),
  players_count INT DEFAULT 0,
  winner_name  TEXT,
  settings     JSONB DEFAULT '{}',
  stored_by    TEXT NOT NULL
);

ALTER TABLE public.battle_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "battle_history_public" ON public.battle_history FOR ALL USING (true) WITH CHECK (true);

-- 4. جدول global leaderboard (battle_leaderboard)
CREATE TABLE IF NOT EXISTS public.battle_leaderboard (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name  TEXT NOT NULL,
  total_wins   INT DEFAULT 0,
  total_games  INT DEFAULT 0,
  total_score  NUMERIC DEFAULT 0,
  best_pct     NUMERIC(5,2) DEFAULT 0,
  badges       JSONB DEFAULT '[]',
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.battle_leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leaderboard_public_read" ON public.battle_leaderboard FOR SELECT USING (true);
CREATE POLICY "leaderboard_public_upsert" ON public.battle_leaderboard FOR ALL USING (true) WITH CHECK (true);

-- 5. إضافة للـ realtime
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_history; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_leaderboard; EXCEPTION WHEN others THEN NULL; END;
END $$;
