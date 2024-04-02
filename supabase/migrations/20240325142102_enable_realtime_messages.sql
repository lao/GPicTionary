
-- Turn on security
alter table public.messages
disable row level security;

-- Allow anonymous access
create policy "Allow anonymous access" on public.messages
for all to anon using (true);

-- add a table to the publication
alter publication supabase_realtime add table messages;