-- =========================================================
-- echaii POS + Business Management Database Schema
-- Run this script in the Supabase SQL Editor
-- =========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES / USERS TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'staff' check (role in ('admin', 'manager', 'staff')),
  phone text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. LOCATIONS TABLE
create table if not exists public.locations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  contact_person text,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. SALES TABLE
create table if not exists public.sales (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references public.locations(id) on delete set null,
  date date not null default current_date,
  cups_sold integer not null check (cups_sold >= 0),
  selling_price_per_cup numeric(10,2) not null check (selling_price_per_cup >= 0),
  total_revenue numeric(10,2) not null check (total_revenue >= 0),
  notes text,
  created_by text,
  created_at timestamptz default now()
);

-- 4. PURCHASES TABLE
create table if not exists public.purchases (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references public.locations(id) on delete set null,
  vendor_name text not null,
  date date not null default current_date,
  cups_purchased integer not null check (cups_purchased >= 0),
  purchase_price_per_cup numeric(10,2) not null check (purchase_price_per_cup >= 0),
  total_amount numeric(10,2) not null check (total_amount >= 0),
  notes text,
  created_by text,
  created_at timestamptz default now()
);

-- 5. INVENTORY TABLE
create table if not exists public.inventory (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references public.locations(id) on delete cascade,
  date date not null default current_date,
  opening_stock integer not null default 0,
  purchased_cups integer not null default 0,
  sold_cups integer not null default 0,
  wastage integer not null default 0,
  closing_stock integer not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. EXPENSES TABLE
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references public.locations(id) on delete set null,
  date date not null default current_date,
  category text not null check (category in ('Chai Cost', 'Cup Cost', 'Tissue Cost', 'Travelling / Transport', 'Other Expenses')),
  description text,
  amount numeric(10,2) not null check (amount >= 0),
  created_by text,
  created_at timestamptz default now()
);

-- 7. INVOICES TABLE
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text not null unique,
  location_id uuid references public.locations(id) on delete set null,
  date date not null default current_date,
  customer_name text not null,
  subtotal numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'Paid' check (status in ('Paid', 'Pending', 'Cancelled')),
  notes text,
  created_by text,
  created_at timestamptz default now()
);

-- 8. INVOICE ITEMS TABLE
create table if not exists public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  description text not null,
  quantity integer not null default 1,
  price numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0
);

-- 9. SETTINGS TABLE
create table if not exists public.business_settings (
  id uuid primary key default uuid_generate_v4(),
  business_name text not null default 'echaii',
  email text default 'admin@echaii.com',
  phone text default '+91 9876543210',
  address text default 'India',
  default_cup_price numeric(10,2) default 20.00,
  low_stock_threshold integer default 100,
  currency text default 'INR',
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.sales enable row level security;
alter table public.purchases enable row level security;
alter table public.inventory enable row level security;
alter table public.expenses enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.business_settings enable row level security;

-- Setup RLS Policies (Allow authenticated users to read and write)
create policy "Allow authenticated full access to profiles" on public.profiles for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to locations" on public.locations for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to sales" on public.sales for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to purchases" on public.purchases for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to inventory" on public.inventory for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to expenses" on public.expenses for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to invoices" on public.invoices for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to invoice_items" on public.invoice_items for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to business_settings" on public.business_settings for all using (auth.role() = 'authenticated');

-- Trigger to create a profile automatically on auth user sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', 'echaii User'), coalesce(new.raw_user_meta_data->>'role', 'staff'))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
