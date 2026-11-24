-- Edição de apps publicados: downloads podem ser atualizados e removidos.
drop policy if exists "downloads update" on public.app_downloads;
create policy "downloads update" on public.app_downloads for update using (true) with check (true);

drop policy if exists "downloads delete" on public.app_downloads;
create policy "downloads delete" on public.app_downloads for delete using (true);
