import { sendTestEmail } from "../../../../lib/email";
import { rateLimit } from "../../../../lib/rate-limit";
import { authErrorResponse, requireAdmin } from "../../../../lib/server-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "admin:test-email",
    limit: 5,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  try {
    await requireAdmin();
  } catch (error) {
    return authErrorResponse(error);
  }

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
