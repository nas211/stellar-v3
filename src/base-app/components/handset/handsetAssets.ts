import { marketFigure, rowUsdValue } from "../../../utils/market-prices";
import type { PrivateBalanceRow } from "../BasePrivateBalancesCard";
import type { WalletPortfolio } from "../walletShellTypes";

export type AssetMeta = {
  symbol: string;
  name: string;
  glyph: string;
  background: string;
  color: string;
  marketId?: string;
  iconId?: string;
};

/** Display metadata for every coin the price service quotes. */
const BY_MARKET_ID: Record<string, AssetMeta> = {
  zcash: {
    symbol: "zenZEC",
    name: "Wrapped Zcash",
    glyph: "Z",
    background: "#241c05",
    color: "#f4b728",
  },
  ethereum: {
    symbol: "ETH",
    name: "Ethereum",
    glyph: "Ξ",
    background: "#141833",
    color: "#b9c4ff",
  },
  "usd-coin": {
    symbol: "USDC",
    name: "USD Coin",
    glyph: "$",
    background: "#0d1d38",
    color: "#9cc2ff",
  },
  tether: {
    symbol: "USDT",
    name: "Tether",
    glyph: "₮",
    background: "#0b2a22",
    color: "#7fe8b5",
  },
  solana: {
    symbol: "SOL",
    name: "Solana",
    glyph: "◎",
    background: "#0a0e1b",
    color: "#c9a7ff",
  },
  dogecoin: {
    symbol: "DOGE",
    name: "Dogecoin",
    glyph: "Ð",
    background: "#241c05",
    color: "#f4c430",
  },
};

/** A priced asset this network supports, for the Markets list. */
export type MarketEntry = AssetMeta & {
  key: string;
  id: string;
  price: number | null;
  change: number | null;
};

export function marketEntries(portfolio: WalletPortfolio): MarketEntry[] {
  const seen = new Set<string>();
  const entries: MarketEntry[] = [];
  for (const [key, id] of Object.entries(portfolio.markets)) {
    const meta = BY_MARKET_ID[id];
    if (!meta || seen.has(id)) continue;
    seen.add(id);
    entries.push({
      ...meta,
      marketId: id,
      key,
      id,
      price: marketFigure(portfolio.prices, key) ?? null,
      change: marketFigure(portfolio.changes, key) ?? null,
    });
  }
  return entries;
}

/** The CoinGecko id quoting a balance row, when this network prices it. */
export function rowMarketId(
  row: PrivateBalanceRow,
  markets: WalletPortfolio["markets"],
): string | undefined {
  return marketFigure(markets, row.mint);
}

export function rowMeta(
  row: PrivateBalanceRow,
  markets: WalletPortfolio["markets"],
): AssetMeta {
  const id = rowMarketId(row, markets);
  const meta = id ? BY_MARKET_ID[id] : undefined;
  if (meta && !row.isNft) return { ...meta, symbol: row.symbol, marketId: id };
  return {
    symbol: row.symbol,
    name: row.name ?? row.symbol,
    iconId: row.isNft ? undefined : row.iconId,
    glyph: row.symbol.slice(0, 1).toUpperCase(),
    background: "#101528",
    color: "#cfd9f5",
  };
}

/**
 * The portfolio's 24-hour change, weighting each holding by its value. Unknown
 * when any priced holding lacks a change, rather than a partial figure.
 */
export function portfolioChange(portfolio: WalletPortfolio): number | null {
  let now = 0;
  let before = 0;
  for (const row of portfolio.rows) {
    const value = rowUsdValue(row, portfolio.prices);
    if (value === null || value === 0) continue;
    const change = marketFigure(portfolio.changes, row.mint);
    if (change === undefined) return null;
    now += value;
    before += value / (1 + change / 100);
  }
  return before > 0 ? (now / before - 1) * 100 : null;
}

export function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value !== 0 && Math.abs(value) < 1 ? 4 : 2,
  });
}

export function formatChange(change: number): string {
  return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
}
