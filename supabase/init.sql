-- 1. Crear tabla de perfiles
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text,
  role text not null default 'growth_manager',
  company text default '',
  country text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Trigger: crear perfil automáticamente cuando se registra un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, role, company)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'growth_manager'),
    coalesce(new.raw_user_meta_data ->> 'company', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Row Level Security (opcional pero recomendado)
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
