-- Marca Muntanyes: initial schema, RLS and storage policies.
-- Run with `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24 and username ~ '^[a-z0-9_]+$'),
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are readable by any authenticated user"
  on profiles for select
  to authenticated
  using (true);

create policy "users manage their own profile"
  on profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "users update their own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Create a profile row automatically when a new auth user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Friendships (directed request with status)
-- ---------------------------------------------------------------------------
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles (id) on delete cascade,
  addressee_id uuid not null references profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  constraint no_self_friendship check (requester_id <> addressee_id),
  constraint unique_pair unique (requester_id, addressee_id)
);

create index if not exists friendships_addressee_idx on friendships (addressee_id);
create index if not exists friendships_requester_idx on friendships (requester_id);

alter table friendships enable row level security;

create policy "users see their own friendships"
  on friendships for select
  to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "users send friend requests"
  on friendships for insert
  to authenticated
  with check (requester_id = auth.uid());

create policy "participants update a friendship"
  on friendships for update
  to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid())
  with check (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "participants delete a friendship"
  on friendships for delete
  to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- Helper: are two users accepted friends?
create or replace function are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$$;

-- Helper: can the current user view content owned by owner_id?
create or replace function can_view(owner_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select owner_id = auth.uid() or are_friends(owner_id, auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Routes
-- ---------------------------------------------------------------------------
create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  description text,
  route_date date,
  source text not null default 'manual' check (source in ('manual', 'gpx', 'kml')),
  track_geojson jsonb,
  distance_m numeric,
  elevation_gain_m numeric,
  elevation_loss_m numeric,
  duration_min numeric,
  difficulty text check (difficulty in ('facil', 'moderada', 'dificil')),
  created_at timestamptz not null default now()
);

create index if not exists routes_user_idx on routes (user_id);

alter table routes enable row level security;

create policy "owner or friends can view a route"
  on routes for select
  to authenticated
  using (can_view(user_id));

create policy "users create their own routes"
  on routes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users update their own routes"
  on routes for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users delete their own routes"
  on routes for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Summits (standalone, or attached to a route)
-- ---------------------------------------------------------------------------
create table if not exists summits (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references routes (id) on delete set null,
  user_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  elevation_m numeric,
  lat double precision not null,
  lng double precision not null,
  notes text,
  reached_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists summits_user_idx on summits (user_id);
create index if not exists summits_route_idx on summits (route_id);

alter table summits enable row level security;

create policy "owner or friends can view a summit"
  on summits for select
  to authenticated
  using (can_view(user_id));

create policy "users create their own summits"
  on summits for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users update their own summits"
  on summits for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users delete their own summits"
  on summits for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Route photos (metadata; binaries live in the `route-photos` storage bucket)
-- ---------------------------------------------------------------------------
create table if not exists route_photos (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  storage_path text not null unique,
  caption text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

create index if not exists route_photos_route_idx on route_photos (route_id);

alter table route_photos enable row level security;

create policy "owner or friends can view route photos"
  on route_photos for select
  to authenticated
  using (can_view(user_id));

create policy "users add photos to their own routes"
  on route_photos for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from routes r where r.id = route_id and r.user_id = auth.uid())
  );

create policy "users delete their own route photos"
  on route_photos for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage bucket for photos: private, path convention `${route_id}/${file}`
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('route-photos', 'route-photos', false)
on conflict (id) do nothing;

create policy "owner or friends can read route photo files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'route-photos'
    and exists (
      select 1 from routes r
      where r.id::text = (storage.foldername(name))[1]
        and can_view(r.user_id)
    )
  );

create policy "users upload photo files to their own routes"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'route-photos'
    and exists (
      select 1 from routes r
      where r.id::text = (storage.foldername(name))[1]
        and r.user_id = auth.uid()
    )
  );

create policy "users delete their own route photo files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'route-photos'
    and exists (
      select 1 from routes r
      where r.id::text = (storage.foldername(name))[1]
        and r.user_id = auth.uid()
    )
  );
