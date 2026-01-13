-- Create user_preferences table
create table if not exists public.user_preferences (
    user_id uuid references auth.users not null primary key,
    theme text check (theme in ('sunrise', 'sunset')) default 'sunrise',
    location jsonb default '{}'::jsonb,
    phone_number text,
    notifications_enabled boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_preferences enable row level security;

-- Create policies
create policy "Users can view their own preferences"
    on public.user_preferences for select
    using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
    on public.user_preferences for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
    on public.user_preferences for update
    using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_updated_at
    before update on public.user_preferences
    for each row
    execute procedure public.handle_updated_at();
