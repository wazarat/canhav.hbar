import { runHederaSkillsAgent } from "@/agents/hedera-skills-agent";
import { runMarketIntelAgent } from "@/agents/market-intel-agent";
import { runContractAuditorAgent } from "@/agents/contract-auditor-agent";

export type AgentCapability =
  | "hedera-skills"
  | "market-intel"
  | "contract-auditor";

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
    default:
      throw new Error(`Unknown agent capability: ${capability}`);
  }
}
