
-- المهمة الأولى: إنشاء جدول الإحصائيات التراكمية
CREATE TABLE IF NOT EXISTS public.platform_stats (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  total_visits            BIGINT NOT NULL DEFAULT 0,
  total_exams             BIGINT NOT NULL DEFAULT 0,
  total_passed            BIGINT NOT NULL DEFAULT 0,
  total_failed            BIGINT NOT NULL DEFAULT 0,
  level_visits            JSONB  NOT NULL DEFAULT '{}',
  exams_by_subject        JSONB  NOT NULL DEFAULT '{}',
  passed_by_subject       JSONB  NOT NULL DEFAULT '{}',
  failed_by_subject       JSONB  NOT NULL DEFAULT '{}',
  total_battle_rooms      BIGINT NOT NULL DEFAULT 0,
  total_battle_finished   BIGINT NOT NULL DEFAULT 0,
  total_battle_players    BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.platform_stats (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.platform_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read stats" ON public.platform_stats FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update stats" ON public.platform_stats FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- المهمة الثالثة: Indexes لتسريع الأداء
CREATE INDEX IF NOT EXISTS idx_questions_subject_status ON public.questions(subject_id, status);
CREATE INDEX IF NOT EXISTS idx_questions_subject_year ON public.questions(subject_id, exam_year);
CREATE INDEX IF NOT EXISTS idx_exam_results_subject_created ON public.exam_results(subject_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_battle_rooms_expires ON public.battle_rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_battle_rooms_status_created ON public.battle_rooms(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_analytics_created ON public.site_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_analytics_path ON public.site_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_question_reports_status ON public.question_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_suggestions_status ON public.question_suggestions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_sessions_expires ON public.challenge_sessions(expires_at);
