CREATE POLICY "Allow anon delete on folders" ON public.drive_folders FOR DELETE USING (true);
CREATE POLICY "Allow anon delete on files" ON public.drive_files FOR DELETE USING (true);