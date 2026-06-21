"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemoSession } from "../../components/session";
import type { UserRole } from "../../lib/store-data";

export default function RegisterPage() {
  const { register } = useDemoSession();
  const [role, setRole] = useState<Extract<UserRole, "user" | "b2b">>("user");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    vatNumber: "",
  });

  return (
    <section className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">Регистрация</span>
        <h1>Создать аккаунт</h1>
        <div className="segmented-control">
          <button
            className={role === "user" ? "active" : ""}
            onClick={() => setRole("user")}
            type="button"
          >
            Обычный
          </button>
          <button
            className={role === "b2b" ? "active" : ""}
            onClick={() => setRole("b2b")}
            type="button"
          >
            B2B
          </button>
        </div>
        <label>
          Имя
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label>
          Email
          <input
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>
        <label>
          Пароль
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </label>
        {role === "b2b" ? (
          <>
            <label>
              Компания
              <input
                value={form.company}
                onChange={(event) =>
                  setForm({ ...form, company: event.target.value })
                }
              />
            </label>
            <label>
              PVN / VAT
              <input
                value={form.vatNumber}
                onChange={(event) =>
                  setForm({ ...form, vatNumber: event.target.value })
                }
              />
            </label>
          </>
        ) : null}
        <label className="check-row">
          <input defaultChecked type="checkbox" />
          Double opt-in email подтверждение
        </label>
        <input
          aria-hidden="true"
          autoComplete="off"
          className="honeypot"
          name="website"
          tabIndex={-1}
        />
        <button
          className="wide-button"
          onClick={() => {
            const result = register({ ...form, role });
            setMessage(result.message);
          }}
          type="button"
        >
          Зарегистрироваться
        </button>
        {message ? <p className="status-box">{message}</p> : null}
        <Link href="/login">Уже есть аккаунт? Войти</Link>
      </div>
    </section>
  );
}
