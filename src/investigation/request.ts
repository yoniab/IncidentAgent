import { InvestigationRequestError } from "./request.error.js";
import type { InvestigationRequest, InvestigationRequestInput } from "./request.types.js";

function parseTimestamp(value: string, field: "start" | "end"): Temporal.Instant {
  try {
    return Temporal.Instant.from(value);
  } catch {
    throw new InvestigationRequestError(field, `${field} must be a valid ISO 8601 timestamp with an explicit timezone.`);
  }
}

/** Normalize a one-service request to a positive UTC interval [startUtc, endUtc). */
export function normalizeInvestigationRequest(input: InvestigationRequestInput): InvestigationRequest {
  for (const field of ["service", "environment"] as const) {
    if (input[field].trim().length === 0) {
      throw new InvestigationRequestError(field, `${field} must not be blank.`);
    }
  }

  const start = parseTimestamp(input.start, "start");
  const end = parseTimestamp(input.end, "end");
  if (Temporal.Instant.compare(start, end) >= 0) {
    throw new InvestigationRequestError("window", "end must be later than start.");
  }
  return {
    service: input.service,
    environment: input.environment,
    startUtc: start.toString(),
    endUtc: end.toString(),
  };
}
