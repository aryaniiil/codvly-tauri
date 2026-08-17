/** Uniform error surface so the engine can plan around provider failures. */

export class ProviderError extends Error {
  readonly provider: string;
  readonly code: ProviderErrorCode;
  readonly status?: number;

  constructor(
    provider: string,
    code: ProviderErrorCode,
    message: string,
    status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
    this.provider = provider;
    this.code = code;
    this.status = status;
  }
}

export type ProviderErrorCode =
  | "unauthorized"
  | "rate_limited"
  | "not_found"
  | "conflict"
  | "validation"
  | "unknown";
