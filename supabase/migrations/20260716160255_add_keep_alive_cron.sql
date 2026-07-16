-- keep-alive: نبضة خفيفة كل 4 أيام لمنع توقف المشروع بسبب عدم النشاط
SELECT cron.schedule(
  'keep-alive-ping',
  '0 2 */4 * *',
  $$
    UPDATE public.platform_stats
    SET updated_at = updated_at
    WHERE id = 1;
  $$
);
