// Thin fetch wrapper for the UCompass API: adds the bearer token, sends and
// reads JSON, and turns ProblemDetails bodies into readable errors.

/** Override with EXPO_PUBLIC_API_URL, e.g. http://192.168.1.20:8080 for a local API */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "https://hackathon-2026-map.bookmountain.work").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** ProblemDetails `code`, e.g. "consent_required" */
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setToken(value: string | null) {
  token = value;
}

export function getToken(): string | null {
  return token;
}

/** Called when a signed-in request comes back 401 (expired or revoked token) */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

function buildUrl(path: string, query?: Query): string {
  const params = Object.entries(query ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return `${API_URL}${path}${params.length ? `?${params.join("&")}` : ""}`;
}

/** The text to show for a ProblemDetails body: validation messages, then `detail`, then `title` */
export function problemMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const p = body as { detail?: string; title?: string; errors?: Record<string, string[]> };
    const validation = p.errors ? Object.values(p.errors).flat().filter(Boolean) : [];
    if (validation.length) return validation.join("\n");
    if (p.detail) return p.detail;
    if (p.title) return p.title;
  }
  return status >= 500 ? "Something went wrong on our side. Try again." : `Request failed (${status})`;
}

export async function api<T>(
  path: string,
  { method = "GET", body, query }: { method?: string; body?: unknown; query?: Query } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Can't reach UCompass. Check your connection.", 0);
  }

  const text = await res.text();
  let json: unknown = undefined;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    const code = json && typeof json === "object" ? (json as { code?: string }).code : undefined;
    throw new ApiError(problemMessage(json, res.status), res.status, code);
  }
  return json as T;
}

/** Message to show in a toast for any thrown error */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Try again.";
}
