"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Vault,
  Wallet,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  useWalletStore,
  shortenAddress,
} from "@/lib/stores/wallet-store";
import {
  hydrateBonzoVaultSurveyStore,
  useBonzoVaultSurveyStore,
} from "@/lib/stores/bonzo-vault-survey-store";
import {
  SURVEY_STEPS,
  SURVEY_STEP_IDS,
  StrategyConfigSchema,
  compileSurveyAnswers,
  validateSurveyStep,
  formatZodErrors,
  type AssetTargetAnswers,
  type SurveyAnswers,
  type CapitalGuardrailsAnswers,
  type YieldSlippageAnswers,
  type MacroTogglesAnswers,
  type EmergencyAnswers,
} from "@/lib/bonzo/survey-steps";
import { BONZO_INFRA, BONZO_RESERVES } from "@/lib/bonzo/bonzo-addresses";

const TOKEN_PRESETS = Object.entries(BONZO_RESERVES).map(([symbol, addrs]) => ({
  symbol,
  token: addrs.token,
  aToken: addrs.aToken,
}));

const VAULT_TYPES = [
  { value: "SINGLE_ASSET_LENDING", label: "Single-Asset Lending" },
  { value: "SINGLE_ASSET_STAKING", label: "Single-Asset Staking" },
  { value: "SAUCERSWAP_CLM_LP", label: "SaucerSwap CLM LP" },
] as const;

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0] as const;

const YIELD_BREACH_ACTIONS = [
  { value: "TRIGGER_EMERGENCY_OVERRIDE", label: "Trigger emergency override" },
  { value: "PAUSE_ONLY", label: "Pause only" },
  { value: "NOTIFY_ONLY", label: "Notify only" },
] as const;

const EMERGENCY_MODES = [
  { value: "PAUSE_AND_NOTIFY", label: "Pause and notify" },
  { value: "EXIT_TO_STABLE", label: "Exit to stable asset" },
] as const;

