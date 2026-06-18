import type { CounterpartyConfig } from "./policy-state";

const counterpartyBySession = new Map<string, CounterpartyConfig>();

export function bindSessionCounterparty(
  sessionId: string,
  counterparty: CounterpartyConfig
): void {
  counterpartyBySession.set(sessionId, counterparty);
}

export function getSessionCounterparty(
  sessionId: string
): CounterpartyConfig | undefined {
  return counterpartyBySession.get(sessionId);
}

export type HbarContext = {
  sessionId?: string;
};

export function getContextSessionId(context: HbarContext): string | undefined {
  return context.sessionId;
}
