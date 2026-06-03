create table if not exists public.honor_certificates (
  id            uuid primary key default gen_random_uuid(),
  student_name  text not null,
  phone         text,
  governorate   text not null,
  level         text not null,
  level_label   text not null,
  rank          text not null,
  verify_code   text not null unique,
  status        text not null default 'pending',
  exported_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

GRANT INSERT ON public.honor_certificates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.honor_certificates TO authenticated;
GRANT ALL ON public.honor_certificates TO service_role;

alter table public.honor_certificates enable row level security;

create policy "allow_public_insert" on public.honor_certificates
  for insert to anon, authenticated
  with check (true);

create policy "allow_admin_select" on public.honor_certificates
  for select to authenticated
  using (true);

create policy "allow_admin_update" on public.honor_certificates
  for update to authenticated
  using (true);

create policy "allow_admin_delete" on public.honor_certificates
  for delete to authenticated
  using (true);

create index if not exists idx_honor_certificates_exported_at
  on public.honor_certificates (exported_at desc);

create index if not exists idx_honor_certificates_level
  on public.honor_certificates (level);