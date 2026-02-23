-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bills table
create table bills (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  total_amount decimal(12, 2) default 0.00 not null,
  status text check (status in ('unpaid', 'paid', 'pending')) default 'unpaid' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bill Items table
create table bill_items (
  id uuid default uuid_generate_v4() primary key,
  bill_id uuid references bills(id) on delete cascade not null,
  name text not null,
  original_price decimal(12, 2) not null,
  discount decimal(12, 2) default 0.00 not null,
  final_price decimal(12, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security)
alter table profiles enable row level security;
alter table bills enable row level security;
alter table bill_items enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile." on profiles
  for update using (auth.uid() = id);

-- Policies for Bills
create policy "Users can view their own bills." on bills
  for select using (auth.uid() = user_id);

create policy "Users can insert their own bills." on bills
  for insert with check (auth.uid() = user_id);

-- Policies for Bill Items
create policy "Users can view items of their own bills." on bill_items
  for select using (
    exists (
      select 1 from bills
      where bills.id = bill_items.bill_id
      and bills.user_id = auth.uid()
    )
  );

-- Realtime settings (Run these in Supabase Dashboard)
-- alter publication supabase_realtime add table bills;
-- alter publication supabase_realtime add table bill_items;
