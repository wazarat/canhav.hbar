import type { StrategyConfig } from "../strategy-config.schema";
import type { IVaultAdapter } from "../vault-adapter.types";

export type EmergencyContext = {
  vaultAddress: string;
  strategyEvm: string;
  userShares: bigint;
};

export type EmergencyResult = {
  mode: StrategyConfig["emergencyOverride"]["mode"];
  decision: string;
  txIds: string[];
  isPaused: boolean;
  exited: boolean;
};

/** Execute configured emergency override — pause-only or full exit to stable. */
export async function runEmergency(
  config: StrategyConfig,
  adapter: IVaultAdapter,
  ctx: EmergencyContext
): Promise<EmergencyResult> {
  const mode = config.emergencyOverride.mode;
  const txIds: string[] = [];

  if (mode === "PAUSE_AND_NOTIFY") {
    const { txId } = await adapter.pause(ctx.vaultAddress);
    if (txId) txIds.push(txId);
    return {
      mode,
      decision: "EMERGENCY_PAUSE",
      txIds,
      isPaused: true,
      exited: false,
    };
  }

  if (ctx.userShares > BigInt(0)) {
    const { txId } = await adapter.withdrawFromVault(
      config,
      ctx.vaultAddress,
      ctx.userShares
    );
    if (txId) txIds.push(txId);
  }

  const panic = await adapter.panic(ctx.vaultAddress);
  if (panic.txId) txIds.push(panic.txId);

  const pause = await adapter.pause(ctx.vaultAddress);
  if (pause.txId) txIds.push(pause.txId);

  return {
    mode,
    decision: "EMERGENCY_EXIT",
    txIds,
    isPaused: true,
    exited: true,
  };
}
