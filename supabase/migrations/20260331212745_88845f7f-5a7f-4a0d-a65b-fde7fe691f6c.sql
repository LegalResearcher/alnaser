
ALTER TABLE public.subjects ADD COLUMN summary_url text DEFAULT NULL;

INSERT INTO storage.buckets (id, name, public) VALUES ('summaries', 'summaries', true);

CREATE POLICY "Anyone can view summaries" ON storage.objects FOR SELECT USING (bucket_id = 'summaries');
CREATE POLICY "Admins can upload summaries" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'summaries' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));
CREATE POLICY "Admins can update summaries" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'summaries' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));
CREATE POLICY "Admins can delete summaries" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'summaries' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));
