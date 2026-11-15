export class InvestigationRequestError extends Error {
  readonly field: "service" | "environment" | "start" | "end" | "window";

  constructor(field: InvestigationRequestError["field"], message: string) {
    super(message);
    this.name = "InvestigationRequestError";
    this.field = field;
  }
}
