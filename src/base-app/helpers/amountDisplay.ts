/** Display formatting only; preserves the input string's decimal precision. */
export function formatDisplayAmount(amount: string, round: "down" | "up" = "down"): string {
  const match = /^(-?)(\d+)\.(\d+)$/.exec(amount);
  if (!match || match[3].length <= 6) return amount;
  const negative = match[1] === "-";
  const digits = match[3];
  let scaled = BigInt(match[2] + digits.slice(0, 6));
  if ((round === "up") !== negative && /[1-9]/.test(digits.slice(6))) scaled += 1n;
  if (scaled === 0n && /[1-9]/.test(match[2] + digits)) return negative ? ">-0.000001" : "<0.000001";
  const value = scaled.toString().padStart(7, "0");
  const fraction = value.slice(-6).replace(/0+$/, "");
  return `${negative ? "-" : ""}${value.slice(0, -6)}${fraction ? "." + fraction : ".0"}`;
}
