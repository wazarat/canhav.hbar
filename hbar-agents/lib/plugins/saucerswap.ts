import type { Context, Plugin } from "@hashgraph/hedera-agent-kit";
import {
  saucerswapPlugin,
  saucerswapPluginToolNames,
  SAUCERSWAP_TESTNET,
  type SaucerSwapNetworkDefaults,
} from "hak-saucerswap-plugin";

export const SAUCERSWAP_GET_SWAP_QUOTE_TOOL =
  saucerswapPluginToolNames.SAUCERSWAP_GET_SWAP_QUOTE_TOOL;
export const SAUCERSWAP_SWAP_TOKENS_TOOL =
  saucerswapPluginToolNames.SAUCERSWAP_SWAP_TOKENS_TOOL;

const SWAP_EXECUTOR_TOOLS: readonly string[] = [
  SAUCERSWAP_GET_SWAP_QUOTE_TOOL,
  SAUCERSWAP_SWAP_TOKENS_TOOL,
];

const QUOTE_ONLY_TOOLS: readonly string[] = [SAUCERSWAP_GET_SWAP_QUOTE_TOOL];

export interface SaucerSwapPluginConfig extends SaucerSwapNetworkDefaults {
  network?: "testnet" | "mainnet";
  apiKey?: string;
  defaultPoolVersion?: "v1" | "v2";
}

/** Resolve SaucerSwap plugin config for Hedera testnet (M3). */
export function getSaucerSwapPluginConfig(): SaucerSwapPluginConfig {
  const network =
    process.env.SAUCERSWAP_NETWORK === "mainnet" ? "mainnet" : "testnet";
  const defaults = SAUCERSWAP_TESTNET;

  return {
    network,
    apiKey: process.env.SAUCERSWAP_API_KEY,
    routerContractId:
      process.env.SAUCERSWAP_ROUTER_CONTRACT_ID ?? defaults.routerContractId,
    routerV2ContractId:
      process.env.SAUCERSWAP_ROUTER_V2_CONTRACT_ID ??
      defaults.routerV2ContractId,
    wrappedHbarTokenId:
      process.env.SAUCERSWAP_WRAPPED_HBAR_TOKEN_ID ??
      defaults.wrappedHbarTokenId,
    tokenAliases: defaults.tokenAliases,
    defaultPoolVersion: "v2",
  };
}

/** Merge SaucerSwap config into agent kit context (plugin-config + config). */
export function applySaucerSwapContextConfig(context: Context): void {
  const saucerswap = getSaucerSwapPluginConfig();
  const ctx = context as Context & {
    config?: { saucerswap?: SaucerSwapPluginConfig };
    pluginConfig?: { saucerswap?: SaucerSwapPluginConfig };
  };
  ctx.config = { ...ctx.config, saucerswap };
  ctx.pluginConfig = { ...ctx.pluginConfig, saucerswap };
}

/**
 * Write-capable SaucerSwap plugin wrapper — quote + swap tools only (M3 scope).
 * Liquidity and farm tools are excluded.
 */
export const saucerswapExecutorPlugin: Plugin = {
  name: "saucerswap-executor",
  description:
    "SaucerSwap DEX quote and swap execution on Hedera testnet (Swap Executor)",
  tools: (context: Context) =>
    saucerswapPlugin
      .tools(context)
      .filter((tool) => SWAP_EXECUTOR_TOOLS.includes(tool.method)),
};

/** Quote-only SaucerSwap plugin — no swap tool (read-only agents). */
export const saucerswapQuoteOnlyPlugin: Plugin = {
  name: "saucerswap-quote",
  description:
    "SaucerSwap DEX quote reads on Hedera testnet (read-only price derivation)",
  tools: (context: Context) =>
    saucerswapPlugin
      .tools(context)
      .filter((tool) => QUOTE_ONLY_TOOLS.includes(tool.method)),
};
