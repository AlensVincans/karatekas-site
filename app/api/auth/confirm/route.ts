import { confirmAuthUser } from "../../../../lib/auth-store";

export const runtime = "nodejs";

function html(message: string) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Karatekas.eu</title></head><body style="font-family:Arial,sans-serif;padding:32px"><h1>${message}</h1><p><a href="/login">Go to login</a></p></body></html>`,
    {
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return html("Confirmation token is missing.");
  }

  const user = await confirmAuthUser(token);

  if (!user) {
    return html("Confirmation link is invalid or already used.");
  }

  return html("Email confirmed. You can now log in.");
}
