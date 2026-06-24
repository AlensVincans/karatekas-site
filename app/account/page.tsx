"use client";

import Link from "next/link";
import { useLanguage } from "../../components/language";
import { useDemoSession } from "../../components/session";

const copy = {
  ru: {
    account: "Кабинет",
    needLogin: "Для доступа к кабинету нужно войти.",
    login: "Войти",
    role: "Роль",
    emailConfirmed: "Email подтверждён",
    yes: "да",
    no: "нет",
    company: "Компания",
    administrator: "администратор",
    creditLimit: "Кредитный лимит",
    noLimit: "без лимита",
  },
  lv: {
    account: "Kabinet",
    needLogin: "Lai piekļūtu kabinetam, nepieciešams ieiet.",
    login: "Ieiet",
    role: "Loma",
    emailConfirmed: "Email apstiprināts",
    yes: "jā",
    no: "nē",
    company: "Uzņēmums",
    administrator: "administrators",
    creditLimit: "Kredītlimits",
    noLimit: "bez limita",
  },
  en: {
    account: "Account",
    needLogin: "Please sign in to access your account.",
    login: "Login",
    role: "Role",
    emailConfirmed: "Email confirmed",
    yes: "yes",
    no: "no",
    company: "Company",
    administrator: "administrator",
    creditLimit: "Credit limit",
    noLimit: "no limit",
  },
} as const;

export default function AccountPage() {
  const { session } = useDemoSession();
  const { language } = useLanguage();
  const c = copy[language];

  if (!session) {
    return (
      <section className="section-shell narrow">
        <h1>{c.account}</h1>
        <p>{c.needLogin}</p>
        <Link className="wide-button inline-button" href="/login">
          {c.login}
        </Link>
      </section>
    );
  }

  return (
    <section className="section-shell narrow">
      <span className="eyebrow">{c.account}</span>
      <h1>{session.name}</h1>
      <div className="tool-panel">
        <div className="metric-row">
          <span>{c.role}</span>
          <strong>{session.role.toUpperCase()}</strong>
        </div>
        <div className="metric-row">
          <span>Email</span>
          <strong>{session.email}</strong>
        </div>
        <div className="metric-row">
          <span>{c.emailConfirmed}</span>
          <strong>{session.emailConfirmed ? c.yes : c.no}</strong>
        </div>
        {session.role === "b2b" || session.role === "admin" ? (
          <>
            <div className="metric-row">
              <span>{c.company}</span>
              <strong>{session.company ?? c.administrator}</strong>
            </div>
            <div className="metric-row">
              <span>{c.creditLimit}</span>
              <strong>{session.creditLimit ? `EUR ${session.creditLimit}` : c.noLimit}</strong>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
