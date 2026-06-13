ALTER TABLE drive_files
  ADD COLUMN IF NOT EXISTS view_count     integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_drive_files_view_count
  ON drive_files (view_count DESC);

CREATE INDEX IF NOT EXISTS idx_drive_files_download_count
  ON drive_files (download_count DESC);

CREATE OR REPLACE FUNCTION increment_file_stat(
  p_file_id   integer,
  p_stat_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_stat_type = 'view' THEN
    UPDATE drive_files
       SET view_count = view_count + 1
     WHERE id = p_file_id;
  ELSIF p_stat_type = 'download' THEN
    UPDATE drive_files
       SET download_count = download_count + 1
     WHERE id = p_file_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_file_stat(integer, text)
  TO anon, authenticated;