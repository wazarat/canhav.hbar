import type { IntakeSchema } from "./db/schema";

export interface UCPManifest {
  protocol: "ucp";
  version: "1.0";
  platform: string;
  description: string;
  payment_methods: string[];
  capabilities: UCPCapability[];
  checkout: string;
}

export interface UCPCapability {
  agentId: string;
  onChainAgentId: number | null;
  name: string;
  description: string;
  capabilities: string[];
  pricing: { usd: string | number };
  rating: { score: number; count: number };
  intakeSchema: IntakeSchema | null;
  endpoint: string;
}

export interface UCPCheckoutRequest {
  workerAgentId: string;
  hiringAgentId: string;
  taskDescription: Record<string, unknown> | string;
}

export interface UCPCheckoutResponse {
  sessionId: string;
  onChainJobId: number;
  amountUsd: string | number | null;
  amountHbar: string | number | null;
  escrowAddress: string | undefined;
  escrowTxHash: string | null;
  hcsTopicId: string | null;
  resultUrl: string;
  statusUrl: string;
}

export interface UCPPayRequest {
  sessionId: string;
}

export interface UCPRateRequest {
  sessionId: string;
  rating: number;
  tag1?: string;
  tag2?: string;
}

export function validateIntake(
  intake: Record<string, unknown>,
  schema: IntakeSchema
): string[] {
  const missing: string[] = [];
  for (const field of schema.fields) {
    if (field.required && !intake[field.name]) {
      missing.push(field.name);
    }
  }
  return missing;
}

export function buildManifest(capabilities: UCPCapability[]): UCPManifest {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    protocol: "ucp",
    version: "1.0",
    platform: "CanHav HBAR",
    description:
      "AI-native knowledge and agent marketplace for the Hedera ecosystem",
    payment_methods: ["hedera_hbar"],
    capabilities,
    checkout: `${appUrl}/api/ucp/checkout`,
  };
}
