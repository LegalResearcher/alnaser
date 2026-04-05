
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. غرف المنافسة
SELECT cron.schedule(
  'cleanup-battle-rooms',
  '0 3 * * *',
  $$
    WITH to_delete AS (
      SELECT br.id, br.status,
             COUNT(bp.id) AS players_count
      FROM public.battle_rooms br
      LEFT JOIN public.battle_players bp ON bp.room_id = br.id
      WHERE br.expires_at < NOW() - INTERVAL '24 hours'
      GROUP BY br.id, br.status
    )
    UPDATE public.platform_stats SET
      total_battle_rooms    = total_battle_rooms    + (SELECT COUNT(*) FROM to_delete),
      total_battle_finished = total_battle_finished + (SELECT COUNT(*) FROM to_delete WHERE status = 'finished'),
      total_battle_players  = total_battle_players  + (SELECT COALESCE(SUM(players_count), 0) FROM to_delete),
      updated_at = NOW()
    WHERE id = 1;

    DELETE FROM public.battle_players
    WHERE room_id IN (
      SELECT id FROM public.battle_rooms
      WHERE expires_at < NOW() - INTERVAL '24 hours'
    );

    DELETE FROM public.battle_rooms
    WHERE expires_at < NOW() - INTERVAL '24 hours';
  $$
);

-- 2. الزيارات
SELECT cron.schedule(
  'cleanup-site-analytics',
  '0 3 * * *',
  $$
    WITH visit_counts AS (
      SELECT COUNT(*) AS cnt FROM public.site_analytics
      WHERE created_at < NOW() - INTERVAL '30 days'
    ),
    level_counts AS (
      SELECT
        split_part(page_path, '/', 3) AS level_id,
        COUNT(*) AS cnt
      FROM public.site_analytics
      WHERE created_at < NOW() - INTERVAL '30 days'
        AND page_path LIKE '/levels/%'
        AND split_part(page_path, '/', 3) != ''
      GROUP BY level_id
    ),
    level_json AS (
      SELECT COALESCE(jsonb_object_agg(level_id, cnt), '{}'::jsonb) AS obj FROM level_counts
    )
    UPDATE public.platform_stats SET
      total_visits = total_visits + (SELECT cnt FROM visit_counts),
      level_visits = (
        SELECT COALESCE(jsonb_object_agg(
          key,
          COALESCE((ps.level_visits->>key)::bigint, 0) + COALESCE((lj.obj->>key)::bigint, 0)
        ), ps.level_visits)
        FROM public.platform_stats ps, level_json lj, jsonb_each_text(COALESCE(ps.level_visits, '{}') || COALESCE(lj.obj, '{}'))
        WHERE ps.id = 1
      ),
      updated_at = NOW()
    WHERE id = 1;

    DELETE FROM public.site_analytics
    WHERE created_at < NOW() - INTERVAL '30 days';
  $$
);

-- 3. نتائج الاختبارات
SELECT cron.schedule(
  'cleanup-exam-results',
  '0 3 * * *',
  $$
    WITH to_delete AS (
      SELECT er.id, er.passed, s.name AS subject_name
      FROM public.exam_results er
      LEFT JOIN public.subjects s ON s.id = er.subject_id
      WHERE er.created_at < NOW() - INTERVAL '7 days'
    ),
    counts AS (
      SELECT
        COUNT(*)                          AS total,
        COUNT(*) FILTER (WHERE passed)    AS passed_count,
        COUNT(*) FILTER (WHERE NOT passed) AS failed_count
      FROM to_delete
    ),
    by_subject AS (
      SELECT
        subject_name,
        COUNT(*)                           AS total,
        COUNT(*) FILTER (WHERE passed)     AS passed_c,
        COUNT(*) FILTER (WHERE NOT passed) AS failed_c
      FROM to_delete
      WHERE subject_name IS NOT NULL
      GROUP BY subject_name
    ),
    subj_exams AS (
      SELECT COALESCE(jsonb_object_agg(subject_name, total), '{}'::jsonb) AS obj FROM by_subject
    ),
    subj_passed AS (
      SELECT COALESCE(jsonb_object_agg(subject_name, passed_c), '{}'::jsonb) AS obj FROM by_subject
    ),
    subj_failed AS (
      SELECT COALESCE(jsonb_object_agg(subject_name, failed_c), '{}'::jsonb) AS obj FROM by_subject
    )
    UPDATE public.platform_stats SET
      total_exams  = total_exams  + (SELECT total        FROM counts),
      total_passed = total_passed + (SELECT passed_count FROM counts),
      total_failed = total_failed + (SELECT failed_count FROM counts),
      exams_by_subject = (
        SELECT COALESCE(jsonb_object_agg(key,
          COALESCE((ps.exams_by_subject->>key)::bigint, 0) + COALESCE((se.obj->>key)::bigint, 0)
        ), ps.exams_by_subject)
        FROM public.platform_stats ps, subj_exams se, jsonb_each_text(COALESCE(ps.exams_by_subject, '{}') || COALESCE(se.obj, '{}'))
        WHERE ps.id = 1
      ),
      passed_by_subject = (
        SELECT COALESCE(jsonb_object_agg(key,
          COALESCE((ps.passed_by_subject->>key)::bigint, 0) + COALESCE((sp.obj->>key)::bigint, 0)
        ), ps.passed_by_subject)
        FROM public.platform_stats ps, subj_passed sp, jsonb_each_text(COALESCE(ps.passed_by_subject, '{}') || COALESCE(sp.obj, '{}'))
        WHERE ps.id = 1
      ),
      failed_by_subject = (
        SELECT COALESCE(jsonb_object_agg(key,
          COALESCE((ps.failed_by_subject->>key)::bigint, 0) + COALESCE((sf.obj->>key)::bigint, 0)
        ), ps.failed_by_subject)
        FROM public.platform_stats ps, subj_failed sf, jsonb_each_text(COALESCE(ps.failed_by_subject, '{}') || COALESCE(sf.obj, '{}'))
        WHERE ps.id = 1
      ),
      updated_at = NOW()
    WHERE id = 1;

    DELETE FROM public.exam_results
    WHERE created_at < NOW() - INTERVAL '7 days';
  $$
);

-- 4. جلسات التحدي
SELECT cron.schedule(
  'cleanup-challenge-sessions',
  '0 3 * * *',
  $$
    DELETE FROM public.challenge_results
    WHERE session_id IN (
      SELECT id FROM public.challenge_sessions
      WHERE expires_at < NOW() - INTERVAL '7 days'
    );
    DELETE FROM public.challenge_sessions
    WHERE expires_at < NOW() - INTERVAL '7 days';
  $$
);

-- 5. البلاغات والاقتراحات المعالجة
SELECT cron.schedule(
  'cleanup-processed-reports',
  '0 3 * * *',
  $$
    DELETE FROM public.question_reports
    WHERE status = 'resolved'
      AND created_at < NOW() - INTERVAL '24 hours';
    DELETE FROM public.question_suggestions
    WHERE status IN ('approved', 'rejected')
      AND created_at < NOW() - INTERVAL '24 hours';
  $$
);

-- 6. سجل المنافسات
SELECT cron.schedule(
  'cleanup-battle-history',
  '0 3 * * *',
  $$
    DELETE FROM public.battle_history
    WHERE played_at < NOW() - INTERVAL '7 days';
  $$
);

-- 7. تنظيف سجل pg_cron
SELECT cron.schedule(
  'cleanup-cron-logs',
  '0 4 * * *',
  $$
    DELETE FROM cron.job_run_details
    WHERE end_time < NOW() - INTERVAL '7 days';
  $$
);
