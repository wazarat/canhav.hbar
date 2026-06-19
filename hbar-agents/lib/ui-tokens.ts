/** Shared HBAR Skills enterprise UI tokens (M2+). */
export const hbarSkillsUi = {
  page: "min-h-screen bg-zinc-950 text-zinc-100",
  surface: "bg-zinc-950/80 border-zinc-800/80",
  muted: "bg-zinc-800/60",
  text: {
    primary: "text-zinc-100",
    secondary: "text-zinc-400",
    muted: "text-zinc-500",
  },
  border: "border-zinc-700",
  input:
    "rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/30",
  accentButton:
    "bg-gradient-to-r from-indigo-700 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-500 border-0",
  link: "text-indigo-400 hover:text-indigo-300 hover:underline",
  status: {
    ok: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    blocked: "bg-red-500/10 text-red-400 border-red-500/30",
    counterparty: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    approval: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    rejected: "bg-zinc-500/10 text-zinc-400 border-zinc-600/30",
  },
} as const;

export const POLICY_BADGE: Record<
  string,
  { label: string; className: string; icon: string }
> = {
  "within policy": {
    label: "within policy",
    className: hbarSkillsUi.status.ok,
    icon: "✅",
  },
  "blocked by SpendLimit": {
    label: "blocked by SpendLimit",
    className: hbarSkillsUi.status.blocked,
    icon: "⛔",
  },
  "counterparty not allowlisted": {
    label: "counterparty not allowlisted",
    className: hbarSkillsUi.status.counterparty,
    icon: "🚫",
  },
  "needs your approval": {
    label: "needs your approval",
    className: hbarSkillsUi.status.approval,
    icon: "✋",
  },
  rejected: {
    label: "rejected",
    className: hbarSkillsUi.status.rejected,
    icon: "✕",
  },
  "blocked: slippage exceeded": {
    label: "blocked: slippage exceeded",
    className: hbarSkillsUi.status.blocked,
    icon: "⛔",
  },
};
