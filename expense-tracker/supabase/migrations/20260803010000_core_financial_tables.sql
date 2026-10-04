-- 1. Create categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text check (type in ('income', 'expense')) not null,
  icon text,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS on categories
alter table public.categories enable row level security;

create policy "Users can view own categories"
  on public.categories for select using (auth.uid() = user_id);
create policy "Users can insert own categories"
  on public.categories for insert with check (auth.uid() = user_id);
create policy "Users can update own categories"
  on public.categories for update using (auth.uid() = user_id);
create policy "Users can delete own categories"
  on public.categories for delete using (auth.uid() = user_id);

-- Function to seed default categories for a user
create or replace function public.seed_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  -- Expense Categories
  insert into public.categories (user_id, name, type, icon, is_default)
  values
    (p_user_id, 'Food', 'expense', 'Utensils', true),
    (p_user_id, 'Shopping', 'expense', 'ShoppingBag', true),
    (p_user_id, 'Transport', 'expense', 'Car', true),
    (p_user_id, 'Bills', 'expense', 'FileText', true),
    (p_user_id, 'Entertainment', 'expense', 'Tv', true),
    (p_user_id, 'Health', 'expense', 'Heart', true),
    (p_user_id, 'Rent', 'expense', 'Home', true),
    (p_user_id, 'Other', 'expense', 'MoreHorizontal', true),
    -- Income Categories
    (p_user_id, 'Salary', 'income', 'Briefcase', true),
    (p_user_id, 'Freelance', 'income', 'Laptop', true),
    (p_user_id, 'Other', 'income', 'DollarSign', true)
  on conflict do nothing;
end;
$$;

-- Update trigger function on_auth_user_created to seed categories
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  perform public.seed_default_categories(new.id);

  return new;
end;
$$;


-- 2. Create transactions table
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric not null check (amount > 0),
  type text check (type in ('income', 'expense')) not null,
  payment_method text check (payment_method in ('cash', 'card', 'upi', 'netbanking', 'other')),
  note text,
  ai_categorized boolean default false,
  transaction_date date not null default current_date,
  created_at timestamptz default now()
);

-- Index on (user_id, transaction_date) for fast filtering/history queries
create index if not exists idx_transactions_user_date
  on public.transactions (user_id, transaction_date desc);

-- Enable RLS on transactions
alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions"
  on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions"
  on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions"
  on public.transactions for delete using (auth.uid() = user_id);


-- 3. Create fixed_expenses table
create table if not exists public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  amount numeric not null check (amount >= 0),
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz default now()
);

-- Enable RLS on fixed_expenses
alter table public.fixed_expenses enable row level security;

create policy "Users can view own fixed expenses"
  on public.fixed_expenses for select using (auth.uid() = user_id);
create policy "Users can insert own fixed expenses"
  on public.fixed_expenses for insert with check (auth.uid() = user_id);
create policy "Users can update own fixed expenses"
  on public.fixed_expenses for update using (auth.uid() = user_id);
create policy "Users can delete own fixed expenses"
  on public.fixed_expenses for delete using (auth.uid() = user_id);

-- One-time migration function to backfill existing profiles.fixed_expenses jsonb arrays
do $$
declare
  prof record;
  exp jsonb;
  cat_id uuid;
begin
  for prof in select id, fixed_expenses from public.profiles where fixed_expenses is not null loop
    for exp in select * from jsonb_array_elements(prof.fixed_expenses) loop
      select id into cat_id
        from public.categories
        where user_id = prof.id and type = 'expense' and lower(name) = lower(exp->>'name')
        limit 1;
      
      if cat_id is null then
        select id into cat_id
          from public.categories
          where user_id = prof.id and type = 'expense' and is_default = true and name = 'Other'
          limit 1;
      end if;

      insert into public.fixed_expenses (user_id, name, amount, category_id)
      values (
        prof.id,
        coalesce(exp->>'name', 'Fixed Expense'),
        coalesce((exp->>'amount')::numeric, 0),
        cat_id
      )
      on conflict do nothing;
    end loop;
  end loop;
end;
$$;


-- 4. Create budgets table
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  monthly_limit numeric not null check (monthly_limit >= 0),
  month date not null, -- first of month marker (e.g. 2026-08-01)
  created_at timestamptz default now(),
  unique (user_id, category_id, month)
);

-- Enable RLS on budgets
alter table public.budgets enable row level security;

create policy "Users can view own budgets"
  on public.budgets for select using (auth.uid() = user_id);
create policy "Users can insert own budgets"
  on public.budgets for insert with check (auth.uid() = user_id);
create policy "Users can update own budgets"
  on public.budgets for update using (auth.uid() = user_id);
create policy "Users can delete own budgets"
  on public.budgets for delete using (auth.uid() = user_id);


-- 5. Create goals table
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  target_amount numeric not null check (target_amount > 0),
  current_amount numeric default 0 check (current_amount >= 0),
  target_date date,
  status text default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at timestamptz default now()
);

-- Enable RLS on goals
alter table public.goals enable row level security;

create policy "Users can view own goals"
  on public.goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals"
  on public.goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals"
  on public.goals for update using (auth.uid() = user_id);
create policy "Users can delete own goals"
  on public.goals for delete using (auth.uid() = user_id);
