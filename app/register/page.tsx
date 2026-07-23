"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "../../components/language";
import { PasswordField } from "../../components/password-field";
import { useDemoSession } from "../../components/session";

const copy = {
  ru: {
    eyebrow: "Регистрация",
    title: "Создать аккаунт",
    regular: "Обычный клиент",
    firstName: "Имя",
    lastName: "Фамилия",
    password: "Пароль",
    confirmPassword: "Подтверждение пароля",
    company: "Компания",
    submit: "Зарегистрироваться",
    submitting: "Отправляем письмо...",
    success: "Регистрация создана. Проверьте почту и подтвердите аккаунт по ссылке.",
    required: "Заполните имя, фамилию, email и пароль.",
    passwordPolicy: "Пароль должен быть минимум 8 символов и содержать 1 заглавную букву.",
    mismatch: "Пароли не совпадают.",
    emailNote: "После регистрации мы отправим письмо для подтверждения аккаунта.",
    haveAccount: "Уже есть аккаунт? Войти",
  },
  lv: {
    eyebrow: "Reģistrācija",
    title: "Izveidot kontu",
    regular: "Privāts klients",
    firstName: "Vārds",
    lastName: "Uzvārds",
    password: "Parole",
    confirmPassword: "Apstipriniet paroli",
    company: "Uzņēmums",
    submit: "Reģistrēties",
    submitting: "Sūtām e-pastu...",
    success: "Reģistrācija izveidota. Lūdzu apstipriniet kontu e-pastā.",
    required: "Aizpildiet vārdu, uzvārdu, e-pastu un paroli.",
    passwordPolicy: "Parolei jābūt vismaz 8 simboliem un 1 lielajam burtam.",
    mismatch: "Paroles nesakrīt.",
    emailNote: "Pēc reģistrācijas nosūtīsim konta apstiprinājuma e-pastu.",
    haveAccount: "Konts jau ir? Ieiet",
  },
  en: {
    eyebrow: "Registration",
    title: "Create account",
    regular: "Retail customer",
    firstName: "First name",
    lastName: "Last name",
    password: "Password",
    confirmPassword: "Confirm password",
    company: "Company",
    submit: "Register",
    submitting: "Sending email...",
    success: "Registration created. Check your email and confirm the account.",
    required: "Fill first name, last name, email and password.",
    passwordPolicy: "Password must be at least 8 characters and contain 1 uppercase letter.",
    mismatch: "Passwords do not match.",
    emailNote: "After registration we will send an account confirmation email.",
    haveAccount: "Already have an account? Login",
  },
  et: {
    eyebrow: "Registreerimine",
    title: "Loo konto",
    regular: "Tavaklient",
    firstName: "Eesnimi",
    lastName: "Perekonnanimi",
    password: "Parool",
    confirmPassword: "Kinnita parool",
    company: "Ettevõte",
    submit: "Registreeru",
    submitting: "Saadame e-kirja...",
    success: "Registreerimine loodud. Kinnitage konto e-posti lingi kaudu.",
    required: "Täitke eesnimi, perekonnanimi, e-post ja parool.",
    passwordPolicy: "Parool peab olema vähemalt 8 märki ja sisaldama 1 suurtähte.",
    mismatch: "Paroolid ei kattu.",
    emailNote: "Pärast registreerimist saadame konto kinnitamise e-kirja.",
    haveAccount: "Konto on olemas? Logi sisse",
  },
  lt: {
    eyebrow: "Registracija",
    title: "Sukurti paskyrą",
    regular: "Privatus klientas",
    firstName: "Vardas",
    lastName: "Pavardė",
    password: "Slaptažodis",
    confirmPassword: "Pakartokite slaptažodį",
    company: "Įmonė",
    submit: "Registruotis",
    submitting: "Siunčiame laišką...",
    success: "Registracija sukurta. Patvirtinkite paskyrą el. paštu.",
    required: "Užpildykite vardą, pavardę, el. paštą ir slaptažodį.",
    passwordPolicy: "Slaptažodis turi turėti bent 8 simbolius ir 1 didžiąją raidę.",
    mismatch: "Slaptažodžiai nesutampa.",
    emailNote: "Po registracijos atsiųsime paskyros patvirtinimo laišką.",
    haveAccount: "Jau turite paskyrą? Prisijungti",
  },
} as const;

function hasValidPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password);
}

export default function RegisterPage() {
  const { register } = useDemoSession();
  const { language } = useLanguage();
  const c = copy[language as keyof typeof copy] ?? copy.en;
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  async function handleRegister() {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();

    if (!firstName || !lastName || !email || !form.password) {
      setMessage(c.required);
      return;
    }

    if (!hasValidPassword(form.password)) {
      setMessage(c.passwordPolicy);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage(c.mismatch);
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      firstName,
      lastName,
      email,
      password: form.password,
      role: "user",
    });
    setIsSubmitting(false);
    setMessage(result.ok ? c.success : result.message);
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">{c.eyebrow}</span>
        <h1>{c.title}</h1>
        <p className="auth-hint strong">{c.regular}</p>
        <div className="auth-name-grid">
          <label>
            {c.firstName}
            <input
              autoComplete="given-name"
              value={form.firstName}
              onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            />
          </label>
          <label>
            {c.lastName}
            <input
              autoComplete="family-name"
              value={form.lastName}
              onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            />
          </label>
        </div>
        <label>
          Email
          <input
            autoComplete="email"
            inputMode="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>
        <PasswordField
          autoComplete="new-password"
          hint={c.passwordPolicy}
          label={c.password}
          value={form.password}
          onChange={(value) => setForm({ ...form, password: value })}
        />
        <PasswordField
          autoComplete="new-password"
          label={c.confirmPassword}
          value={form.confirmPassword}
          onChange={(value) => setForm({ ...form, confirmPassword: value })}
        />
        <p className="auth-hint strong">{c.emailNote}</p>
        <input
          aria-hidden="true"
          autoComplete="off"
          className="honeypot"
          name="website"
          tabIndex={-1}
        />
        <button
          className="wide-button"
          disabled={isSubmitting}
          onClick={() => void handleRegister()}
          type="button"
        >
          {isSubmitting ? c.submitting : c.submit}
        </button>
        {message ? <p className="status-box">{message}</p> : null}
        <Link href="/login">{c.haveAccount}</Link>
      </div>
    </section>
  );
}
