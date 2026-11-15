import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { beforeAll, expect, test } from "vitest";
import { InvestigationRequestError } from "../../src/investigation/request.error.js";
import { normalizeInvestigationRequest } from "../../src/investigation/request.js";
import type { InvestigationRequestInput } from "../../src/investigation/request.types.js";

beforeAll(() => {
  const compiler = new URL("./bin/tsc", import.meta.resolve("typescript/package.json"));
  const config = new URL("../../tsconfig.build.json", import.meta.url);
  execFileSync(process.execPath, [fileURLToPath(compiler), "-p", fileURLToPath(config)]);
});

const validInput: InvestigationRequestInput = {
  service: "checkout", environment: "local",
  start: "2026-11-04T10:00:00Z", end: "2030-01-01T00:00:00Z",
};

const validTimestamps = [
  ["2026-11-04T10:00:00Z", "2026-11-04T10:00:00Z"],
  ["2026-11-04T12:00:00+02:00", "2026-11-04T10:00:00Z"],
  ["2026-11-04T06:30:00-03:30", "2026-11-04T10:00:00Z"],
  ["2026-11-04T15:45:00+05:45", "2026-11-04T10:00:00Z"],
  ["2026-11-04T10:01:00+00:01", "2026-11-04T10:00:00Z"],
  ["2026-11-04T00:15:00+02:00", "2026-11-03T22:15:00Z"],
  ["2026-11-04T10:00Z", "2026-11-04T10:00:00Z"],
  ["20261104T100000Z", "2026-11-04T10:00:00Z"],
  ["2026-11-04T10:00:00.100Z", "2026-11-04T10:00:00.1Z"],
  ["2026-11-04T10:00:00.123456789Z", "2026-11-04T10:00:00.123456789Z"],
  ["2024-02-29T12:00:00Z", "2024-02-29T12:00:00Z"],
  ["0000-11-04T10:00:00Z", "0000-11-04T10:00:00Z"],
  ["0099-11-04T10:00:00Z", "0099-11-04T10:00:00Z"],
  ["2026-03-08T02:30:00-05:00", "2026-03-08T07:30:00Z"],
] as const;

test.each(validTimestamps)("normalizes ISO timestamp %s", (start, startUtc) => {
  expect(normalizeInvestigationRequest({ ...validInput, start })).toEqual({
    service: "checkout", environment: "local", startUtc, endUtc: "2030-01-01T00:00:00Z",
  });
});

const invalidTimestamps = [
  "", " ", "0", "1", "not a date",
  "2026-11-04", "2026-11-04T10:00:00", "2026-11-04 10:00:00",
  "November 4, 2026 10:00:00", "November 4, 2026 10:00:00Z",
  "2026-02-30T12:00:00Z", "2026-02-29T12:00:00+02:00",
  "2026-13-04T12:00:00Z", "2026-11-00T12:00:00Z",
  "2026-11-04T24:00:00Z", "2026-11-04T12:60:00Z", "2026-11-04T12:00:61Z",
  "2026-11-04T12:00:00+24:00", "2026-11-04T12:00:00+02:60",
  "2026-11-04T12:00:00.1234567890Z", "2026-11-04T12:00:00Z trailing",
  "+999999-01-01T00:00:00Z",
] as const;

test.each(invalidTimestamps)("rejects invalid or timezone-free timestamp %j", (value) => {
  for (const field of ["start", "end"] as const) {
    const normalize = () => normalizeInvestigationRequest({ ...validInput, [field]: value });
    expect(normalize).toThrow(InvestigationRequestError);
    expect(normalize).toThrow(expect.objectContaining({ field }));
  }
});

