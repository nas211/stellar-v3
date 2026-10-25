export function validMarketPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function freshMarketPrice(
  quote: unknown,
  now = Date.now(),
): number | null {
  if (!quote || typeof quote !== "object") return null;
  const { usd, last_updated_at } = quote as Record<string, unknown>;
  return validMarketPrice(usd) &&
    typeof last_updated_at === "number" &&
    Number.isSafeInteger(last_updated_at) &&
    last_updated_at <= now / 1000 + 60 &&
    now / 1000 - last_updated_at < 15 * 60
    ? usd
    : null;
}

/** A fresh quote's 24-hour change in percent, or null when absent or stale. */
export function freshMarketChange(
  quote: unknown,
  now = Date.now(),
): number | null {
  if (freshMarketPrice(quote, now) === null) return null;
  const change = (quote as Record<string, unknown>).usd_24h_change;
  return typeof change === "number" && Number.isFinite(change) && change > -100
    ? change
    : null;
}

/** A per-asset market figure (price, change or quote id) keyed by mint. */
export function marketFigure<T>(
  figures: Readonly<Record<string, T>>,
  mint: string,
): T | undefined {
  // Solana mint addresses are case-sensitive. Normalize only EVM addresses.
  return (
    figures[mint] ??
    (/^0x[0-9a-f]{40}$/i.test(mint) ? figures[mint.toLowerCase()] : undefined)
  );
}

type ValuationRow = { mint: string; amount: string; isNft: boolean };
export function rowUsdValue(
  row: ValuationRow,
  prices: Record<string, number>,
): number | null {
  const amount = Number(row.amount);
  const price = marketFigure(prices, row.mint);
  if (
    row.isNft ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    !validMarketPrice(price)
  )
    return null;
  const value = amount * price;
  return Number.isFinite(value) ? value : null;
}

export function balanceUsdValue(
  rows: ValuationRow[],
  prices: Record<string, number>,
) {
  let total = 0;
  let priced = 0;
  let unpriced = 0;
  for (const row of rows) {
    if (Number(row.amount) === 0) continue;
    const value = rowUsdValue(row, prices);
    if (value === null) unpriced++;
    else {
      total += value;
      priced++;
    }
  }
  return {
    total:
      Number.isFinite(total) && (priced > 0 || unpriced === 0) ? total : null,
    unpriced,
  };
}
/** A zero-address native token has a different price identity on each chain. */
export function evmMarketPriceIds(
  chainId: number,
): Readonly<Record<string, string>> {
  const native = "0x0000000000000000000000000000000000000000";
  if (chainId === 6281971) return { [native]: "dogecoin" };
  if (chainId === 8453 || chainId === 84532)
    return {
      [native]: "ethereum",
      "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "usd-coin",
      "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2": "tether",
      "0x036cbd53842c5426634e7929541ec2318f3dcf7e": "usd-coin",
    };
  return {};
}
