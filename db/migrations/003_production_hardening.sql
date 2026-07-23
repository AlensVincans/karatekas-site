create table if not exists product_image_overrides (
  product_id text primary key references products(id) on delete cascade,
  images jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists audit_log (
  id text primary key,
  actor_user_id text,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_actor_idx on audit_log (actor_user_id);
create index if not exists audit_log_entity_idx on audit_log (entity_type, entity_id);
create index if not exists audit_log_created_idx on audit_log (created_at desc);

alter table products
  add column if not exists weight_grams integer,
  add column if not exists length_cm numeric(8, 2),
  add column if not exists width_cm numeric(8, 2),
  add column if not exists height_cm numeric(8, 2);

create table if not exists order_status_history (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  previous_status text,
  next_status text not null,
  actor_user_id text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx on order_status_history (order_id);
