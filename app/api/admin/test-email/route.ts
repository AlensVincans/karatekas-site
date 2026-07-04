import { sendTestEmail } from "../../../../lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as { to?: string };

  try {
    await sendTestEmail(payload.to);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not send test email.",
      },
      { status: 500 },
    );
  }
}
