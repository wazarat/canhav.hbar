import { z } from "zod";

export const VaultType = z.enum([
  "SINGLE_ASSET_LENDING",
  "SINGLE_ASSET_STAKING",
  "SAUCERSWAP_CLM_LP",
]);

export const EmergencyMode = z.enum(["PAUSE_AND_NOTIFY", "EXIT_TO_STABLE"]);

export const YieldFloorAction = z.enum([
  "TRIGGER_EMERGENCY_OVERRIDE",
  "PAUSE_ONLY",
  "NOTIFY_ONLY",
]);

const hederaOrEvm = z
  .string()
  .regex(/^(0\.0\.\d+|0x[a-fA-F0-9]{40})$/, "must be 0.0.x or 0x EVM address");

const decimalString = z
  .string()
  .regex(/^\d+(\.\d{1,18})?$/, "decimal string");

export const SpendLimits = z.object({
  maxTotalAllocation: decimalString,
  maxPerTransaction: decimalString,
  denominatedAsset: z.string().min(2),
});

export const ExecutionPolicy = z.object({
  maxSlippagePercent: z.union([z.literal(0.1), z.literal(0.5), z.literal(1.0)]),
  harvestCadenceMinutes: z.number().int().min(15).max(1440).default(120),
});

export const DeterministicPolicies = z.object({
  whitelistVaults: z.array(hederaOrEvm).min(1),
  whitelistTokens: z.array(hederaOrEvm).min(1),
  spendLimits: SpendLimits,
  execution: ExecutionPolicy,
});

export const YieldFloor = z.object({
  minNetAPY: z.number().min(0).max(100),
  actionOnBreach: YieldFloorAction.default("TRIGGER_EMERGENCY_OVERRIDE"),
});

export const MacroGating = z.object({
  vixIndexTracked: z.boolean().default(false),
  vixMaxThreshold: z.number().min(10).max(90).default(30),
  newsSentimentFilterEnabled: z.boolean().default(false),
});

export const IntelligentConstraints = z.object({
  yieldFloor: YieldFloor,
  macroGating: MacroGating,
});

export const EmergencyOverride = z.object({
  mode: EmergencyMode,
  fallbackAsset: z.string().default("USDC"),
});

export const StrategyConfigSchema = z
  .object({
    strategyId: z.string().startsWith("strat_"),
    userId: z.string().min(1),
    targetProtocol: z.literal("Bonzo Finance Vaults"),
    vaultType: VaultType,
    status: z
      .enum(["draft", "active", "paused", "exited"])
      .default("draft"),
    deterministicPolicies: DeterministicPolicies,
    intelligentConstraints: IntelligentConstraints,
    emergencyOverride: EmergencyOverride,
  })
  .refine(
    (c) =>
      Number(c.deterministicPolicies.spendLimits.maxPerTransaction) <=
      Number(c.deterministicPolicies.spendLimits.maxTotalAllocation),
    {
      message: "maxPerTransaction cannot exceed maxTotalAllocation",
      path: ["deterministicPolicies", "spendLimits"],
    }
  );

export type StrategyConfig = z.infer<typeof StrategyConfigSchema>;

export function parseStrategyConfig(
  input: unknown
):
  | { ok: true; config: StrategyConfig }
  | { ok: false; errors: z.ZodIssue[] } {
  const r = StrategyConfigSchema.safeParse(input);
  return r.success
    ? { ok: true, config: r.data }
    : { ok: false, errors: r.error.issues };
}

export function generateStrategyId(): string {
  return `strat_bonzo_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}
