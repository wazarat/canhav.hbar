export type EnvCheckStatus = "configured" | "missing" | "fallback";

export interface HbarEnvChecks {
  openai: EnvCheckStatus;
  hedera: EnvCheckStatus;
  saucerswap: EnvCheckStatus;
  auditTopic: EnvCheckStatus;
  registry: EnvCheckStatus;
  policyStore: EnvCheckStatus;
}

export interface HbarEnvValidation {
  ok: boolean;
  missingRequired: string[];
  warnings: string[];
  checks: HbarEnvChecks;
}

function isSet(name: string): boolean {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
}

export function validateHbarEnv(options?: {
  throwOnMissingRequired?: boolean;
}): HbarEnvValidation {
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  if (!isSet("OPENAI_API_KEY")) missingRequired.push("OPENAI_API_KEY");
  if (!isSet("HEDERA_OPERATOR_ID")) missingRequired.push("HEDERA_OPERATOR_ID");
  if (!isSet("HEDERA_OPERATOR_KEY")) missingRequired.push("HEDERA_OPERATOR_KEY");

  if (!isSet("SAUCERSWAP_API_KEY")) {
    warnings.push(
      "SAUCERSWAP_API_KEY is not set — swap / write demo routes will be degraded"
    );
  }

  if (!isSet("HBAR_AUDIT_TOPIC_ID")) {
    warnings.push(
      "HBAR_AUDIT_TOPIC_ID is not set — policy decisions will not post to HCS"
    );
  }

  const hasRegistry =
    isSet("NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS") &&
    isSet("NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS");
  const hasSwapAgentId = isSet("HBAR_SWAP_EXECUTOR_AGENT_ID");

  if (!hasRegistry && !hasSwapAgentId) {
    warnings.push(
      "Registry env vars missing — AllowedCounterpartyPolicy will use allowlist fallback"
    );
  }

  const policyStore: EnvCheckStatus = isSet("DATABASE_URL")
    ? "configured"
    : process.env.NODE_ENV === "production"
      ? "fallback"
      : "fallback";

  if (process.env.NODE_ENV === "production" && !isSet("DATABASE_URL")) {
    warnings.push(
      "DATABASE_URL is not set — policy session state uses in-memory store (approval flow may break on serverless)"
    );
  }

  const checks: HbarEnvChecks = {
    openai: isSet("OPENAI_API_KEY") ? "configured" : "missing",
    hedera:
      isSet("HEDERA_OPERATOR_ID") && isSet("HEDERA_OPERATOR_KEY")
        ? "configured"
        : "missing",
    saucerswap: isSet("SAUCERSWAP_API_KEY") ? "configured" : "missing",
    auditTopic: isSet("HBAR_AUDIT_TOPIC_ID") ? "configured" : "missing",
    registry:
      hasRegistry || hasSwapAgentId
        ? "configured"
        : isSet("HBAR_REGISTRY_FALLBACK_ALLOWLIST") ||
            process.env.HBAR_REGISTRY_FALLBACK_ALLOWLIST !== "false"
          ? "fallback"
          : "missing",
    policyStore,
  };

  const result: HbarEnvValidation = {
    ok: missingRequired.length === 0,
    missingRequired,
    warnings,
    checks,
  };

  if (options?.throwOnMissingRequired && missingRequired.length > 0) {
    throw new Error(
      `Missing required environment variables for HBAR Skills:\n${missingRequired.map((v) => `  - ${v}`).join("\n")}\n\nSet them in .env.local (local) or Vercel project settings (production).`
    );
  }

  for (const warning of warnings) {
    console.warn(`[hbar-env] ${warning}`);
  }

  return result;
}
