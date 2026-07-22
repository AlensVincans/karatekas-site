alter table stock_levels
  add column if not exists reserved integer not null default 0;

create table if not exists stock_history (
  id text primary key,
  variation_id text not null,
  action text not null,
  quantity integer not null default 0,
  old_physical integer,
  new_physical integer,
  old_reserved integer,
  new_reserved integer,
  actor_user_id text,
  order_id text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists stock_history_variation_idx on stock_history (variation_id);
create index if not exists stock_history_order_idx on stock_history (order_id);

create table if not exists payment_status_history (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  provider text not null default 'montonio',
  previous_status text,
  next_status text not null,
  provider_payment_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_status_history_order_idx on payment_status_history (order_id);
