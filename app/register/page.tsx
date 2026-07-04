"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "../../components/language";
import { useDemoSession } from "../../components/session";
import type { UserRole } from "../../lib/store-data";

const copy = {
  ru: {
    eyebrow: "Регистрация",
    title: "Создать аккаунт",
    regular: "Обычный",
    name: "Имя",
    password: "Пароль",
    company: "Компания",
    optIn: "Double opt-in email подтверждение",
    submit: "Зарегистрироваться",
    success: "Регистрация выполнена. Email подтверждён.",
    exists: "Пользователь с таким email уже есть.",
    haveAccount: "Уже есть аккаунт? Войти",
  },
  lv: {
    eyebrow: "Reģistrācija",
    title: "Izveidot kontu",
    regular: "Privāts",
    name: "Vārds",
    password: "Parole",
    company: "Uzņēmums",
    optIn: "Double opt-in email apstiprinājums",
    submit: "Reģistrēties",
    success: "Reģistrācija pabeigta. Email apstiprināts.",
    exists: "Lietotājs ar šādu email jau eksistē.",
    haveAccount: "Konts jau ir? Ieiet",
  },
  en: {
    eyebrow: "Registration",
    title: "Create account",
    regular: "Retail",
    name: "Name",
    password: "Password",
    company: "Company",
    optIn: "Double opt-in email confirmation",
    submit: "Register",
    success: "Registration complete. Email confirmed.",
    exists: "A user with this email already exists.",
    haveAccount: "Already have an account? Login",
  },
  et: {
    eyebrow: "Registreerimine",
    title: "Loo konto",
    regular: "Tavaklient",
    name: "Nimi",
    password: "Parool",
    company: "Ettevõte",
    optIn: "Double opt-in emaili kinnitus",
    submit: "Registreeru",
    success: "Registreerimine lõpetatud. Email on kinnitatud.",
    exists: "Selle emailiga kasutaja on juba olemas.",
    haveAccount: "Konto on olemas? Logi sisse",
  },
  lt: {
    eyebrow: "Registracija",
    title: "Sukurti paskyrą",
    regular: "Įprastas",
    name: "Vardas",
    password: "Slaptažodis",
    company: "Įmonė",
    optIn: "Double opt-in email patvirtinimas",
    submit: "Registruotis",
    success: "Registracija baigta. Email patvirtintas.",
    exists: "Vartotojas su šiuo email jau yra.",
    haveAccount: "Jau turite paskyrą? Prisijungti",
  },
} as const;

export default function RegisterPage() {
  const { register } = useDemoSession();
  const { language } = useLanguage();
  const c = copy[language as keyof typeof copy] ?? copy.en;
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
        <span className="eyebrow">{c.eyebrow}</span>
        <h1>{c.title}</h1>
        <div className="segmented-control">
          <button
            className={role === "user" ? "active" : ""}
            onClick={() => setRole("user")}
            type="button"
          >
            {c.regular}
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
          {c.name}
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
          {c.password}
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </label>
        {role === "b2b" ? (
          <>
            <label>
              {c.company}
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
          {c.optIn}
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
            setMessage(result.ok ? c.success : c.exists);
          }}
          type="button"
        >
          {c.submit}
        </button>
        {message ? <p className="status-box">{message}</p> : null}
        <Link href="/login">{c.haveAccount}</Link>
      </div>
    </section>
  );
}
