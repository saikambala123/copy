// ============================================================
// NOVA — HTTP error primitive (shared, dependency-free)
// Lives in its own module so mongo.ts / auth.ts / api-utils.ts
// can all use it without import cycles.
// ============================================================

/** Typed HTTP error carrying a status code; caught by the apiRoute wrapper. */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
