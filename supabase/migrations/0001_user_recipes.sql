-- User-contributed recipes: accounts, recipes with a moderation workflow, an audit log, and photo
-- storage. Paste into the Supabase SQL editor (or run with the Supabase CLI) once per project.
--
-- Security model: the browser talks to Supabase with the publishable key, so everything here is
-- enforced by the database. Row Level Security decides which rows each person sees, column grants
-- stop anyone writing status fields directly, and every status change goes through a function
-- below that checks who is asking and what the recipe's current status allows.

create type public.recipe_status as enum
  ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'published');

-- Profiles ---------------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default 'Home cook'
    check (char_length(trim(display_name)) between 1 and 60),
  -- Promote someone with: update public.profiles set role = 'moderator' where id = '<user id>';
  role text not null default 'contributor' check (role in ('contributor', 'moderator')),
  created_at timestamptz not null default now()
);

-- Every new account gets a profile. The display name starts generic: deriving it from the email
-- would publish part of the address.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Security definer, so policies can ask without recursing into the profiles policies.
create function public.is_moderator() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'moderator')
$$;

alter table public.profiles enable row level security;
create policy "Read own profile, or any if moderator" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_moderator());
create policy "Update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated; -- never role

-- Recipes ----------------------------------------------------------------------------------------

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  title text not null default '' check (char_length(title) <= 120),
  description text not null default '' check (char_length(description) <= 1000),
  category text not null default '' check (char_length(category) <= 60),
  cuisine text not null default '' check (char_length(cuisine) <= 60),
  -- [{ "name": "flour", "measure": "200g" }]
  ingredients jsonb not null default '[]'
    check (jsonb_typeof(ingredients) = 'array' and jsonb_array_length(ingredients) <= 60
      and octet_length(ingredients::text) <= 20000),
  -- [{ "title": null, "steps": ["Heat the oven…"] }], the shape the site already uses
  method jsonb not null default '[]'
    check (jsonb_typeof(method) = 'array' and jsonb_array_length(method) <= 20
      and octet_length(method::text) <= 40000),
  -- Path in the private recipe-uploads bucket: <author id>/<file>
  image_path text check (char_length(image_path) <= 300),
  status public.recipe_status not null default 'draft',
  review_note text check (char_length(review_note) <= 2000),
  reviewed_by uuid references public.profiles,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index recipes_author_idx on public.recipes (author_id);
create index recipes_status_idx on public.recipes (status);

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger recipes_touch before update on public.recipes
  for each row execute function public.touch_updated_at();

-- At most 20 new drafts a day per person, to limit abuse.
create function public.limit_new_recipes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.recipes
      where author_id = new.author_id and created_at > now() - interval '1 day') >= 20 then
    raise exception 'You''ve started a lot of recipes today. Try again tomorrow.'
      using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger recipes_limit before insert on public.recipes
  for each row execute function public.limit_new_recipes();

alter table public.recipes enable row level security;
create policy "Authors see their own, moderators see all" on public.recipes
  for select to authenticated using (author_id = auth.uid() or public.is_moderator());
create policy "Authors create their own drafts" on public.recipes
  for insert to authenticated with check (author_id = auth.uid());
-- Locked once submitted: authors edit drafts and rejected recipes only.
create policy "Authors edit drafts and rejected recipes" on public.recipes
  for update to authenticated
  using (author_id = auth.uid() and status in ('draft', 'rejected'))
  with check (author_id = auth.uid());
create policy "Authors delete drafts and rejected recipes" on public.recipes
  for delete to authenticated using (author_id = auth.uid() and status in ('draft', 'rejected'));

-- Content columns only. Status, review and timestamp columns are written by the functions below.
revoke all on public.recipes from anon, authenticated;
grant select, delete on public.recipes to authenticated;
grant insert (title, description, category, cuisine, ingredients, method, image_path)
  on public.recipes to authenticated;
grant update (title, description, category, cuisine, ingredients, method, image_path)
  on public.recipes to authenticated;

-- Audit log --------------------------------------------------------------------------------------

create table public.recipe_events (
  id bigint generated always as identity primary key,
  recipe_id uuid not null references public.recipes on delete cascade,
  actor_id uuid references public.profiles on delete set null,
  from_status public.recipe_status,
  to_status public.recipe_status not null,
  note text,
  created_at timestamptz not null default now()
);
create index recipe_events_recipe_idx on public.recipe_events (recipe_id);

alter table public.recipe_events enable row level security;
create policy "Authors and moderators read a recipe's history" on public.recipe_events
  for select to authenticated using (
    public.is_moderator()
    or exists (select 1 from public.recipes r where r.id = recipe_id and r.author_id = auth.uid())
  );
revoke all on public.recipe_events from anon, authenticated;
grant select on public.recipe_events to authenticated;

