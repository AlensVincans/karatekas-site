alter table users
  add column if not exists password_reset_token text,
  add column if not exists password_reset_sent_at timestamptz;

create index if not exists users_password_reset_token_idx on users (password_reset_token);
