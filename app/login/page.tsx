"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "../../components/language";
import { useDemoSession } from "../../components/session";

const copy = {
  ru: {
    eyebrow: "Личный кабинет",
    title: "Вход в аккаунт",
    text: "Войдите, чтобы видеть свои заказы, счета, условия оплаты и сохранённые данные доставки.",
    password: "Пароль",
    passwordPlaceholder: "Ваш пароль",
    submit: "Войти",
    success: "Вход выполнен.",
    failed: "Неверный email или пароль.",
    goAccount: "Перейти в кабинет",
    noAccount: "Нет аккаунта? Регистрация",
  },
  lv: {
    eyebrow: "Mans konts",
    title: "Ieiet kontā",
    text: "Ieejiet, lai redzētu pasūtījumus, rēķinus, apmaksas nosacījumus un piegādes datus.",
    password: "Parole",
    passwordPlaceholder: "Jūsu parole",
    submit: "Ieiet",
    success: "Ieeja veiksmīga.",
    failed: "Nepareizs email vai parole.",
    goAccount: "Atvērt kabinetu",
    noAccount: "Nav konta? Reģistrācija",
  },
  en: {
    eyebrow: "Account",
    title: "Login",
    text: "Sign in to see your orders, invoices, payment terms and saved delivery details.",
    password: "Password",
    passwordPlaceholder: "Your password",
    submit: "Sign in",
    success: "Signed in.",
    failed: "Incorrect email or password.",
    goAccount: "Open account",
    noAccount: "No account? Register",
  },
  et: {
    eyebrow: "Konto",
    title: "Logi sisse",
    text: "Logi sisse, et näha tellimusi, arveid, maksetingimusi ja salvestatud tarneandmeid.",
    password: "Parool",
    passwordPlaceholder: "Sinu parool",
    submit: "Logi sisse",
    success: "Sisselogimine õnnestus.",
    failed: "Vale email või parool.",
    goAccount: "Ava konto",
    noAccount: "Kontot pole? Registreeru",
  },
  lt: {
    eyebrow: "Paskyra",
    title: "Prisijungti",
    text: "Prisijunkite, kad matytumėte užsakymus, sąskaitas, mokėjimo sąlygas ir išsaugotus pristatymo duomenis.",
    password: "Slaptažodis",
    passwordPlaceholder: "Jūsų slaptažodis",
    submit: "Prisijungti",
    success: "Prisijungta.",
    failed: "Neteisingas email arba slaptažodis.",
    goAccount: "Atidaryti paskyrą",
    noAccount: "Neturite paskyros? Registracija",
  },
} as const;

export default function LoginPage() {
  const { login, session } = useDemoSession();
  const router = useRouter();
  const { language } = useLanguage();
  const c = copy[language as keyof typeof copy] ?? copy.en;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <section className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">{c.eyebrow}</span>
        <h1>{c.title}</h1>
        <p className="auth-copy">{c.text}</p>
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
          {c.password}
          <input
            autoComplete="current-password"
            placeholder={c.passwordPlaceholder}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button
          className="wide-button"
          disabled={isSubmitting}
          onClick={async () => {
            setIsSubmitting(true);
            const result = await login(email, password);
            setIsSubmitting(false);

            if (result.ok) {
              setMessage(c.success);
              router.push("/");
              return;
            }

            setMessage(result.message || c.failed);
          }}
          type="button"
        >
          {c.submit}
        </button>
        {message ? <p className="status-box">{message}</p> : null}
        {session ? (
          <div className="auth-actions">
            <Link href={session.role === "admin" ? "/admin" : "/account"}>
              {c.goAccount}
            </Link>
          </div>
        ) : null}
        <Link href="/register">{c.noAccount}</Link>
      </div>
    </section>
  );
}
