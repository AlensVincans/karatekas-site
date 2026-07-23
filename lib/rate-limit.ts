type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function clientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "unknown";
}

function nowMs() {
  return Date.now();
}

export function rateLimit(request: Request, options: RateLimitOptions) {
  const now = nowMs();
  const key = `${options.key}:${clientIp(request)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  bucket.count += 1;

  if (bucket.count <= options.limit) {
    return null;
  }

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  return Response.json(
    {
      error: "Too many requests. Please wait a moment and try again.",
      retryAfter,
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    },
  );
}

export function rateLimitByEmail(request: Request, email: string, options: RateLimitOptions) {
  const normalized = email.trim().toLowerCase() || "unknown";
  const synthetic = new Request(request.url, {
    headers: {
      "x-forwarded-for": `${clientIp(request)}:${normalized}`,
    },
  });

  return rateLimit(synthetic, options);
}
