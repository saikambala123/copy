import type { Title } from "@/lib/types";

/** Response envelope for GET /api/titles */
export interface TitlesResponse {
  titles: Title[];
  total: number;
  page: number;
  pageSize: number;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  /** JSON body — automatically stringified and sets POST when no method given */
  json?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * JSON fetch wrapper for the NOVA API.
 * - relative paths only (same-origin, cookie auth)
 * - throws ApiError with the server `error` message, or a readable fallback
 *   (e.g. HTML 404 pages from not-yet-implemented routes never crash the UI)
 */
export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { json, method, headers, ...rest } = opts;

  const res = await fetch(path, {
    ...rest,
    method: method ?? (json !== undefined ? "POST" : "GET"),
    credentials: "same-origin",
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...((headers as Record<string, string>) ?? {}),
    },
    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null; // non-JSON body (e.g. dev 404 page)
    }
  }

  if (!res.ok) {
    const message =
      isRecord(data) && typeof data.error === "string"
        ? data.error
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}
