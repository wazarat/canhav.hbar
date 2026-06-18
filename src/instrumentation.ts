export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { validateHbarEnv } = await import("@hbar/lib/env");
  validateHbarEnv({ throwOnMissingRequired: true });
}
