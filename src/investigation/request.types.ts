export type InvestigationRequestInput = Readonly<{
  service: string;
  environment: string;
  start: string;
  end: string;
}>;

export type InvestigationRequest = Readonly<{
  service: string;
  environment: string;
  startUtc: string;
  endUtc: string;
}>;