-- Status changes ---------------------------------------------------------------------------------
-- One function does every transition, so the rules live in one table of allowed moves.

create function public.change_recipe_status(
  recipe uuid, next_status public.recipe_status, reason text default null
) returns public.recipes
language plpgsql security definer set search_path = '' as $$
declare
  r public.recipes;
  me uuid := auth.uid();
  moderator boolean := public.is_moderator();
  allowed boolean;
  step_count int;
  previous public.recipe_status;
begin
  if me is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  select * into r from public.recipes where id = recipe for update;
  previous := r.status;
  if not found or (r.author_id <> me and not moderator) then
    raise exception 'Recipe not found' using errcode = 'P0002';
  end if;

  allowed := case
    -- Authors
    when r.author_id = me and r.status in ('draft', 'rejected') and next_status = 'submitted' then true
    when r.author_id = me and r.status = 'submitted' and next_status = 'draft' then true
    -- Moderators (who may not review their own recipes)
    when moderator and r.author_id <> me and r.status = 'submitted' and next_status = 'under_review' then true
    when moderator and r.author_id <> me and r.status in ('submitted', 'under_review')
      and next_status in ('approved', 'rejected') then true
    when moderator and r.status = 'approved' and next_status = 'published' then true
    when moderator and r.status = 'published' and next_status = 'approved' then true -- unpublish
    else false
  end;
  if not allowed then
    raise exception 'A % recipe can''t be moved to %', r.status, next_status using errcode = '42501';
  end if;

  if next_status = 'rejected' and coalesce(trim(reason), '') = '' then
    raise exception 'Say why the recipe was rejected, so the author can fix it' using errcode = '22023';
  end if;

  if next_status = 'submitted' then
    select coalesce(sum(jsonb_array_length(s -> 'steps')), 0) into step_count
      from jsonb_array_elements(r.method) s where jsonb_typeof(s -> 'steps') = 'array';
    if trim(r.title) = '' or trim(r.category) = '' or jsonb_array_length(r.ingredients) = 0
       or step_count = 0 or r.image_path is null then
      raise exception 'Add a title, a category, a photo, at least one ingredient and at least one step before submitting'
        using errcode = '22023';
    end if;
    if (select count(*) from public.recipe_events
        where actor_id = me and recipe_events.to_status = 'submitted' and created_at > now() - interval '1 day') >= 5 then
      raise exception 'You can submit up to 5 recipes a day. Try again tomorrow.' using errcode = 'P0001';
    end if;
  end if;

  update public.recipes set
    status = next_status,
    submitted_at = case when next_status = 'submitted' then now() else submitted_at end,
    review_note = case
      when next_status in ('approved', 'rejected') then nullif(trim(reason), '')
      when next_status = 'submitted' then null
      else review_note end,
    reviewed_by = case when next_status in ('under_review', 'approved', 'rejected') then me else reviewed_by end,
    reviewed_at = case when next_status in ('approved', 'rejected') then now() else reviewed_at end,
    published_at = case when next_status = 'published' then now()
      when previous = 'published' then null else published_at end
  where id = recipe
  returning * into r;

  insert into public.recipe_events (recipe_id, actor_id, from_status, to_status, note)
    values (recipe, me, previous, next_status, nullif(trim(reason), ''));
  return r;
end $$;

revoke all on function public.change_recipe_status from public, anon;
grant execute on function public.change_recipe_status to authenticated;

-- What the public site may read: published recipes and their author's display name, nothing else
-- (no review notes, ids of moderators or anything about unpublished work). The view runs as its
-- owner, so it can join profiles without opening that table to visitors.
create view public.published_recipes with (security_invoker = false) as
  select r.id, r.title, r.description, r.category, r.cuisine, r.ingredients, r.method,
         r.image_path, r.published_at, p.display_name as contributor
  from public.recipes r join public.profiles p on p.id = r.author_id
  where r.status = 'published';
revoke all on public.published_recipes from anon, authenticated;
grant select on public.published_recipes to anon, authenticated;

-- Photos -----------------------------------------------------------------------------------------
-- recipe-uploads is private: authors and moderators see a photo through short-lived signed links.
-- When a recipe is published, the server copies its photo into the public recipe-images bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('recipe-uploads', 'recipe-uploads', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('recipe-images', 'recipe-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Authors upload into their own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'recipe-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Authors and moderators view uploads" on storage.objects
  for select to authenticated
  using (bucket_id = 'recipe-uploads'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_moderator()));
create policy "Authors replace their own uploads" on storage.objects
  for update to authenticated
  using (bucket_id = 'recipe-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Authors delete their own uploads" on storage.objects
  for delete to authenticated
  using (bucket_id = 'recipe-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
-- recipe-images has no write policies: only the server (secret key) writes there.
