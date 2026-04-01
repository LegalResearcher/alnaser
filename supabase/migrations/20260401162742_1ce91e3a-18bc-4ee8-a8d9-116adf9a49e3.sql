
-- 1. Battle rooms table
CREATE TABLE IF NOT EXISTS public.battle_rooms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,
  subject_id    UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  creator_name  TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'waiting',
  max_players   INT NOT NULL DEFAULT 10,
  questions_count INT NOT NULL DEFAULT 20,
  time_minutes  INT NOT NULL DEFAULT 30,
  exam_year     INT,
  exam_form     TEXT,
  question_ids  JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  started_at    TIMESTAMPTZ,
  finished_at   TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 hours'
);

-- 2. Battle players table
CREATE TABLE IF NOT EXISTS public.battle_players (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID NOT NULL REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
  player_name  TEXT NOT NULL,
  is_creator   BOOLEAN DEFAULT FALSE,
  status       TEXT NOT NULL DEFAULT 'waiting',
  score        INT DEFAULT 0,
  total_answered INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  percentage   NUMERIC(5,2) DEFAULT 0,
  time_seconds INT,
  progress     NUMERIC(5,2) DEFAULT 0,
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  finished_at  TIMESTAMPTZ
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_battle_rooms_code ON public.battle_rooms(code);
CREATE INDEX IF NOT EXISTS idx_battle_rooms_status ON public.battle_rooms(status);
CREATE INDEX IF NOT EXISTS idx_battle_players_room ON public.battle_players(room_id);

-- 4. RLS
ALTER TABLE public.battle_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "battle_rooms_public_read" ON public.battle_rooms FOR SELECT USING (true);
CREATE POLICY "battle_rooms_public_insert" ON public.battle_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "battle_rooms_public_update" ON public.battle_rooms FOR UPDATE USING (true);

CREATE POLICY "battle_players_public_read" ON public.battle_players FOR SELECT USING (true);
CREATE POLICY "battle_players_public_insert" ON public.battle_players FOR INSERT WITH CHECK (true);
CREATE POLICY "battle_players_public_update" ON public.battle_players FOR UPDATE USING (true);

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_players;
