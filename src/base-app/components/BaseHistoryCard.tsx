import { formatDisplayAmount } from "../helpers/amountDisplay";
import React from "react";
import type { BaseHistoryEntry } from "../types";
const labels = {
  deposit: "Deposited",
  transfer: "Sent privately",
  withdraw: "Withdrawn",
  receive: "Received",
  swap: "Swapped",
  fee: "Fee received",
  bridge: "Bridged",
};
export function BaseHistoryCard({
  historyLoading,
  historyError,
  historyEntries,
  onRefresh,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  getExplorerTxUrl,
  assetLabel = (symbol) => symbol,
}: {
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void | Promise<void>;
  historyLoading: boolean;
  historyError: string | null;
  historyEntries: BaseHistoryEntry[];
  onRefresh: () => void | Promise<void>;
  getExplorerTxUrl: (txHash: string) => string;
  assetLabel?: (symbol: string) => string;
}) {
  return (
    <section aria-label="Transaction history">
      <div className="wallet-activity-toolbar">
        <button
          type="button"
          className="wallet-text-button"
          onClick={() => void onRefresh()}
          disabled={historyLoading || loadingMore}
        >
          {historyLoading ? "Refreshing…" : "Refresh activity"}
        </button>
      </div>
      {historyError && (
        <div className="wallet-notice wallet-notice-error" role="alert">
          {historyError}
        </div>
      )}
      {!historyEntries.length ? (
        <div className="wallet-empty">
          {historyError
            ? "History could not be loaded."
            : historyLoading
              ? "Loading activity…"
              : "No transactions yet."}
        </div>
      ) : (
        historyEntries
          .slice()
          .sort((a, b) => b.timestamp - a.timestamp)
          .map((entry) => (
            <article
              className="wallet-activity-entry"
              key={
                entry.eventId ||
                `${entry.txHash || entry.id}|${entry.type}|${entry.amount}|${entry.symbol}`
              }
            >
              <div className="wallet-activity-heading">
                <span title={`${entry.amount} ${assetLabel(entry.symbol)}`}>
                  {entry.type === "fee"
                    ? entry.feeRole === "relayer"
                      ? "Gas reimbursement received"
                      : entry.feeRole === "partner"
                        ? "Partner fee received"
                        : entry.feeRole === "protocol"
                          ? "Protocol fee received"
                          : "Fee received"
                    : labels[entry.type]}{" "}
                  {formatDisplayAmount(entry.amount)} {assetLabel(entry.symbol)}
                </span>
                {entry.timestamp > 0 && (
                  <time dateTime={new Date(entry.timestamp).toISOString()}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </time>
                )}
              </div>
              {entry.memo && <p>{entry.memo}</p>}
              {entry.txHash && (
                <a
                  href={getExplorerTxUrl(entry.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on explorer ↗
                </a>
              )}
            </article>
          ))
      )}
      {hasMore && (
        <button
          type="button"
          className="wallet-text-button"
          disabled={historyLoading || loadingMore}
          onClick={() => void onLoadMore?.()}
        >
          {loadingMore ? "Loading activity…" : "Load more"}
        </button>
      )}
    </section>
  );
}
