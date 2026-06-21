import type { StrategyConfig } from "./strategy-config.schema";
import type { IVaultAdapter, VaultHealth } from "./vault-adapter.types";

const PPS_SCALE = BigInt("1000000000000000000");

type VaultRecord = {
  pps: bigint;
  totalBalance: bigint;
  userShares: Map<string, bigint>;
};

const vaults = new Map<string, VaultRecord>();

function getOrCreateVault(vaultEvm: string): VaultRecord {
  let record = vaults.get(vaultEvm.toLowerCase());
  if (!record) {
    record = { pps: PPS_SCALE, totalBalance: BigInt(0), userShares: new Map() };
    vaults.set(vaultEvm.toLowerCase(), record);
  }
  return record;
}

/** Deterministic mock EVM address from seed (stable across runs). */
export function deterministicMockVaultAddress(seed: string): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  const h2 = (hash ^ (hash >>> 16)) >>> 0;
  const body = (
    (BigInt(hash) << BigInt(32)) |
    BigInt(h2)
  )
    .toString(16)
    .padStart(40, "0")
    .slice(0, 40);
  return `0x${body}`;
}

export class MockVaultAdapter implements IVaultAdapter {
  async getVaultHealth(
    vaultEvm: string,
    userShares: bigint
  ): Promise<VaultHealth> {
    const vault = getOrCreateVault(vaultEvm);
    const userAssets = this.sharesToAssets(userShares, vault.pps);
    return {
      pricePerFullShare: vault.pps,
      totalBalance: vault.totalBalance,
      userShares,
      userAssets,
    };
  }

  async getStrategyApy(strategyEvm: string): Promise<number> {
    void strategyEvm;
    return 8.5;
  }

  sharesToAssets(shares: bigint, pps: bigint): bigint {
    if (pps === BigInt(0)) return BigInt(0);
    return (shares * pps) / PPS_SCALE;
  }

  assetsToShares(assets: bigint, pps: bigint): bigint {
    if (pps === BigInt(0)) return BigInt(0);
    return (assets * PPS_SCALE) / pps;
  }

  async createVault(opts: {
    isCLM: boolean;
    strategyEvm: string;
    name: string;
    symbol: string;
    approvalDelay: number;
    isHederaToken: boolean;
  }): Promise<string> {
    const seed = `${opts.name}:${opts.symbol}:${opts.strategyEvm}:${opts.isCLM}`;
    const address = deterministicMockVaultAddress(seed);
    getOrCreateVault(address);
    return address;
  }

  async depositToVault(
    config: StrategyConfig,
    vaultEvm: string,
    amountAssets: bigint
  ): Promise<{ txId?: string }> {
    const vault = getOrCreateVault(vaultEvm);
    const userKey = config.userId.toLowerCase();
    const shares = this.assetsToShares(amountAssets, vault.pps);
    const prev = vault.userShares.get(userKey) ?? BigInt(0);
    vault.userShares.set(userKey, prev + shares);
    vault.totalBalance += amountAssets;
    return { txId: `mock-deposit-${Date.now()}` };
  }

  async withdrawFromVault(
    config: StrategyConfig,
    vaultEvm: string,
    shares: bigint
  ): Promise<{ txId?: string }> {
    const vault = getOrCreateVault(vaultEvm);
    const userKey = config.userId.toLowerCase();
    const prev = vault.userShares.get(userKey) ?? BigInt(0);
    const burned = shares > prev ? prev : shares;
    vault.userShares.set(userKey, prev - burned);
    const assets = this.sharesToAssets(burned, vault.pps);
    vault.totalBalance =
      vault.totalBalance > assets ? vault.totalBalance - assets : BigInt(0);
    return { txId: `mock-withdraw-${Date.now()}` };
  }

  async harvest(
    config: StrategyConfig,
    strategyEvm: string
  ): Promise<{ txId?: string }> {
    void config;
    void strategyEvm;
    return { txId: `mock-harvest-${Date.now()}` };
  }

  async panic(strategyEvm: string): Promise<{ txId?: string }> {
    void strategyEvm;
    return { txId: `mock-panic-${Date.now()}` };
  }

  async pause(strategyEvm: string): Promise<{ txId?: string }> {
    void strategyEvm;
    return { txId: `mock-pause-${Date.now()}` };
  }
}

/** Harvest bumps PPS slightly — used by keeper (Phase 6). */
export function mockHarvestBumpPps(vaultEvm: string, bps = BigInt(5)): void {
  const vault = getOrCreateVault(vaultEvm);
  vault.pps += (vault.pps * bps) / BigInt(10_000);
}

export const mockVaultAdapter = new MockVaultAdapter();
