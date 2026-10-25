import { formatDisplayAmount } from "../helpers/amountDisplay";
import React from "react";
import { AssetIcon } from "../../components/AssetIcon";
import { rowMeta } from "./handset/handsetAssets";
import { rowUsdValue } from "../../utils/market-prices";
export interface PrivateBalanceRow {
  id: string;
  mint: string;
  symbol: string;
  name?: string;
  iconId?: string;
  badge?: string;
  amount: string;
  isNft: boolean;
  pendingAmount?: string;
}
export function BasePrivateBalancesCard({
  connected,
  balancesSyncing,
  rows,
  tokenPrices,
  tokenMarkets,
}: {
  connected: boolean;
  balancesSyncing: boolean;
  rows: PrivateBalanceRow[];
  tokenPrices: Record<string, number>;
  tokenMarkets: Readonly<Record<string, string>>;
}) {
  if (!connected)
    return (
      <div className="wallet-empty">Your private assets will appear here.</div>
    );
  if (!rows.length)
    return (
      <div className="wallet-empty">
        {balancesSyncing
          ? "Loading private balances…"
          : "No private assets yet. Add funds to get started."}
      </div>
    );
  return (
    <div>
      {rows.map((row) => {
        const usd = rowUsdValue(row, tokenPrices);
        const meta = rowMeta(row, tokenMarkets);
        return (
          <div key={row.id} className="wallet-asset">
            <AssetIcon
              marketId={meta.marketId}
              iconId={meta.iconId}
              symbol={row.symbol}
              size={44}
            />
            <div className="wallet-asset-name">
              <strong>{meta.name}</strong>
              {row.badge && <small>{row.badge}</small>}
              <small>{row.isNft ? "NFT" : row.symbol}</small>
            </div>
            <div className="wallet-asset-value">
              {usd != null
                ? usd.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })
                : "—"}
              <small title={`${row.amount} ${row.symbol}`}>
                {formatDisplayAmount(row.amount)} {row.symbol}
              </small>
              {row.pendingAmount && (
                <small>
                  + {formatDisplayAmount(row.pendingAmount)} awaiting finality
                </small>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
