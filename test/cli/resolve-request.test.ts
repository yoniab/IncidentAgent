import { expect, test } from "vitest";
import { resolveCliInvestigationRequest } from "../../src/cli/resolve-request.ts";
import { InvestigationRequestError } from "../../src/investigation/request.error.js";

const input = {
  service: " Checkout ",
  start: "2026-11-04T12:00:00.123456789+02:00",
  end: "2026-11-04T12:30:00+02:00",
};

test.each([{}, { environment: undefined }])("defaults an omitted environment to local (%j)", (environment) => {
  expect(resolveCliInvestigationRequest({ ...input, ...environment })).toEqual({
    service: " Checkout ",
    environment: "local",
    startUtc: "2026-11-04T10:00:00.123456789Z",
    endUtc: "2026-11-04T10:30:00Z",
  });
});

test.each(["test", " Test "])("preserves explicit environment %j", (environment) => {
  expect(resolveCliInvestigationRequest({ ...input, environment })).toEqual({
    service: " Checkout ",
    environment,
    startUtc: "2026-11-04T10:00:00.123456789Z",
    endUtc: "2026-11-04T10:30:00Z",
  });
});

test.each(["", " \t\n"])("rejects explicit blank environment %j", (environment) => {
  const resolve = () => resolveCliInvestigationRequest({ ...input, environment });
  expect(resolve).toThrow(InvestigationRequestError);
  expect(resolve).toThrow(expect.objectContaining({ field: "environment" }));
});

test.each([
  [{ service: " " }, "service"],
  [{ start: "2026-11-04T10:00:00" }, "start"],
  [{ end: "invalid" }, "end"],
  [{ end: input.start }, "window"],
] as const)("delegates validation of %j to the core", (override, field) => {
  const resolve = () => resolveCliInvestigationRequest({ ...input, ...override });
  expect(resolve).toThrow(InvestigationRequestError);
  expect(resolve).toThrow(expect.objectContaining({ field }));
});
