/** Oracle-based minAmountOut (never naive ratios). */
const ONE_E18 = BigInt("1000000000000000000");

export function computeMinAmountOut(
  amountIn: bigint,
  oraclePrice18: bigint,
  maxSlippagePct: number
): bigint {
  const bps = BigInt(Math.round((100 - maxSlippagePct) * 100));
  return (amountIn * oraclePrice18 * bps) / (BigInt(10_000) * ONE_E18);
}
