import { confirmAuthUser } from "../../../../lib/auth-store";

export const runtime = "nodejs";

type ConfirmationState = "missing" | "invalid" | "success";

const confirmationCopy: Record<
  ConfirmationState,
  { eyebrow: string; title: string; text: string; tone: "success" | "error" }
> = {
  missing: {
    eyebrow: "Account confirmation",
    title: "Confirmation token is missing",
    text: "The confirmation link is incomplete. Please open the latest email from Karatekas.eu or request a new registration email.",
    tone: "error",
  },
  invalid: {
    eyebrow: "Account confirmation",
    title: "Confirmation link is invalid or already used",
    text: "This link may have expired or the account may already be confirmed. You can try signing in or register again with the correct email address.",
    tone: "error",
  },
  success: {
    eyebrow: "Account confirmed",
    title: "Your email has been confirmed",
    text: "You can now sign in, view your order history and place orders faster at Karatekas.eu.",
    tone: "success",
  },
};

function html(state: ConfirmationState) {
  const copy = confirmationCopy[state];
  const icon = copy.tone === "success" ? "✓" : "!";
  const accent = copy.tone === "success" ? "#0f766e" : "#d64716";
  const soft = copy.tone === "success" ? "#e9fbf4" : "#fff1eb";

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Karatekas</title>
    <link rel="icon" href="/favicon.svg" />
    <style>
      :root {
        color-scheme: light;
        --ink: #090807;
        --muted: #70675f;
        --paper: #f5f1ec;
        --line: #ded6ce;
        --accent: #ff6418;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at 18% 18%, rgba(255, 100, 24, .13), transparent 32%),
          linear-gradient(135deg, #fff 0%, var(--paper) 62%, #efe7df 100%);
        color: var(--ink);
        font-family: Inter, Arial, Helvetica, sans-serif;
      }

      .page {
        display: grid;
        min-height: 100vh;
        place-items: center;
        padding: 28px 16px;
      }

      .card {
        width: min(760px, 100%);
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 28px;
        background: rgba(255, 255, 255, .94);
        box-shadow: 0 28px 80px rgba(28, 22, 17, .14);
      }

      .top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        background: #050505;
        color: #fff;
        padding: 22px 26px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 14px;
        text-decoration: none;
        color: inherit;
      }

      .brand img {
        width: 46px;
        height: 46px;
        border-radius: 13px;
        object-fit: contain;
      }

      .brand-text strong {
        display: block;
        font-size: 20px;
        letter-spacing: -.03em;
      }

      .brand-subtitle {
        display: block;
        margin-top: 2px;
        color: #ff9b55;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .16em;
        text-transform: uppercase;
      }

      .body {
        display: grid;
        gap: 24px;
        padding: clamp(28px, 6vw, 52px);
      }

      .status {
        display: inline-grid;
        width: 58px;
        height: 58px;
        place-items: center;
        border-radius: 18px;
        background: ${soft};
        color: ${accent};
        font-size: 30px;
        font-weight: 950;
      }

      .eyebrow {
        margin: 0 0 10px;
        color: var(--accent);
        font-size: 12px;
        font-weight: 950;
        letter-spacing: .16em;
        text-transform: uppercase;
      }

      h1 {
        max-width: 620px;
        margin: 0;
        font-size: clamp(34px, 6vw, 58px);
        line-height: .98;
        letter-spacing: -.06em;
      }

      p {
        max-width: 590px;
        margin: 0;
        color: var(--muted);
        font-size: 17px;
        line-height: 1.7;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        padding-top: 4px;
      }

      .button {
        display: inline-flex;
        min-height: 48px;
        align-items: center;
        justify-content: center;
        border: 1px solid #050505;
        border-radius: 14px;
        padding: 0 18px;
        color: #050505;
        font-size: 14px;
        font-weight: 950;
        text-decoration: none;
      }

      .button.primary {
        background: #050505;
        color: #fff;
      }

      .button.secondary {
        background: #fff;
      }

      @media (max-width: 560px) {
        .top {
          padding: 18px;
        }

        .brand img {
          width: 40px;
          height: 40px;
        }

        .actions,
        .button {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="card" aria-labelledby="confirmation-title">
        <div class="top">
          <a class="brand" href="/">
            <img src="/karatekas-logo.png" alt="" />
            <span class="brand-text">
              <strong>Karatekas.eu</strong>
              <span class="brand-subtitle">Karate Equipment</span>
            </span>
          </a>
        </div>
        <div class="body">
          <div class="status" aria-hidden="true">${icon}</div>
          <div>
            <p class="eyebrow">${copy.eyebrow}</p>
            <h1 id="confirmation-title">${copy.title}</h1>
          </div>
          <p>${copy.text}</p>
          <div class="actions">
            <a class="button primary" href="/login">Go to login</a>
            <a class="button secondary" href="/">Back to store</a>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>`,
    {
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return html("missing");
  }

  const user = await confirmAuthUser(token);

  if (!user) {
    return html("invalid");
  }

  return html("success");
}
