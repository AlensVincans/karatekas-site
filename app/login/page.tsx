"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemoSession } from "../../components/session";

export default function LoginPage() {
  const { login, session } = useDemoSession();
  const [email, setEmail] = useState("b2b@baltic.test");
  const [password, setPassword] = useState("b2b123");
  const [message, setMessage] = useState("");

  return (
    <section className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">Вход</span>
        <h1>Login для трёх типов пользователей</h1>
        <div className="demo-credentials">
          <span>admin@baltic.test / admin123</span>
          <span>buyer@baltic.test / user123</span>
          <span>b2b@baltic.test / b2b123</span>
        </div>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Пароль
          <input
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
          <p className="status-box">Вы вошли как {session.role.toUpperCase()}.</p>
        ) : null}
        <Link href="/register">Нет аккаунта? Регистрация</Link>
      </div>
    </section>
  );
}
