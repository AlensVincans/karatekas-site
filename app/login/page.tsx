"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemoSession } from "../../components/session";

export default function LoginPage() {
  const { login, session } = useDemoSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  return (
    <section className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">Личный кабинет</span>
        <h1>Вход в аккаунт</h1>
        <p className="auth-copy">
          Войдите, чтобы видеть свои заказы, счета, условия оплаты и сохранённые
          данные доставки.
        </p>
        <label>
          Email
          <input
            autoComplete="email"
            placeholder="you@company.lv"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Пароль
          <input
            autoComplete="current-password"
            placeholder="Ваш пароль"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button
          className="wide-button"
          onClick={() => {
            const result = login(email, password);
            setMessage(result.message);
          }}
          type="button"
        >
          Войти
        </button>
        {message ? <p className="status-box">{message}</p> : null}
        {session ? (
          <div className="auth-actions">
            <Link href={session.role === "admin" ? "/admin" : "/account"}>
              Перейти в кабинет
            </Link>
            {session.role === "b2b" ? <Link href="/b2b">B2B цены</Link> : null}
          </div>
        ) : null}
        <Link href="/register">Нет аккаунта? Регистрация</Link>
      </div>
    </section>
  );
}
