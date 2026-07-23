"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "../../components/language";
import { PasswordField } from "../../components/password-field";

const copy = {
  ru: {
    eyebrow: "Восстановление",
    title: "Новый пароль",
    text: "Введите новый пароль для аккаунта Karatekas.eu.",
    password: "Новый пароль",
    confirmPassword: "Подтвердите пароль",
    policy: "Пароль должен быть минимум 8 символов и содержать 1 заглавную букву.",
    required: "Введите новый пароль и подтверждение.",
    mismatch: "Пароли не совпадают.",
    invalidToken: "Ссылка восстановления недействительна или уже истекла.",
    submit: "Сохранить пароль",
    submitting: "Сохраняем...",
    success: "Пароль изменён. Теперь можно войти.",
    failed: "Не удалось изменить пароль.",
    login: "Перейти ко входу",
  },
  lv: {
    eyebrow: "Atjaunošana",
    title: "Jauna parole",
    text: "Ievadiet jaunu Karatekas.eu konta paroli.",
    password: "Jauna parole",
    confirmPassword: "Apstipriniet paroli",
    policy: "Parolei jābūt vismaz 8 simboliem un 1 lielajam burtam.",
    required: "Ievadiet jauno paroli un apstiprinājumu.",
    mismatch: "Paroles nesakrīt.",
    invalidToken: "Atjaunošanas saite nav derīga vai ir beigusies.",
    submit: "Saglabāt paroli",
    submitting: "Saglabājam...",
    success: "Parole nomainīta. Tagad varat ieiet.",
    failed: "Neizdevās nomainīt paroli.",
    login: "Doties uz ieeju",
  },
  en: {
    eyebrow: "Password reset",
    title: "New password",
    text: "Enter a new password for your Karatekas.eu account.",
    password: "New password",
    confirmPassword: "Confirm password",
    policy: "Password must be at least 8 characters and contain 1 uppercase letter.",
    required: "Enter the new password and confirmation.",
    mismatch: "Passwords do not match.",
    invalidToken: "The password reset link is invalid or expired.",
    submit: "Save password",
    submitting: "Saving...",
    success: "Password changed. You can sign in now.",
    failed: "Could not change password.",
    login: "Go to login",
  },
  et: {
    eyebrow: "Parooli taastamine",
    title: "Uus parool",
    text: "Sisesta Karatekas.eu konto uus parool.",
    password: "Uus parool",
    confirmPassword: "Kinnita parool",
    policy: "Parool peab olema vähemalt 8 märki ja sisaldama 1 suurtähte.",
    required: "Sisesta uus parool ja kinnitus.",
    mismatch: "Paroolid ei kattu.",
    invalidToken: "Parooli taastamise link on kehtetu või aegunud.",
    submit: "Salvesta parool",
    submitting: "Salvestame...",
    success: "Parool muudetud. Nüüd saad sisse logida.",
    failed: "Parooli muutmine ebaõnnestus.",
    login: "Mine sisselogimisele",
  },
  lt: {
    eyebrow: "Slaptažodžio atkūrimas",
    title: "Naujas slaptažodis",
    text: "Įveskite naują Karatekas.eu paskyros slaptažodį.",
    password: "Naujas slaptažodis",
    confirmPassword: "Patvirtinkite slaptažodį",
    policy: "Slaptažodis turi turėti bent 8 simbolius ir 1 didžiąją raidę.",
    required: "Įveskite naują slaptažodį ir patvirtinimą.",
    mismatch: "Slaptažodžiai nesutampa.",
    invalidToken: "Slaptažodžio atkūrimo nuoroda neteisinga arba pasibaigė.",
    submit: "Išsaugoti slaptažodį",
    submitting: "Saugoma...",
    success: "Slaptažodis pakeistas. Dabar galite prisijungti.",
    failed: "Nepavyko pakeisti slaptažodžio.",
    login: "Eiti į prisijungimą",
  },
} as const;

function hasValidPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password);
}

export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const c = copy[language as keyof typeof copy] ?? copy.en;
  const [token] = useState(() =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("token") ?? "",
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submitReset() {
    if (!token) {
      setMessage(c.invalidToken);
      return;
    }

    if (!password || !confirmPassword) {
      setMessage(c.required);
      return;
    }

    if (!hasValidPassword(password)) {
      setMessage(c.policy);
      return;
    }

    if (password !== confirmPassword) {
      setMessage(c.mismatch);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      setSuccess(response.ok);
      setMessage(response.ok ? result.message || c.success : result.error || c.failed);
    } catch {
      setMessage(c.failed);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">{c.eyebrow}</span>
        <h1>{c.title}</h1>
        <p className="auth-copy">{c.text}</p>
        <PasswordField
          autoComplete="new-password"
          hint={c.policy}
          label={c.password}
          value={password}
          onChange={setPassword}
        />
        <PasswordField
          autoComplete="new-password"
          label={c.confirmPassword}
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
        <button
          className="wide-button"
          disabled={isSubmitting || success}
          onClick={() => void submitReset()}
          type="button"
        >
          {isSubmitting ? c.submitting : c.submit}
        </button>
        {message ? <p className="status-box">{message}</p> : null}
        <Link href="/login">{c.login}</Link>
      </div>
    </section>
  );
}
