/** Parse fixed-precision decimal string to base units (default 8 dp for HBAR). */
export function decimalToBaseUnits(decimal: string, decimals = 8): bigint {
  const [whole = "0", frac = ""] = decimal.split(".");
  const padded = frac.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + padded);
}