export default function BonzoVaultSurveyPage() {
  const { address, isConnected, connect, isConnecting, network } =
    useWalletStore();
  const { currentStep, answers, setCurrentStep, setStepAnswers, reset } =
    useBonzoVaultSurveyStore();

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewJson, setPreviewJson] = useState<string | null>(null);
  const [provisionResult, setProvisionResult] = useState<{
    strategyId?: string;
    dbId?: string;
    vaultAddress?: string;
    status?: string;
    hcsTopicId?: string | null;
    hcsTxId?: string;
    adapterMode?: string;
  } | null>(null);
  const [keeperLoading, setKeeperLoading] = useState(false);
  const [keeperResult, setKeeperResult] = useState<{
    status?: string;
    decision?: string;
    skipReason?: string;
    error?: string;
    hcsTxId?: string;
    feeTxId?: string;
    txId?: string;
    hashScanTopicUrl?: string;
    hashScanTxUrl?: string;
  } | null>(null);

  const stepId = SURVEY_STEP_IDS[currentStep];
  const stepMeta = SURVEY_STEPS[currentStep];
  const approvedVaults = BONZO_INFRA[network].approvedVaults;

  const [manualVault, setManualVault] = useState("");
  const [selectedVaults, setSelectedVaults] = useState<string[]>(
    answers.assetTarget?.whitelistVaults ?? []
  );
  const [selectedTokens, setSelectedTokens] = useState<string[]>(
    answers.assetTarget?.whitelistTokens ?? [BONZO_RESERVES.USDC.token]
  );

  useEffect(() => {
    hydrateBonzoVaultSurveyStore();
  }, []);

  useEffect(() => {
    if (answers.assetTarget) {
      setSelectedVaults(answers.assetTarget.whitelistVaults);
      setSelectedTokens(answers.assetTarget.whitelistTokens);
    }
  }, [answers.assetTarget]);

  const userId = address ?? "";

  function toggleInList(list: string[], value: string): string[] {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

  function addManualVault() {
    const trimmed = manualVault.trim();
    if (!trimmed) return;
    setSelectedVaults((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed]
    );
    setManualVault("");
  }

  function buildStepPayload(): unknown {
    switch (stepId) {
      case "asset-target":
        return {
          vaultType:
            answers.assetTarget?.vaultType ?? "SINGLE_ASSET_LENDING",
          whitelistVaults: selectedVaults,
          whitelistTokens: selectedTokens,
        } satisfies AssetTargetAnswers;
      case "capital-guardrails":
        return answers.capitalGuardrails ?? {
          maxTotalAllocation: "1000",
          maxPerTransaction: "100",
          denominatedAsset: "USDC",
        };
      case "yield-slippage":
        return answers.yieldSlippage ?? {
          minNetAPY: 5,
          actionOnBreach: "TRIGGER_EMERGENCY_OVERRIDE",
          maxSlippagePercent: 0.5,
          harvestCadenceMinutes: 120,
        };
      case "macro-toggles":
        return answers.macroToggles ?? {
          vixIndexTracked: false,
          vixMaxThreshold: 30,
          newsSentimentFilterEnabled: false,
        };
      case "emergency":
        return answers.emergency ?? {
          mode: "PAUSE_AND_NOTIFY",
          fallbackAsset: "USDC",
        };
      default:
        return {};
    }
  }

  function persistCurrentStepToStore(stepPayload: unknown) {
    switch (stepId) {
      case "asset-target":
        setStepAnswers("assetTarget", stepPayload as AssetTargetAnswers);
        break;
      case "capital-guardrails":
        setStepAnswers(
          "capitalGuardrails",
          stepPayload as CapitalGuardrailsAnswers
        );
        break;
      case "yield-slippage":
        setStepAnswers("yieldSlippage", stepPayload as YieldSlippageAnswers);
        break;
      case "macro-toggles":
        setStepAnswers("macroToggles", stepPayload as MacroTogglesAnswers);
        break;
      case "emergency":
        setStepAnswers("emergency", stepPayload as EmergencyAnswers);
        break;
    }
  }

  async function handleNext() {
    setFormError(null);
    setFieldErrors({});

    if (!isConnected || !userId) {
      setFormError("Connect your Magic wallet before continuing.");
      return;
    }

    const stepPayload = buildStepPayload();
    const localValidation = validateSurveyStep(stepId, stepPayload);
    if (!localValidation.ok) {
      setFieldErrors(formatZodErrors(localValidation.errors));
      return;
    }

    setLoading(true);
    try {
      const mergedAnswers = { ...answers };
      persistCurrentStepToStore(stepPayload);

      const res = await fetch("/api/agents/bonzo-vault/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: stepId,
          answers: stepPayload,
          allAnswers: {
            ...mergedAnswers,
            ...(stepId === "asset-target"
              ? { assetTarget: stepPayload }
              : stepId === "capital-guardrails"
                ? { capitalGuardrails: stepPayload }
                : stepId === "yield-slippage"
                  ? { yieldSlippage: stepPayload }
                  : stepId === "macro-toggles"
                    ? { macroToggles: stepPayload }
                    : { emergency: stepPayload }),
          },
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFieldErrors(data.errors ?? {});
        setFormError(data.error ?? "Step validation failed");
        return;
      }

      if (currentStep < SURVEY_STEP_IDS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        const completeAnswers: SurveyAnswers = {
          ...mergedAnswers,
          emergency: stepPayload as EmergencyAnswers,
        };
        await handleProvision(completeAnswers);
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleProvision(fullAnswers: SurveyAnswers) {
    const compiled = compileSurveyAnswers(fullAnswers, userId);
    if (!compiled.ok) {
      setFieldErrors(formatZodErrors(compiled.errors));
      setFormError("Compiled strategy config is invalid.");
      return;
    }

    const schemaCheck = StrategyConfigSchema.safeParse(compiled.config);
    if (!schemaCheck.success) {
      setFieldErrors(formatZodErrors(schemaCheck.error.issues));
      setFormError("Strategy config failed final schema validation.");
      return;
    }

    setPreviewJson(JSON.stringify(compiled.config, null, 2));

    try {
      const res = await fetch("/api/agents/bonzo-vault/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(compiled.config),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(
          data.error ??
            "Provision API not available yet (Phase 5). Preview is valid."
        );
        return;
      }
      setProvisionResult(data);
    } catch {
      setFormError(
        "Provision API not available yet (Phase 5). Strategy preview is valid."
      );
    }
  }

  function handleBack() {
    setFormError(null);
    setFieldErrors({});
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }

  async function handleRunKeeper() {
    const strategyId = provisionResult?.dbId ?? provisionResult?.strategyId;
    if (!strategyId) {
      setFormError("No strategy id available — provision a strategy first.");
      return;
    }

    setKeeperLoading(true);
    setKeeperResult(null);
    setFormError(null);

    try {
      const res = await fetch("/api/agents/bonzo-vault/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Keeper run failed");
        setKeeperResult(data);
        return;
      }
      setKeeperResult(data);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Keeper run failed");
    } finally {
      setKeeperLoading(false);
    }
  }

  function renderStepFields() {
    switch (stepId) {
      case "asset-target":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Vault Type <span className="text-destructive">*</span>
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={
                  answers.assetTarget?.vaultType ?? "SINGLE_ASSET_LENDING"
                }
                onChange={(e) =>
                  setStepAnswers("assetTarget", {
                    vaultType: e.target
                      .value as AssetTargetAnswers["vaultType"],
                    whitelistVaults: selectedVaults,
                    whitelistTokens: selectedTokens,
                  })
                }
              >
                {VAULT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Whitelist Vaults <span className="text-destructive">*</span>
              </label>
              {approvedVaults.length === 0 ? (
                <p className="text-xs text-muted-foreground mb-2">
                  Testnet vault addresses pending — add a manual EVM address for
                  dev.
                </p>
              ) : (
                <div className="space-y-2 mb-3">
                  {approvedVaults.map((v) => (
                    <label
                      key={v.address}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVaults.includes(v.address)}
                        onChange={() =>
                          setSelectedVaults((prev) =>
                            toggleInList(prev, v.address)
                          )
                        }
                      />
                      <span>
                        {v.symbol} ({v.type}) — {v.address.slice(0, 10)}…
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="0x… or 0.0.x manual vault"
                  value={manualVault}
                  onChange={(e) => setManualVault(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={addManualVault}>
                  Add
                </Button>
              </div>
              {selectedVaults.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Selected: {selectedVaults.join(", ")}
                </p>
              )}
              {fieldErrors.whitelistVaults && (
                <p className="text-xs text-destructive mt-1">
                  {fieldErrors.whitelistVaults}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Whitelist Tokens <span className="text-destructive">*</span>
              </label>
              <div className="space-y-2">
                {TOKEN_PRESETS.map((t) => (
                  <label
                    key={t.symbol}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTokens.includes(t.token)}
                      onChange={() =>
                        setSelectedTokens((prev) =>
                          toggleInList(prev, t.token)
                        )
                      }
                    />
                    <span>
                      {t.symbol} — {t.token.slice(0, 10)}…
                    </span>
                  </label>
                ))}
              </div>
              {fieldErrors.whitelistTokens && (
                <p className="text-xs text-destructive mt-1">
                  {fieldErrors.whitelistTokens}
                </p>
              )}
            </div>
          </div>
        );

      case "capital-guardrails": {
        const g = answers.capitalGuardrails ?? {
          maxTotalAllocation: "1000",
          maxPerTransaction: "100",
          denominatedAsset: "USDC",
        };
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Max Total Allocation <span className="text-destructive">*</span>
                </label>
                <Input
                  value={g.maxTotalAllocation}
                  onChange={(e) =>
                    setStepAnswers("capitalGuardrails", {
                      ...g,
                      maxTotalAllocation: e.target.value,
                    })
                  }
                />
                {fieldErrors.maxTotalAllocation && (
                  <p className="text-xs text-destructive mt-1">
                    {fieldErrors.maxTotalAllocation}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Max Per Transaction <span className="text-destructive">*</span>
                </label>
                <Input
                  value={g.maxPerTransaction}
                  onChange={(e) =>
                    setStepAnswers("capitalGuardrails", {
                      ...g,
                      maxPerTransaction: e.target.value,
                    })
                  }
                />
                {fieldErrors.maxPerTransaction && (
                  <p className="text-xs text-destructive mt-1">
                    {fieldErrors.maxPerTransaction}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Denominated Asset <span className="text-destructive">*</span>
              </label>
              <Input
                value={g.denominatedAsset}
                onChange={(e) =>
                  setStepAnswers("capitalGuardrails", {
                    ...g,
                    denominatedAsset: e.target.value,
                  })
                }
              />
            </div>
            {fieldErrors["deterministicPolicies.spendLimits"] && (
              <p className="text-xs text-destructive">
                {fieldErrors["deterministicPolicies.spendLimits"]}
              </p>
            )}
          </div>
        );
      }

      case "yield-slippage": {
        const y = answers.yieldSlippage ?? {
          minNetAPY: 5,
          actionOnBreach: "TRIGGER_EMERGENCY_OVERRIDE" as const,
          maxSlippagePercent: 0.5 as const,
          harvestCadenceMinutes: 120,
        };
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Min Net APY (%) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={y.minNetAPY}
                  onChange={(e) =>
                    setStepAnswers("yieldSlippage", {
                      ...y,
                      minNetAPY: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Harvest Cadence (minutes)
                </label>
                <Input
                  type="number"
                  min={15}
                  max={1440}
                  value={y.harvestCadenceMinutes}
                  onChange={(e) =>
                    setStepAnswers("yieldSlippage", {
                      ...y,
                      harvestCadenceMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Action on Yield Breach
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={y.actionOnBreach}
                onChange={(e) =>
                  setStepAnswers("yieldSlippage", {
                    ...y,
                    actionOnBreach: e.target
                      .value as YieldSlippageAnswers["actionOnBreach"],
                  })
                }
              >
                {YIELD_BREACH_ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Max Slippage (%)
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={y.maxSlippagePercent}
                onChange={(e) =>
                  setStepAnswers("yieldSlippage", {
                    ...y,
                    maxSlippagePercent: Number(
                      e.target.value
                    ) as YieldSlippageAnswers["maxSlippagePercent"],
                  })
                }
              >
                {SLIPPAGE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}%
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      }

      case "macro-toggles": {
        const m = answers.macroToggles ?? {
          vixIndexTracked: false,
          vixMaxThreshold: 30,
          newsSentimentFilterEnabled: false,
        };
        return (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={m.vixIndexTracked}
                onChange={(e) =>
                  setStepAnswers("macroToggles", {
                    ...m,
                    vixIndexTracked: e.target.checked,
                  })
                }
              />
              Track VIX index for macro gating
            </label>
            {m.vixIndexTracked && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  VIX Max Threshold
                </label>
                <Input
                  type="number"
                  min={10}
                  max={90}
                  value={m.vixMaxThreshold}
                  onChange={(e) =>
                    setStepAnswers("macroToggles", {
                      ...m,
                      vixMaxThreshold: Number(e.target.value),
                    })
                  }
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={m.newsSentimentFilterEnabled}
                onChange={(e) =>
                  setStepAnswers("macroToggles", {
                    ...m,
                    newsSentimentFilterEnabled: e.target.checked,
                  })
                }
              />
              Enable news sentiment filter (LLM)
            </label>
          </div>
        );
      }

      case "emergency": {
        const em = answers.emergency ?? {
          mode: "PAUSE_AND_NOTIFY" as const,
          fallbackAsset: "USDC",
        };
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Emergency Mode <span className="text-destructive">*</span>
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={em.mode}
                onChange={(e) =>
                  setStepAnswers("emergency", {
                    ...em,
                    mode: e.target.value as EmergencyAnswers["mode"],
                  })
                }
              >
                {EMERGENCY_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Fallback Asset
              </label>
              <Input
                value={em.fallbackAsset}
                onChange={(e) =>
                  setStepAnswers("emergency", {
                    ...em,
                    fallbackAsset: e.target.value,
                  })
                }
              />
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/marketplace">
            <ArrowLeft className="mr-2 h-4 w-4" /> Marketplace
          </Link>
        </Button>

        <div className="mb-8">
          <Badge variant="secondary" className="mb-4">
            Beta
          </Badge>
          <h1 className="text-3xl font-bold mb-2">Bonzo Vault Strategist</h1>
          <p className="text-muted-foreground">
            Configure deterministic policies for an autonomous Bonzo vault keeper.
            The LLM proposes actions; policies dispose before any chain tx.
          </p>
        </div>

        <div className="flex items-center justify-between mb-6 p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4" />
            {isConnected && address ? (
              <span>
                Connected: <strong>{shortenAddress(address)}</strong>
              </span>
            ) : (
              <span className="text-muted-foreground">Wallet not connected</span>
            )}
          </div>
          {!isConnected && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => connect()}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Connect Magic"
              )}
            </Button>
          )}
        </div>

        <div className="flex gap-1 mb-6">
          {SURVEY_STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= currentStep ? "bg-primary" : "bg-muted"
              }`}
              title={s.title}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Vault className="h-5 w-5 text-primary" />
              Step {currentStep + 1}: {stepMeta.title}
            </CardTitle>
            <CardDescription>{stepMeta.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderStepFields()}

            <div className="pt-4 border-t flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0 || loading}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating…
                  </>
                ) : currentStep < SURVEY_STEP_IDS.length - 1 ? (
                  <>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  "Provision Strategy"
                )}
              </Button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {provisionResult && (
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Strategy Provisioned</h3>
                  {provisionResult.status && (
                    <Badge variant="secondary">{provisionResult.status}</Badge>
                  )}
                </div>
                <div className="text-sm space-y-1">
                  {provisionResult.strategyId && (
                    <p>
                      <span className="text-muted-foreground">Strategy ID:</span>{" "}
                      <strong>{provisionResult.strategyId}</strong>
                    </p>
                  )}
                  {provisionResult.vaultAddress && (
                    <p>
                      <span className="text-muted-foreground">Vault:</span>{" "}
                      {provisionResult.vaultAddress}
                    </p>
                  )}
                  {provisionResult.adapterMode && (
                    <p>
                      <span className="text-muted-foreground">Adapter:</span>{" "}
                      {provisionResult.adapterMode}
                    </p>
                  )}
                  {provisionResult.hcsTopicId && (
                    <p>
                      <span className="text-muted-foreground">Audit topic:</span>{" "}
                      <a
                        href={`${process.env.NEXT_PUBLIC_HASHSCAN_URL ?? "https://hashscan.io/testnet"}/topic/${provisionResult.hcsTopicId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {provisionResult.hcsTopicId}
                      </a>
                    </p>
                  )}
                  {provisionResult.hcsTxId && (
                    <p>
                      <span className="text-muted-foreground">HCS tx:</span>{" "}
                      <a
                        href={`${process.env.NEXT_PUBLIC_HASHSCAN_URL ?? "https://hashscan.io/testnet"}/transaction/${provisionResult.hcsTxId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        View on HashScan
                      </a>
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleRunKeeper}
                  disabled={keeperLoading}
                  className="mt-2"
                >
                  {keeperLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running keeper…
                    </>
                  ) : (
                    "Run Keeper"
                  )}
                </Button>
              </div>
            )}

            {keeperResult && (
              <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-2">
                <h3 className="font-semibold text-sm">Keeper Run Result</h3>
                <div className="text-sm space-y-1">
                  {keeperResult.status && (
                    <p>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <strong>{keeperResult.status}</strong>
                    </p>
                  )}
                  {keeperResult.decision && (
                    <p>
                      <span className="text-muted-foreground">Decision:</span>{" "}
                      <strong>{keeperResult.decision}</strong>
                    </p>
                  )}
                  {keeperResult.skipReason && (
                    <p>
                      <span className="text-muted-foreground">Skip reason:</span>{" "}
                      {keeperResult.skipReason}
                    </p>
                  )}
                  {keeperResult.error && (
                    <p className="text-destructive">{keeperResult.error}</p>
                  )}
                  {keeperResult.hashScanTopicUrl && (
                    <p>
                      <span className="text-muted-foreground">Audit topic:</span>{" "}
                      <a
                        href={keeperResult.hashScanTopicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        View on HashScan
                      </a>
                    </p>
                  )}
                  {(keeperResult.hashScanTxUrl ||
                    keeperResult.feeTxId ||
                    keeperResult.txId) && (
                    <p>
                      <span className="text-muted-foreground">Transaction:</span>{" "}
                      <a
                        href={
                          keeperResult.hashScanTxUrl ??
                          `${process.env.NEXT_PUBLIC_HASHSCAN_URL ?? "https://hashscan.io/testnet"}/transaction/${keeperResult.feeTxId ?? keeperResult.txId}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        View on HashScan
                      </a>
                    </p>
                  )}
                  {keeperResult.hcsTxId && !keeperResult.hashScanTopicUrl && (
                    <p>
                      <span className="text-muted-foreground">HCS tx:</span>{" "}
                      <a
                        href={`${process.env.NEXT_PUBLIC_HASHSCAN_URL ?? "https://hashscan.io/testnet"}/transaction/${keeperResult.hcsTxId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        View on HashScan
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {previewJson && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  StrategyConfig preview (validates against schema)
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-muted/50 overflow-x-auto max-h-64">
                  {previewJson}
                </pre>
              </details>
            )}

            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={reset}>
                Reset survey
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
