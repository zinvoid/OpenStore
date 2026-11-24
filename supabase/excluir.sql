-- Exclusão de app pelo autor: confere a sessão e o dono no banco.
-- Os downloads e as avaliações saem junto (on delete cascade).

create or replace function public.openstore_delete_app(p_token uuid, p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user uuid;
  v_app  public.apps%rowtype;
begin
  select s.user_id into v_user
    from public.openstore_sessions s
   where s.token = p_token
     and s.expires_at > now();
  if v_user is null then
    raise exception 'session_invalid';
  end if;

  update public.openstore_sessions set last_seen = now() where token = p_token;

  select * into v_app from public.apps a where a.slug = p_slug;
  if v_app.id is null then
    raise exception 'app_missing';
  end if;
  if v_app.owner_id is distinct from v_user then
    raise exception 'not_owner';
  end if;

  delete from public.apps where id = v_app.id;

  return jsonb_build_object('slug', v_app.slug);
end;
$$;

grant execute on function public.openstore_delete_app(uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
