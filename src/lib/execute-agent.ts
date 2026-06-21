import { runHederaSkillsAgent } from "@/agents/hedera-skills-agent";
import { runMarketIntelAgent } from "@/agents/market-intel-agent";
import { runContractAuditorAgent } from "@/agents/contract-auditor-agent";
import { runGenericAgent } from "@/agents/generic-agent";

export type AgentCapability =
  | "hedera-skills"
  | "market-intel"
  | "contract-auditor"
  | "token-deployer"
  | "defi-analyst"
  | "nft-minter"
  | "hcs-logger"
  | "gas-optimizer"
  | "ecosystem-reporter"
  | "compliance-checker"
  | "code-generator"
  | "bridge-advisor"
  | "ai-studio"
  | "bonzo-vault-strategist";

export async function executeAgent(
  capability: AgentCapability,
  intake: Record<string, unknown>
): Promise<string> {
  switch (capability) {
    case "hedera-skills":
      return runHederaSkillsAgent({
        question: String(intake.question ?? ""),
        context: intake.context ? String(intake.context) : undefined,
      });
    case "market-intel":
      return runMarketIntelAgent({
        query: String(intake.query ?? ""),
        sector: intake.sector ? String(intake.sector) : undefined,
        filters: intake.filters as Record<string, string> | undefined,
      });
    case "contract-auditor":
      return runContractAuditorAgent({
        contractSource: String(intake.contractSource ?? ""),
        contractName: intake.contractName
          ? String(intake.contractName)
          : undefined,
      });
    case "token-deployer":
      return runGenericAgent("token-deployer", intake);
    case "defi-analyst":
      return runGenericAgent("defi-analyst", intake);
    case "nft-minter":
      return runGenericAgent("nft-minter", intake);
    case "hcs-logger":
      return runGenericAgent("hcs-logger", intake);
    case "gas-optimizer":
      return runGenericAgent("gas-optimizer", intake);
    case "ecosystem-reporter":
      return runGenericAgent("ecosystem-reporter", intake);
    case "compliance-checker":
      return runGenericAgent("compliance-checker", intake);
    case "code-generator":
      return runGenericAgent("code-generator", intake);
    case "bridge-advisor":
      return runGenericAgent("bridge-advisor", intake);
    case "ai-studio":
      return "AI Studio uses a streaming interface. Visit /ai-studio to interact with the Hedera Agent Kit v3 in real time.";
    case "bonzo-vault-strategist": {
      const strategyId = intake.strategyId
        ? String(intake.strategyId)
        : undefined;
      return [
        "Bonzo Vault Strategist uses a dedicated survey and keeper pipeline (not generic LLM chat).",
        "",
        "Flow:",
        "1. Open /agents/bonzo-vault to configure StrategyConfig (5-step survey)",
        "2. Provision persists strategy + vault_policy_state; HCS audit on HBAR_AUDIT_TOPIC_ID",
        "3. Run keeper via POST /api/agents/bonzo-vault/run with { strategyId }",
        "",
        "See /skills/defi/bonzo-vaults.SKILL.md for vault mechanics and API details.",
        strategyId
          ? `Provided strategyId: ${strategyId} — trigger keeper with the run API.`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    }
    default:
      throw new Error(`Unknown agent capability: ${capability}`);
  }
}
