import { NextRequest, NextResponse } from "next/server";
import {
  SURVEY_STEP_IDS,
  compileSurveyAnswers,
  getNextStepId,
  isSurveyComplete,
  validateSurveyStep,
  formatZodErrors,
  type SurveyAnswers,
  type SurveyStepId,
} from "@/lib/bonzo/survey-steps";

type SurveyRequestBody = {
  step: SurveyStepId;
  answers: unknown;
  allAnswers?: SurveyAnswers;
  userId?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SurveyRequestBody;
    const { step, answers, allAnswers, userId } = body;

    if (!step || !SURVEY_STEP_IDS.includes(step)) {
      return NextResponse.json(
        { error: "Invalid step id", validSteps: SURVEY_STEP_IDS },
        { status: 400 }
      );
    }

    const validation = validateSurveyStep(step, answers);
    if (!validation.ok) {
      return NextResponse.json(
        {
          ok: false,
          errors: formatZodErrors(validation.errors),
          issues: validation.errors,
        },
        { status: 400 }
      );
    }

    const nextStep = getNextStepId(step);
    const mergedAnswers: SurveyAnswers = {
      ...(allAnswers ?? {}),
      ...(step === "asset-target" ? { assetTarget: validation.data as SurveyAnswers["assetTarget"] } : {}),
      ...(step === "capital-guardrails"
        ? { capitalGuardrails: validation.data as SurveyAnswers["capitalGuardrails"] }
        : {}),
      ...(step === "yield-slippage"
        ? { yieldSlippage: validation.data as SurveyAnswers["yieldSlippage"] }
        : {}),
      ...(step === "macro-toggles"
        ? { macroToggles: validation.data as SurveyAnswers["macroToggles"] }
        : {}),
      ...(step === "emergency"
        ? { emergency: validation.data as SurveyAnswers["emergency"] }
        : {}),
    };

    let compiledPreview = null;
    if (userId && isSurveyComplete(mergedAnswers)) {
      const compiled = compileSurveyAnswers(mergedAnswers, userId);
      if (compiled.ok) {
        compiledPreview = compiled.config;
      }
    }

    return NextResponse.json({
      ok: true,
      step,
      nextStep,
      compiledPreview,
      isComplete: isSurveyComplete(mergedAnswers),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Survey validation failed" },
      { status: 500 }
    );
  }
}
