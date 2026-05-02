-- 1. Add columns to battle_rooms for server-driven engine
ALTER TABLE public.battle_rooms 
  ADD COLUMN IF NOT EXISTS phase_started_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_phase text DEFAULT 'question';

-- 2. Create battle_session_results table for multi-exam session history
CREATE TABLE IF NOT EXISTS public.battle_session_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.battle_players(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  exam_number int NOT NULL,
  exam_label text NOT NULL,
  total_questions int NOT NULL,
  correct_count int NOT NULL,
  wrong_count int NOT NULL,
  percentage float NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.battle_session_results ENABLE ROW LEVEL SECURITY;

-- Public access policies (matches battle_rooms pattern)
CREATE POLICY "battle_session_results_public_read"
  ON public.battle_session_results FOR SELECT
  USING (true);

CREATE POLICY "battle_session_results_public_insert"
  ON public.battle_session_results FOR INSERT
  WITH CHECK (true);

-- Index for faster queries by room
CREATE INDEX IF NOT EXISTS idx_battle_session_results_room 
  ON public.battle_session_results(room_id, exam_number);

-- Add to realtime publication so all clients see updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_session_results;