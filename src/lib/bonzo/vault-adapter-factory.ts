import {
  MockVaultAdapter,
  deterministicMockVaultAddress,
  mockVaultAdapter,
} from "./mock-vault-adapter";
import { isBonzoInfraConfigured } from "./bonzo-addresses";
import { getChainVaultAdapter } from "./vault-adapter";
import type { IVaultAdapter, VaultAdapterMode } from "./vault-adapter.types";
import type { StrategyConfig } from "./strategy-config.schema";

class DryRunVaultAdapter extends MockVaultAdapter {
  override async depositToVault(
    config: StrategyConfig,
    vaultEvm: string,
    amountAssets: bigint
  ): Promise<{ txId?: string }> {
    void config;
    void vaultEvm;
    void amountAssets;
    return { txId: undefined };
  }

  override async withdrawFromVault(
    config: StrategyConfig,
    vaultEvm: string,
    shares: bigint
  ): Promise<{ txId?: string }> {
    void config;
    void vaultEvm;
    void shares;
    return { txId: undefined };
  }

  override async harvest(
    config: StrategyConfig,
    strategyEvm: string
  ): Promise<{ txId?: string }> {
    void config;
    void strategyEvm;
    return { txId: undefined };
  }

  override async panic(strategyEvm: string): Promise<{ txId?: string }> {
    void strategyEvm;
    return { txId: undefined };
  }

  override async pause(strategyEvm: string): Promise<{ txId?: string }> {
    void strategyEvm;
    return { txId: undefined };
  }
}

const dryRunVaultAdapter = new DryRunVaultAdapter();

export function getVaultAdapterMode(): VaultAdapterMode {
  const raw = process.env.BONZO_VAULT_ADAPTER_MODE ?? "mock";
  if (raw === "chain" || raw === "mock" || raw === "dry-run") return raw;
  console.warn(
    `[bonzo-vault] Unknown BONZO_VAULT_ADAPTER_MODE=${raw}, defaulting to mock`
  );
  return "mock";
}

export function getVaultAdapter(mode?: VaultAdapterMode): IVaultAdapter {
  const resolved = mode ?? getVaultAdapterMode();
  switch (resolved) {
    case "mock":
      return mockVaultAdapter;
    case "dry-run":
      return dryRunVaultAdapter;
    case "chain":
      if (!isBonzoInfraConfigured()) {
        throw new Error(
          "BONZO_VAULT_ADAPTER_MODE=chain requires BONZO_VAULT_FACTORY (or bonzo-addresses.ts testnet fill). Run pnpm bonzo:vault-smoke after configuring."
        );
      }
      return getChainVaultAdapter();
    default:
      return mockVaultAdapter;
  }
}

export { deterministicMockVaultAddress, dryRunVaultAdapter };
