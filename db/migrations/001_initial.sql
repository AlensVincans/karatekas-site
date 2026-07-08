create table if not exists kg_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists users (
  id text primary key,
  first_name text not null,
  last_name text not null,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('user', 'b2b', 'admin')),
  company text,
  vat_number text,
  credit_limit numeric(12, 2),
  payment_terms jsonb not null default '["card"]'::jsonb,
  email_confirmed boolean not null default false,
  confirmation_token text,
  confirmation_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_confirmation_token_idx on users (confirmation_token);

create table if not exists b2b_requests (
  id text primary key,
  user_id text references users(id) on delete cascade,
  email text not null,
  company_name text not null,
  registration_number text not null,
  address text not null,
  phone text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists b2b_requests_user_idx on b2b_requests (user_id);
create index if not exists b2b_requests_email_idx on b2b_requests (lower(email));

create table if not exists products (
  id text primary key,
  name text not null,
  brand text not null,
  category text not null,
  description text not null default '',
  data jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_brand_idx on products (brand);
create index if not exists products_category_idx on products (category);

create table if not exists stock_levels (
  variation_id text primary key,
  product_id text not null,
  product_name text not null,
  brand text not null,
  category text not null,
  sku text,
  color text,
  size text,
  physical integer not null default 0,
  expected integer not null default 0,
  purchase numeric(12, 4) not null default 0,
  shipping numeric(12, 4) not null default 0,
  customs numeric(12, 4) not null default 0,
  vat_rate numeric(5, 2) not null default 21,
  fx numeric(12, 6) not null default 1,
  lots jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists stock_product_idx on stock_levels (product_id);
create index if not exists stock_brand_idx on stock_levels (brand);

create table if not exists orders (
  id text primary key,
  merchant_reference text not null unique,
  montonio_order_uuid text,
  payment_url text,
  invoice_number text,
  invoice_issued_at timestamptz,
  invoice_due_at timestamptz,
  payment_method text not null check (payment_method in ('card', 'invoice', 'defer15')),
  payment_status text not null default 'pending',
  order_status text not null default 'in_process',
  no_vat boolean not null default false,
  language text,
  customer jsonb not null,
  lines jsonb not null,
  totals jsonb not null,
  shipping_carrier text not null,
  shipping_method text not null,
  shipping_method_name text not null,
  shipping_type text not null,
  pickup_point_id text,
  pickup_point_name text,
  shipping_address jsonb,
  shipping_price numeric(12, 2) not null default 0,
  shipment_id text,
  carrier_shipment_id text,
  tracking_number text,
  tracking_link text,
  label_url text,
  label_file_id text,
  label_status text,
  shipping_status text not null default 'pending',
  shipping_error text,
  stock_adjusted boolean not null default false,
  order_email_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_email_idx on orders ((lower(customer->>'email')));
create index if not exists orders_payment_status_idx on orders (payment_status);
create index if not exists orders_order_status_idx on orders (order_status);

create table if not exists invoices (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  invoice_number text not null unique,
  issued_at timestamptz not null,
  due_at timestamptz,
  no_vat boolean not null default false,
  total numeric(12, 2) not null default 0,
  currency text not null default 'EUR',
  pdf_file_id text,
  pdf_url text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  provider text not null default 'montonio',
  provider_payment_id text,
  status text not null,
  amount numeric(12, 2) not null default 0,
  currency text not null default 'EUR',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_idx on payments (order_id);

create table if not exists shipping_shipments (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  carrier text not null,
  method text not null,
  type text not null,
  status text not null default 'pending',
  pickup_point_id text,
  pickup_point_name text,
  address jsonb,
  price numeric(12, 2) not null default 0,
  tracking_number text,
  tracking_link text,
  label_url text,
  label_file_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipping_order_idx on shipping_shipments (order_id);

create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
