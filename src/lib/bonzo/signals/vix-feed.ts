const VIX_TIMEOUT_MS = 5000;

/** Yahoo Finance chart API — public, no key required. */
const VIX_CHART_URL =
  "https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d";

/**
 * Fetch current VIX index with timeout. Returns undefined on failure (macro gate skips).
 */
export async function fetchVixIndex(): Promise<number | undefined> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VIX_TIMEOUT_MS);

  try {
    const response = await fetch(VIX_CHART_URL, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "CanHav-BonzoVault/1.0",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.warn(`[bonzo-vault] VIX fetch HTTP ${response.status}`);
      return undefined;
    }

    const data = (await response.json()) as {
      chart?: {
        result?: {
          meta?: { regularMarketPrice?: number };
          indicators?: { quote?: { close?: (number | null)[] }[] };
        }[];
      };
    };

    const result = data.chart?.result?.[0];
    const metaPrice = result?.meta?.regularMarketPrice;
    if (typeof metaPrice === "number" && Number.isFinite(metaPrice)) {
      return metaPrice;
    }

    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    for (let i = closes.length - 1; i >= 0; i--) {
      const v = closes[i];
      if (typeof v === "number" && Number.isFinite(v)) return v;
    }

    return undefined;
  } catch (error) {
    console.warn("[bonzo-vault] VIX fetch failed (graceful skip):", error);
    return undefined;
  } finally {
    clearTimeout(timeoutId);
  }
}
