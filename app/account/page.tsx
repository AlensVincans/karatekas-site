"use client";

import Link from "next/link";
import { useDemoSession } from "../../components/session";

export default function AccountPage() {
  const { session } = useDemoSession();

  if (!session) {
    return (
      <section className="section-shell narrow">
        <h1>Кабинет</h1>
        <p>Для доступа к кабинету нужно войти.</p>
        <Link className="wide-button inline-button" href="/login">
          Войти
        </Link>
      </section>
    );
  }

  return (
    <section className="section-shell narrow">
      <span className="eyebrow">Кабинет</span>
      <h1>{session.name}</h1>
      <div className="tool-panel">
        <div className="metric-row">
          <span>Роль</span>
          <strong>{session.role.toUpperCase()}</strong>
        </div>
        <div className="metric-row">
          <span>Email</span>
          <strong>{session.email}</strong>
        </div>
        <div className="metric-row">
          <span>Email подтверждён</span>
          <strong>{session.emailConfirmed ? "да" : "нет"}</strong>
        </div>
        {session.role === "b2b" || session.role === "admin" ? (
          <>
            <div className="metric-row">
              <span>Компания</span>
              <strong>{session.company ?? "администратор"}</strong>
            </div>
            <div className="metric-row">
              <span>Кредитный лимит</span>
              <strong>{session.creditLimit ? `EUR ${session.creditLimit}` : "без лимита"}</strong>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
