-- 1. Create recurring_transactions table
create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  amount numeric not null check (amount > 0),
  type text check (type in ('income', 'expense')) not null,
  category_id uuid references public.categories(id) on delete set null,
  frequency text check (frequency in ('monthly', 'weekly', 'yearly')) not null,
  next_due_date date not null,
  auto_add boolean default true,
  reminder_days_before int default 3,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS on recurring_transactions
alter table public.recurring_transactions enable row level security;

create policy "Users can view own recurring transactions"
  on public.recurring_transactions for select using (auth.uid() = user_id);
create policy "Users can insert own recurring transactions"
  on public.recurring_transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own recurring transactions"
  on public.recurring_transactions for update using (auth.uid() = user_id);
create policy "Users can delete own recurring transactions"
  on public.recurring_transactions for delete using (auth.uid() = user_id);


-- 2. Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text check (type in ('budget_alert', 'bill_due', 'goal_milestone')) not null,
  message text not null,
  read boolean default false,
  related_id uuid,
  created_at timestamptz default now()
);

-- Index on (user_id, read, created_at desc) for fast notification queries
create index if not exists idx_notifications_user_read_created
  on public.notifications (user_id, read, created_at desc);

-- Enable RLS on notifications
alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);
create policy "Users can insert own notifications"
  on public.notifications for insert with check (auth.uid() = user_id);
create policy "Users can update own notifications"
  on public.notifications for update using (auth.uid() = user_id);
create policy "Users can delete own notifications"
  on public.notifications for delete using (auth.uid() = user_id);
