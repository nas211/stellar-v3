import { formatDisplayAmount } from "../helpers/amountDisplay";
import React from "react";
import { BaseWalletIcon } from "./BaseWalletIcon";

export function BaseTransactionReview({
  kind,
  amount,
  symbol,
  recipient,
  network,
  fee,
  feeLabel,
  receiveAmount,
  feeSummary,
  delivery,
  onConfirm,
  disabled,
  feePending,
  exactAmountDisplay = false,
}: {
  exactAmountDisplay?: boolean;
  kind: "deposit" | "private" | "withdrawal" | "batch";
  amount: string;
  symbol: string;
  recipient: string;
  network: string;
  fee: string;
  feeLabel: string;
  receiveAmount?: string;
  feeSummary?: React.ReactNode;
  delivery?: string;
  onConfirm: () => void;
  disabled: boolean;
  /** Why the fee is not known yet: shown in its place, and confirming waits
   * for it (live relayer quotes). */
  feePending?: string | null;
}) {
  const label =
    kind === "deposit" ? "Add" : kind === "withdrawal" ? "Withdraw" : "Send";
  return (
    <section className="wallet-review" aria-label="Review transaction">
      <div
        className={`wallet-review-kind${kind === "withdrawal" ? " wallet-review-public" : ""}`}
      >
        <BaseWalletIcon name={kind === "withdrawal" ? "send" : "lock"} />
        {kind === "deposit"
          ? "Add funds"
          : kind === "withdrawal"
            ? "Public withdrawal"
            : kind === "batch"
              ? "Batch payment"
              : "Private transfer"}
      </div>
      <div className="wallet-review-amount" title={`${amount} ${symbol}`}>
        {exactAmountDisplay ? amount : formatDisplayAmount(amount)} {symbol}
      </div>
      <dl>
        <div>
          <dt>From</dt>
          <dd>{kind === "deposit" ? "Connected wallet" : "Private balance"}</dd>
        </div>
        <div>
          <dt>To</dt>
          <dd className="wallet-review-recipient">{recipient}</dd>
        </div>
        <div>
          <dt>Network</dt>
          <dd>{network}</dd>
        </div>
        {!feeSummary && (
          <div>
            <dt>{feeLabel}</dt>
            <dd>
              {feePending || (
                <>
                  {formatDisplayAmount(fee, "up")} {symbol}
                </>
              )}
            </dd>
          </div>
        )}
      </dl>
      {feeSummary}
      {receiveAmount !== undefined &&
        !feePending && (
          <dl>
            <div>
              <dt>Recipient receives</dt>
              <dd>
                {formatDisplayAmount(receiveAmount)} {symbol}
              </dd>
            </div>
          </dl>
        )}
      <p className="wallet-review-context">
        {kind === "deposit"
          ? "You’ll approve the deposit in your connected wallet. Network fees are shown by your wallet."
          : kind === "withdrawal"
            ? `The destination and withdrawn amount will be public. ${delivery || ""}`
            : kind === "batch"
              ? "Review each recipient before continuing."
              : `Your recipient receives a private payment. ${delivery || ""}`}
      </p>
      <button
        type="button"
        className="wallet-primary"
        disabled={disabled || !!feePending}
        onClick={onConfirm}
      >
        {label} {exactAmountDisplay ? amount : formatDisplayAmount(amount)}{" "}
        {symbol}
      </button>
    </section>
  );
}