test.each([
  ["2026-11-04T10:00:00Z", "2026-11-04T10:00:00Z"],
  ["2026-11-04T10:20:00Z", "2026-11-04T10:00:00Z"],
  ["2026-11-04T12:00:00+02:00", "2026-11-04T10:00:00Z"],
  ["2026-11-04T10:00:00.1Z", "2026-11-04T10:00:00.100Z"],
  ["2026-11-04T10:00:00.000000002Z", "2026-11-04T10:00:00.000000001Z"],
])("rejects nonpositive interval %s through %s", (start, end) => {
  const normalize = () => normalizeInvestigationRequest({ ...validInput, start, end });
  expect(normalize).toThrow(InvestigationRequestError);
  expect(normalize).toThrow(expect.objectContaining({ field: "window" }));
});

test("preserves a positive one-nanosecond interval", () => {
  expect(normalizeInvestigationRequest({
    ...validInput,
    start: "2026-11-04T10:00:00.000000001Z", end: "2026-11-04T10:00:00.000000002Z",
  })).toMatchObject({
    startUtc: "2026-11-04T10:00:00.000000001Z", endUtc: "2026-11-04T10:00:00.000000002Z",
  });
});

test("compares instants across offsets rather than timestamp text", () => {
  expect(normalizeInvestigationRequest({
    ...validInput, start: "2026-11-04T12:00:00+02:00", end: "2026-11-04T09:30:00-01:00",
  })).toMatchObject({ startUtc: "2026-11-04T10:00:00Z", endUtc: "2026-11-04T10:30:00Z" });
});

test.each([
  ["service", ""], ["service", " \t\n"], ["environment", ""], ["environment", " \t\n"],
] as const)("rejects blank %s identity %j", (field, value) => {
  const normalize = () => normalizeInvestigationRequest({ ...validInput, [field]: value });
  expect(normalize).toThrow(InvestigationRequestError);
  expect(normalize).toThrow(expect.objectContaining({ field }));
});

test("preserves nonblank identity and does not mutate the input", () => {
  const input = Object.freeze({ ...validInput, service: " Checkout ", environment: " Custom " });
  expect(normalizeInvestigationRequest(input)).toEqual({
    service: " Checkout ", environment: " Custom ",
    startUtc: "2026-11-04T10:00:00Z", endUtc: "2030-01-01T00:00:00Z",
  });
});

test("inherits Temporal leap-second normalization", () => {
  expect(normalizeInvestigationRequest({
    ...validInput, start: "2016-12-31T23:59:60Z",
  })).toMatchObject({ startUtc: "2016-12-31T23:59:59Z" });
});

test("uses the explicit offset when a Temporal timezone annotation is present", () => {
  expect(normalizeInvestigationRequest({
    ...validInput, start: "2026-11-04T12:00:00+02:00[Asia/Tokyo]",
  })).toMatchObject({ startUtc: "2026-11-04T10:00:00Z" });
});

function normalizeInTimezone(inputs: InvestigationRequestInput[], timezone: string): unknown {
  const moduleUrl = new URL("../../dist/investigation/request.js", import.meta.url).href;
  const output = execFileSync(process.execPath, [
    "--input-type=module", "-e",
    "const {normalizeInvestigationRequest:n}=await import(process.argv[1]);" +
      "console.log(JSON.stringify(JSON.parse(process.argv[2]).map(input=>{" +
      "try{return n(input)}catch(error){return {name:error.name,field:error.field}}})));",
    moduleUrl, JSON.stringify(inputs),
  ], { env: { ...process.env, TZ: timezone }, encoding: "utf8" });
  return JSON.parse(output);
}

test.each(["UTC", "America/New_York", "Asia/Tokyo"])(
  "normalizes explicit instants and rejects missing timezones with TZ=%s", (timezone) => {
    const valid = validTimestamps.map(([start]) => ({ ...validInput, start }));
    expect(normalizeInTimezone(valid, timezone)).toEqual(validTimestamps.map(([, startUtc]) => ({
      service: "checkout", environment: "local", startUtc, endUtc: "2030-01-01T00:00:00Z",
    })));
    const invalid = invalidTimestamps.map(start => ({ ...validInput, start }));
    expect(normalizeInTimezone(invalid, timezone)).toEqual(invalid.map(() => ({
      name: "InvestigationRequestError", field: "start",
    })));
  },
);