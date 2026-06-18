import type { Plugin } from "@hashgraph/hedera-agent-kit";
import { pythPlugin } from "hak-pyth-plugin";
import { hbarStubPlugin } from "./x402/pay";
import { bonzoReadonlyPlugin } from "./plugins/bonzo-readonly";
import {
  saucerswapExecutorPlugin,
  saucerswapQuoteOnlyPlugin,
} from "./plugins/saucerswap";
import type { BudgetConfig, ApprovalConfig } from "./policy-state";

export type DataSourceId = "bonzo" | "pyth" | "saucerswap-quote";
export type CustomTaskType = "read" | "write";

export interface CustomAgentSpec {
  id: string;
  name: string;
  objective: string;
  dataSources: DataSourceId[];
  taskType: CustomTaskType;
  budget: BudgetConfig;
  approval: ApprovalConfig;
  maxSlippagePct?: number;
  allowWrite?: boolean;
  createdAt: string;
}

const PER_TASK_CAP_CEILING = 25;

export function hasWriteSource(spec: Pick<CustomAgentSpec, "dataSources" | "allowWrite">): boolean {
  return spec.allowWrite === true && spec.dataSources.includes("saucerswap-quote");
}

export function clampCustomAgentSpec(spec: CustomAgentSpec): CustomAgentSpec {
  const dataSources = Array.from(
    new Set(spec.dataSources.filter((s) =>
      ["bonzo", "pyth", "saucerswap-quote"].includes(s)
    ))
  ) as DataSourceId[];

  if (dataSources.length === 0) {
    throw new Error("At least one data source is required");
  }

  const writeCapable = hasWriteSource({ dataSources, allowWrite: spec.allowWrite });
  const taskType: CustomTaskType = writeCapable ? "write" : "read";

  const perTaskCapHbar = Math.min(
    Math.max(0.1, spec.budget?.perTaskCapHbar ?? 5),
    PER_TASK_CAP_CEILING
  );
  const dailyBudgetHbar = Math.max(0.1, spec.budget?.dailyBudgetHbar ?? 20);

  const approval: ApprovalConfig = {
    autoApproveBelowHbar: Math.max(0, spec.approval?.autoApproveBelowHbar ?? 2),
    alwaysApproveTaskTypes:
      taskType === "write"
        ? ["write"]
        : (spec.approval?.alwaysApproveTaskTypes ?? ["write"]),
  };

  const slug = spec.id
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);

  if (!slug) {
    throw new Error("Invalid agent id");
  }

  return {
    id: slug,
    name: spec.name.trim().slice(0, 80) || "Custom Agent",
    objective: spec.objective.trim().slice(0, 2000),
    dataSources,
    taskType,
    budget: { perTaskCapHbar, dailyBudgetHbar },
    approval,
    maxSlippagePct:
      taskType === "write"
        ? Math.min(Math.max(0.01, spec.maxSlippagePct ?? 0.5), 10)
        : undefined,
    allowWrite: writeCapable,
    createdAt: spec.createdAt ?? new Date().toISOString(),
  };
}

export function pluginsForDataSources(
  sources: DataSourceId[],
  allowWrite: boolean
): Plugin[] {
  const plugins: Plugin[] = [hbarStubPlugin];
  const seen = new Set<string>();

  for (const source of sources) {
    if (source === "bonzo" && !seen.has("bonzo")) {
      plugins.push(bonzoReadonlyPlugin);
      seen.add("bonzo");
    }
    if (source === "pyth" && !seen.has("pyth")) {
      plugins.push(pythPlugin);
      seen.add("pyth");
    }
    if (source === "saucerswap-quote" && !seen.has("saucerswap")) {
      plugins.push(allowWrite ? saucerswapExecutorPlugin : saucerswapQuoteOnlyPlugin);
      seen.add("saucerswap");
    }
  }

  return plugins;
}

export function dataSourceLabels(sources: DataSourceId[]): string[] {
  return sources.map((s) => {
    switch (s) {
      case "bonzo":
        return "Bonzo market data (bonzo_market_data_tool)";
      case "pyth":
        return "Pyth oracle (pyth_get_latest_prices)";
      case "saucerswap-quote":
        return "SaucerSwap quotes (saucerswap_get_swap_quote)";
    }
  });
}

export const CUSTOM_TASK_PRICE_HBAR = 1;
