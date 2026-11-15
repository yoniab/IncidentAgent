import { normalizeInvestigationRequest } from "../investigation/request.js";
import type { InvestigationRequest, InvestigationRequestInput } from "../investigation/request.types.js";

export type CliInvestigationRequestInput = Omit<InvestigationRequestInput, "environment"> & {
  environment?: string;
};

export function resolveCliInvestigationRequest(input: CliInvestigationRequestInput): InvestigationRequest {
  return normalizeInvestigationRequest({
    ...input,
    environment: input.environment === undefined ? "local" : input.environment,
  });
}
