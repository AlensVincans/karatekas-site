const encoder = new TextEncoder();
const decoder = new TextDecoder();

type JwtPayload = Record<string, unknown>;

function base64Url(input: string | Uint8Array) {
  const bytes = typeof input === "string" ? encoder.encode(input) : input;
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(input: string) {
  const padded = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return decoder.decode(bytes);
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}

async function signTokenBase(tokenBase: string, secretKey: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(tokenBase));

  return base64Url(new Uint8Array(signature));
}

export async function signMontonioJwt(payload: JwtPayload, secretKey: string) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(JSON.stringify(payload));
  const tokenBase = `${header}.${body}`;

  return `${tokenBase}.${await signTokenBase(tokenBase, secretKey)}`;
}

export async function verifyMontonioJwt<T extends JwtPayload = JwtPayload>(
  token: string,
  secretKey: string,
) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid Montonio token format.");
  }

  const [header, body, signature] = parts;
  const tokenBase = `${header}.${body}`;
  const expectedSignature = await signTokenBase(tokenBase, secretKey);

  if (!timingSafeEqual(signature, expectedSignature)) {
    throw new Error("Invalid Montonio token signature.");
  }

  const payload = JSON.parse(decodeBase64Url(body)) as T;

  if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Expired Montonio token.");
  }

  return payload;
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
