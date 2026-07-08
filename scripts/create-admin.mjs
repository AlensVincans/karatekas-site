import { pbkdf2Sync, randomBytes } from "node:crypto";
import pg from "pg";

const { Pool } = pg;

function databaseUrl() {
  const value = process.env.DATABASE_URL?.trim();

  if (!value) {
    throw new Error("DATABASE_URL is required to create an admin user.");
  }

  let url = /[?&]sslmode=/i.test(value)
    ? value
    : `${value}${value.includes("?") ? "&" : "?"}sslmode=require`;

  if (!/[?&]uselibpqcompat=/i.test(url)) {
    url = `${url}${url.includes("?") ? "&" : "?"}uselibpqcompat=true`;
  }

  return url;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const iterations = 120_000;
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");

  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

function adminInput() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
  }

  if (password.length < 8 || !/[A-Z]/.test(password)) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters and contain 1 uppercase letter.");
  }

  const [firstName, ...lastParts] = name.split(/\s+/).filter(Boolean);

  return {
    id: `usr-admin-${Date.now().toString(36)}`,
    firstName: firstName || "Admin",
    lastName: lastParts.join(" ") || "User",
    name,
    email,
    passwordHash: hashPassword(password),
  };
}

async function main() {
  const admin = adminInput();
  const pool = new Pool({
    connectionString: databaseUrl(),
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query(
      `insert into users (
        id, first_name, last_name, name, email, password_hash, role,
        company, vat_number, credit_limit, payment_terms, email_confirmed,
        confirmation_token, confirmation_sent_at
      )
      values ($1,$2,$3,$4,$5,$6,'admin',null,null,null,'["card","invoice","defer15"]'::jsonb,true,null,null)
      on conflict (email) do update set
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        name = excluded.name,
        password_hash = excluded.password_hash,
        role = 'admin',
        payment_terms = '["card","invoice","defer15"]'::jsonb,
        email_confirmed = true,
        updated_at = now()`,
      [
        admin.id,
        admin.firstName,
        admin.lastName,
        admin.name,
        admin.email,
        admin.passwordHash,
      ],
    );

    console.log(`admin ready: ${admin.email}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
