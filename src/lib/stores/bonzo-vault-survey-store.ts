import { create } from "zustand";
import {
  SURVEY_STEP_IDS,
  type SurveyAnswers,
  type SurveyStepId,
} from "@/lib/bonzo/survey-steps";

const STORAGE_KEY = "bonzo-vault-survey-v1";

type PersistedSurveyState = {
  currentStep: number;
  answers: SurveyAnswers;
};

type SurveyStore = PersistedSurveyState & {
  setCurrentStep: (step: number) => void;
  goToStep: (stepId: SurveyStepId) => void;
  setStepAnswers: <K extends keyof SurveyAnswers>(
    key: K,
    value: SurveyAnswers[K]
  ) => void;
  mergeAnswers: (partial: Partial<SurveyAnswers>) => void;
  reset: () => void;
};

const initialState: PersistedSurveyState = {
  currentStep: 0,
  answers: {},
};

function loadFromSession(): PersistedSurveyState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as PersistedSurveyState;
    if (
      typeof parsed.currentStep !== "number" ||
      parsed.currentStep < 0 ||
      parsed.currentStep >= SURVEY_STEP_IDS.length ||
      typeof parsed.answers !== "object"
    ) {
      return initialState;
    }
    return parsed;
  } catch {
    return initialState;
  }
}

function persist(state: PersistedSurveyState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage full or unavailable
  }
}

export const useBonzoVaultSurveyStore = create<SurveyStore>((set, get) => ({
  ...loadFromSession(),

  setCurrentStep: (step) => {
    const clamped = Math.max(0, Math.min(step, SURVEY_STEP_IDS.length - 1));
    const next = { ...get(), currentStep: clamped };
    persist({ currentStep: next.currentStep, answers: next.answers });
    set({ currentStep: clamped });
  },

  goToStep: (stepId) => {
    const idx = SURVEY_STEP_IDS.indexOf(stepId);
    if (idx >= 0) get().setCurrentStep(idx);
  },

  setStepAnswers: (key, value) => {
    const answers = { ...get().answers, [key]: value };
    persist({ currentStep: get().currentStep, answers });
    set({ answers });
  },

  mergeAnswers: (partial) => {
    const answers = { ...get().answers, ...partial };
    persist({ currentStep: get().currentStep, answers });
    set({ answers });
  },

  reset: () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    set(initialState);
  },
}));

/** Hydrate store from sessionStorage after client mount */
export function hydrateBonzoVaultSurveyStore() {
  const loaded = loadFromSession();
  useBonzoVaultSurveyStore.setState(loaded);
}
