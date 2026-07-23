"use client";

export const csrfHeaderName = "x-csrf-token";

function csrfTokenFromCookie() {
  if (typeof document === "undefined") {
    return "";
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith("kg_csrf="));

  return cookie ? decodeURIComponent(cookie.slice("kg_csrf=".length)) : "";
}

export function csrfHeaders(init?: HeadersInit) {
  const headers = new Headers(init);
  const token = csrfTokenFromCookie();

  if (token) {
    headers.set(csrfHeaderName, token);
  }

  return headers;
}
