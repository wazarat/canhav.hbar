import type { StrategyConfig } from "./strategy-config.schema";

/** Shared read model for Sentinel + policy context. */
export interface VaultHealth {
  pricePerFullShare: bigint;
  totalBalance: bigint;
  userShares: bigint;
  userAssets: bigint;
}

/** Chain-facing adapter contract — implemented by BonzoVaultAdapter (Phase 2) and MockVaultAdapter (testnet fallback). */
export interface IVaultAdapter {
  getVaultHealth(vaultEvm: string, userShares: bigint): Promise<VaultHealth>;
  getStrategyApy(strategyEvm: string): Promise<number>;
  sharesToAssets(shares: bigint, pps: bigint): bigint;
  assetsToShares(assets: bigint, pps: bigint): bigint;
  createVault(opts: {
    isCLM: boolean;
    strategyEvm: string;
    name: string;
    symbol: string;
    approvalDelay: number;
    isHederaToken: boolean;
  }): Promise<string>;
  depositToVault(
    config: StrategyConfig,
    vaultEvm: string,
    amountAssets: bigint
  ): Promise<{ txId?: string }>;
  withdrawFromVault(
    config: StrategyConfig,
    vaultEvm: string,
    shares: bigint
  ): Promise<{ txId?: string }>;
  harvest(
    config: StrategyConfig,
    strategyEvm: string
  ): Promise<{ txId?: string }>;
  panic(strategyEvm: string): Promise<{ txId?: string }>;
  pause(strategyEvm: string): Promise<{ txId?: string }>;
}

export type VaultAdapterMode = "chain" | "mock" | "dry-run";
