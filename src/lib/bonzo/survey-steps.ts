import { z } from "zod";
import {
  VaultType,
  YieldFloorAction,
  SpendLimits,
  MacroGating,
  EmergencyOverride,
  StrategyConfigSchema,
  parseStrategyConfig,
  generateStrategyId,
  type StrategyConfig,
} from "./strategy-config.schema";

const hederaOrEvm = z
  .string()
  .regex(/^(0\.0\.\d+|0x[a-fA-F0-9]{40})$/, "must be 0.0.x or 0x EVM address");

export const SURVEY_STEP_IDS = [
  "asset-target",
  "capital-guardrails",
  "yield-slippage",
  "macro-toggles",
  "emergency",
] as const;

export type SurveyStepId = (typeof SURVEY_STEP_IDS)[number];

export const SURVEY_STEPS: {
  id: SurveyStepId;
  title: string;
  description: string;
}[] = [
  {
    id: "asset-target",
    title: "Asset & Target",
    description: "Vault type and approved vault / token whitelist",
  },
  {
    id: "capital-guardrails",
    title: "Capital Guardrails",
    description: "Spend limits denominated in your target asset",
  },
  {
    id: "yield-slippage",
    title: "Yield Floor & Slippage",
    description: "Minimum APY, breach action, and execution policy",
  },
  {
    id: "macro-toggles",
    title: "Macro Toggles",
    description: "Optional VIX and news sentiment gates",
  },
  {
    id: "emergency",
    title: "Emergency Policy",
    description: "Behavior when yield floor or macro gates breach",
  },
];

export const AssetTargetStepSchema = z.object({
  vaultType: VaultType,
  whitelistVaults: z.array(hederaOrEvm).min(1),
  whitelistTokens: z.array(hederaOrEvm).min(1),
});

export const CapitalGuardrailsStepSchema = SpendLimits;

export const YieldSlippageStepSchema = z.object({
  minNetAPY: z.number().min(0).max(100),
  actionOnBreach: YieldFloorAction.default("TRIGGER_EMERGENCY_OVERRIDE"),
  maxSlippagePercent: z.union([z.literal(0.1), z.literal(0.5), z.literal(1.0)]),
  harvestCadenceMinutes: z.number().int().min(15).max(1440),
});

export const MacroTogglesStepSchema = MacroGating;

export const EmergencyStepSchema = EmergencyOverride;

export type AssetTargetAnswers = z.infer<typeof AssetTargetStepSchema>;
export type CapitalGuardrailsAnswers = z.infer<typeof CapitalGuardrailsStepSchema>;
export type YieldSlippageAnswers = z.infer<typeof YieldSlippageStepSchema>;
export type MacroTogglesAnswers = z.infer<typeof MacroTogglesStepSchema>;
export type EmergencyAnswers = z.infer<typeof EmergencyStepSchema>;

export type SurveyAnswers = {
  assetTarget?: AssetTargetAnswers;
  capitalGuardrails?: CapitalGuardrailsAnswers;
  yieldSlippage?: YieldSlippageAnswers;
  macroToggles?: MacroTogglesAnswers;
  emergency?: EmergencyAnswers;
};

const STEP_SCHEMAS: Record<SurveyStepId, z.ZodTypeAny> = {
  "asset-target": AssetTargetStepSchema,
  "capital-guardrails": CapitalGuardrailsStepSchema,
  "yield-slippage": YieldSlippageStepSchema,
  "macro-toggles": MacroTogglesStepSchema,
  emergency: EmergencyStepSchema,
};

const STEP_ANSWER_KEYS: Record<SurveyStepId, keyof SurveyAnswers> = {
  "asset-target": "assetTarget",
  "capital-guardrails": "capitalGuardrails",
  "yield-slippage": "yieldSlippage",
  "macro-toggles": "macroToggles",
  emergency: "emergency",
};

export function getStepIndex(stepId: SurveyStepId): number {
  return SURVEY_STEP_IDS.indexOf(stepId);
}

export function getNextStepId(stepId: SurveyStepId): SurveyStepId | null {
  const idx = getStepIndex(stepId);
  return idx < SURVEY_STEP_IDS.length - 1 ? SURVEY_STEP_IDS[idx + 1] : null;
}

export function validateSurveyStep(
  stepId: SurveyStepId,
  answers: unknown
):
  | { ok: true; data: unknown }
  | { ok: false; errors: z.ZodIssue[] } {
  const schema = STEP_SCHEMAS[stepId];
  const result = schema.safeParse(answers);
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, errors: result.error.issues };
}

export function formatZodErrors(issues: z.ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function compileSurveyAnswers(
  answers: SurveyAnswers,
  userId: string
):
  | { ok: true; config: StrategyConfig }
  | { ok: false; errors: z.ZodIssue[] } {
  const {
    assetTarget,
    capitalGuardrails,
    yieldSlippage,
    macroToggles,
    emergency,
  } = answers;

  const draft = {
    strategyId: generateStrategyId(),
    userId,
    targetProtocol: "Bonzo Finance Vaults" as const,
    vaultType: assetTarget?.vaultType ?? "SINGLE_ASSET_LENDING",
    status: "draft" as const,
    deterministicPolicies: {
      whitelistVaults: assetTarget?.whitelistVaults ?? [],
      whitelistTokens: assetTarget?.whitelistTokens ?? [],
      spendLimits: capitalGuardrails ?? {
        maxTotalAllocation: "0",
        maxPerTransaction: "0",
        denominatedAsset: "USDC",
      },
      execution: {
        maxSlippagePercent: yieldSlippage?.maxSlippagePercent ?? 0.5,
        harvestCadenceMinutes: yieldSlippage?.harvestCadenceMinutes ?? 120,
      },
    },
    intelligentConstraints: {
      yieldFloor: {
        minNetAPY: yieldSlippage?.minNetAPY ?? 0,
        actionOnBreach:
          yieldSlippage?.actionOnBreach ?? "TRIGGER_EMERGENCY_OVERRIDE",
      },
      macroGating: macroToggles ?? {
        vixIndexTracked: false,
        vixMaxThreshold: 30,
        newsSentimentFilterEnabled: false,
      },
    },
    emergencyOverride: emergency ?? {
      mode: "PAUSE_AND_NOTIFY",
      fallbackAsset: "USDC",
    },
  };

  return parseStrategyConfig(draft);
}

export function isSurveyComplete(answers: SurveyAnswers): boolean {
  return SURVEY_STEP_IDS.every((stepId) => {
    const key = STEP_ANSWER_KEYS[stepId];
    const stepAnswers = answers[key];
    if (!stepAnswers) return false;
    return validateSurveyStep(stepId, stepAnswers).ok;
  });
}

export function getCompiledPreview(
  answers: SurveyAnswers,
  userId: string
): StrategyConfig | null {
  const result = compileSurveyAnswers(answers, userId);
  return result.ok ? result.config : null;
}

/** Re-export for client-side preview validation */
export { StrategyConfigSchema };
