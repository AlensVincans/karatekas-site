"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "../../components/language";
import { PasswordField } from "../../components/password-field";
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

const confirmationCopy = {
  ru: {
    unconfirmed:
      "Аккаунт создан, но email ещё не подтверждён. Проверьте почту или отправьте письмо ещё раз.",
    resend: "Отправить письмо повторно",
    resending: "Отправляем...",
    sent: "Письмо подтверждения отправлено. Проверьте входящие и спам.",
    failed: "Не удалось отправить письмо подтверждения.",
  },
  lv: {
    unconfirmed:
      "Konts ir izveidots, bet email vēl nav apstiprināts. Pārbaudiet pastu vai nosūtiet vēstuli vēlreiz.",
    resend: "Nosūtīt vēstuli vēlreiz",
    resending: "Sūtām...",
    sent: "Apstiprinājuma vēstule nosūtīta. Pārbaudiet iesūtni un spamu.",
    failed: "Neizdevās nosūtīt apstiprinājuma vēstuli.",
  },
  en: {
    unconfirmed:
      "The account exists, but the email is not confirmed yet. Check your inbox or send the confirmation email again.",
    resend: "Resend confirmation email",
    resending: "Sending...",
    sent: "Confirmation email sent. Check your inbox and spam folder.",
    failed: "Could not send the confirmation email.",
  },
  et: {
    unconfirmed:
      "Konto on loodud, kuid email pole veel kinnitatud. Kontrolli postkasti või saada kinnituskiri uuesti.",
    resend: "Saada kinnituskiri uuesti",
    resending: "Saadame...",
    sent: "Kinnituskiri on saadetud. Kontrolli postkasti ja rämpsposti.",
    failed: "Kinnituskirja saatmine ebaõnnestus.",
  },
  lt: {
    unconfirmed:
      "Paskyra sukurta, bet email dar nepatvirtintas. Patikrinkite paštą arba išsiųskite laišką dar kartą.",
    resend: "Siųsti patvirtinimo laišką dar kartą",
    resending: "Siunčiama...",
    sent: "Patvirtinimo laiškas išsiųstas. Patikrinkite gautuosius ir šlamštą.",
    failed: "Nepavyko išsiųsti patvirtinimo laiško.",
  },
} as const;

const passwordResetCopy = {
  ru: {
    forgot: "Забыли пароль?",
    email: "Email для восстановления",
    send: "Отправить ссылку",
    sending: "Отправляем...",
    sent: "Если такой email зарегистрирован, мы отправили ссылку для восстановления пароля.",
    failed: "Не удалось отправить письмо восстановления.",
  },
  lv: {
    forgot: "Aizmirsāt paroli?",
    email: "Atjaunošanas email",
    send: "Nosūtīt saiti",
    sending: "Sūtām...",
    sent: "Ja šis email ir reģistrēts, nosūtījām paroles atjaunošanas saiti.",
    failed: "Neizdevās nosūtīt paroles atjaunošanas vēstuli.",
  },
  en: {
    forgot: "Forgot password?",
    email: "Recovery email",
    send: "Send reset link",
    sending: "Sending...",
    sent: "If this email is registered, a password reset link has been sent.",
    failed: "Could not send the password reset email.",
  },
  et: {
    forgot: "Unustasid parooli?",
    email: "Taastamise email",
    send: "Saada link",
    sending: "Saadame...",
    sent: "Kui see email on registreeritud, saatsime parooli taastamise lingi.",
    failed: "Parooli taastamise kirja saatmine ebaõnnestus.",
  },
  lt: {
    forgot: "Pamiršote slaptažodį?",
    email: "Atkūrimo email",
    send: "Siųsti nuorodą",
    sending: "Siunčiama...",
    sent: "Jei šis email registruotas, išsiuntėme slaptažodžio atkūrimo nuorodą.",
    failed: "Nepavyko išsiųsti slaptažodžio atkūrimo laiško.",
  },
} as const;

export default function LoginPage() {
  const { login, session } = useDemoSession();
  const router = useRouter();
  const { language } = useLanguage();
  const c = copy[language as keyof typeof copy] ?? copy.en;
  const cc = confirmationCopy[language as keyof typeof confirmationCopy] ?? confirmationCopy.en;
  const rc = passwordResetCopy[language as keyof typeof passwordResetCopy] ?? passwordResetCopy.en;
  const [email, setEmail] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

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
        <PasswordField
          autoComplete="current-password"
          label={c.password}
          placeholder={c.passwordPlaceholder}
          value={password}
          onChange={setPassword}
        />
        <div className="auth-secondary-actions">
          <button
            className="auth-text-button"
            onClick={() => {
              setForgotOpen((open) => !open);
              setForgotEmail(email);
            }}
            type="button"
          >
            {rc.forgot}
          </button>
          {forgotOpen ? (
            <div className="forgot-password-panel">
              <label>
                {rc.email}
                <input
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@company.lv"
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                />
              </label>
              <button
                className="wide-button secondary"
                disabled={isForgotSubmitting}
                onClick={async () => {
                  setIsForgotSubmitting(true);

                  try {
                    const response = await fetch("/api/auth/forgot-password", {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: forgotEmail || email }),
                    });
                    const result = (await response.json().catch(() => ({}))) as {
                      message?: string;
                      error?: string;
                    };

                    setMessage(response.ok ? result.message || rc.sent : result.error || rc.failed);
                  } catch {
                    setMessage(rc.failed);
                  } finally {
                    setIsForgotSubmitting(false);
                  }
                }}
                type="button"
              >
                {isForgotSubmitting ? rc.sending : rc.send}
              </button>
            </div>
          ) : null}
        </div>
        <button
          className="wide-button"
          disabled={isSubmitting}
          onClick={async () => {
            setIsSubmitting(true);
            setNeedsConfirmation(false);
            const result = await login(email, password);
            setIsSubmitting(false);

            if (result.ok) {
              setMessage(c.success);
              router.push("/");
              return;
            }

            if (result.code === "email_unconfirmed") {
              setNeedsConfirmation(true);
              setMessage(cc.unconfirmed);
              return;
            }

            setMessage(result.message || c.failed);
          }}
          type="button"
        >
          {c.submit}
        </button>
        {message ? <p className="status-box">{message}</p> : null}
        {needsConfirmation ? (
          <button
            className="wide-button secondary"
            disabled={isResending}
            onClick={async () => {
              setIsResending(true);

              try {
                const response = await fetch("/api/auth/resend-confirmation", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
                const result = (await response.json().catch(() => ({}))) as {
                  message?: string;
                  error?: string;
                };

                setMessage(response.ok ? result.message || cc.sent : result.error || cc.failed);
              } catch {
                setMessage(cc.failed);
              } finally {
                setIsResending(false);
              }
            }}
            type="button"
          >
            {isResending ? cc.resending : cc.resend}
          </button>
        ) : null}
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
