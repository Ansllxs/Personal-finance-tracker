-- Finance Tracker — esquema inicial
-- Ejecutar en el SQL Editor de Supabase o vía CLI

-- Extensiones
create extension if not exists "pgcrypto";

-- Perfiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Angie',
  email text,
  avatar_url text,
  currency text not null default 'CRC',
  theme text not null default 'light' check (theme in ('light', 'dark', 'system')),
  onboarding_completed boolean not null default false,
  monthly_income_expected integer not null default 295000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cuentas
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank', 'sinpe', 'cash', 'credit_card', 'savings_envelope')),
  initial_balance integer not null default 0,
  color text not null default '#D4A5A5',
  icon text not null default 'wallet',
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Categorías
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense', 'transfer', 'crochet')),
  scope text not null default 'personal' check (scope in ('personal', 'crochet', 'both')),
  color text not null default '#C9A0A0',
  icon text not null default 'tag',
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tarjetas de crédito (detalle extendido; la cuenta base es type=credit_card)
create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null unique references public.accounts(id) on delete cascade,
  credit_limit integer,
  statement_day integer check (statement_day is null or (statement_day >= 1 and statement_day <= 31)),
  payment_due_day integer check (payment_due_day is null or (payment_due_day >= 1 and payment_due_day <= 31)),
  minimum_payment integer,
  interest_rate numeric(6,3),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Movimientos / transacciones
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  type text not null check (type in (
    'income', 'expense', 'transfer', 'card_payment',
    'goal_contribution', 'crochet_income', 'crochet_expense'
  )),
  amount integer not null check (amount > 0),
  category_id uuid references public.categories(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  to_account_id uuid references public.accounts(id) on delete set null,
  goal_id uuid,
  description text,
  receipt_url text,
  tag text not null default 'personal' check (tag in ('personal', 'crochet')),
  status text not null default 'confirmed' check (status in ('confirmed', 'pending')),
  crochet_order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Presupuestos
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month integer not null check (month >= 1 and month <= 12),
  year integer not null check (year >= 2020),
  expected_income integer not null default 295000,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month, year)
);

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_id uuid not null references public.budgets(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  allocated_amount integer not null default 0,
  created_at timestamptz not null default now(),
  unique (budget_id, category_id)
);

-- Metas
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  image_url text,
  target_amount integer not null check (target_amount > 0),
  saved_amount integer not null default 0,
  target_date date,
  account_id uuid references public.accounts(id) on delete set null,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions
  drop constraint if exists transactions_goal_id_fkey;
alter table public.transactions
  add constraint transactions_goal_id_fkey
  foreign key (goal_id) references public.goals(id) on delete set null;

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  amount integer not null check (amount > 0),
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

-- Wishlist
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  image_url text,
  estimated_price integer,
  link text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'want' check (status in ('want', 'saving', 'bought')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Crochet: clientes
create table if not exists public.crochet_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  contact text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Crochet: productos
create table if not exists public.crochet_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  photo_url text,
  suggested_price integer,
  estimated_hours numeric(5,1),
  materials_cost_estimate integer not null default 0,
  stock integer not null default 0,
  is_custom_base boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Crochet: materiales
create table if not exists public.crochet_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'hilo',
  color text,
  purchase_cost integer not null default 0,
  quantity numeric(10,2) not null default 0,
  unit text not null default 'unidad',
  supplier text,
  min_level numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crochet_product_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.crochet_products(id) on delete cascade,
  material_id uuid not null references public.crochet_materials(id) on delete cascade,
  quantity_needed numeric(10,2) not null default 1,
  unique (product_id, material_id)
);

-- Crochet: pedidos
create table if not exists public.crochet_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references public.crochet_customers(id) on delete set null,
  product_id uuid references public.crochet_products(id) on delete set null,
  description text not null,
  photo_url text,
  requested_date date,
  delivery_date date,
  agreed_price integer not null default 0,
  advance_received integer not null default 0,
  status text not null default 'consulta' check (status in (
    'consulta', 'confirmado', 'en_proceso', 'listo', 'entregado', 'cancelado'
  )),
  payment_method text check (payment_method in ('sinpe', 'efectivo', 'transferencia')),
  materials_cost integer not null default 0,
  packaging_cost integer not null default 0,
  shipping_cost integer not null default 0,
  other_costs integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions
  drop constraint if exists transactions_crochet_order_id_fkey;
alter table public.transactions
  add constraint transactions_crochet_order_id_fkey
  foreign key (crochet_order_id) references public.crochet_orders(id) on delete set null;

create table if not exists public.crochet_order_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.crochet_orders(id) on delete cascade,
  amount integer not null check (amount > 0),
  date date not null default current_date,
  method text check (method in ('sinpe', 'efectivo', 'transferencia')),
  transaction_id uuid references public.transactions(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.crochet_business_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  category text not null check (category in ('Materiales', 'Empaques', 'Envíos', 'Herramientas', 'Otros')),
  amount integer not null check (amount > 0),
  description text,
  account_id uuid references public.accounts(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Índices
create index if not exists idx_accounts_user on public.accounts(user_id);
create index if not exists idx_categories_user on public.categories(user_id);
create index if not exists idx_transactions_user_date on public.transactions(user_id, date desc);
create index if not exists idx_transactions_type on public.transactions(user_id, type);
create index if not exists idx_transactions_tag on public.transactions(user_id, tag);
create index if not exists idx_budgets_user_period on public.budgets(user_id, year, month);
create index if not exists idx_goals_user on public.goals(user_id);
create index if not exists idx_wishlist_user on public.wishlist_items(user_id);
create index if not exists idx_credit_cards_user on public.credit_cards(user_id);
create index if not exists idx_crochet_orders_user on public.crochet_orders(user_id);
create index if not exists idx_crochet_orders_status on public.crochet_orders(user_id, status);
create index if not exists idx_crochet_customers_user on public.crochet_customers(user_id);
create index if not exists idx_crochet_products_user on public.crochet_products(user_id);
create index if not exists idx_crochet_materials_user on public.crochet_materials(user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'accounts', 'credit_cards', 'transactions', 'budgets',
    'goals', 'wishlist_items', 'crochet_customers', 'crochet_products',
    'crochet_materials', 'crochet_orders'
  ]
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- Crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Angie')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.credit_cards enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_items enable row level security;
alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.crochet_customers enable row level security;
alter table public.crochet_products enable row level security;
alter table public.crochet_materials enable row level security;
alter table public.crochet_product_materials enable row level security;
alter table public.crochet_orders enable row level security;
alter table public.crochet_order_payments enable row level security;
alter table public.crochet_business_expenses enable row level security;

-- Políticas: cada usuaria solo ve/edita sus datos
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

create policy "accounts_all_own" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_all_own" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "credit_cards_all_own" on public.credit_cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_all_own" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budgets_all_own" on public.budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budget_items_all_own" on public.budget_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_all_own" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goal_contributions_all_own" on public.goal_contributions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wishlist_all_own" on public.wishlist_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "crochet_customers_all_own" on public.crochet_customers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "crochet_products_all_own" on public.crochet_products for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "crochet_materials_all_own" on public.crochet_materials for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "crochet_product_materials_all_own" on public.crochet_product_materials for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "crochet_orders_all_own" on public.crochet_orders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "crochet_order_payments_all_own" on public.crochet_order_payments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "crochet_business_expenses_all_own" on public.crochet_business_expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket para comprobantes (crear también en Dashboard > Storage)
-- insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false);
-- create policy "receipts_own" on storage.objects for all
--   using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1])
--   with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
