export type BaseTabType =
  | "shield"
  | "receive"
  | "send"
  | "swap"
  | "crosschain"
  | "perps"
  | "history"
  | "withdraw";

export type BaseStatusMessage = {
  type: "success" | "error" | "info";
  message: string;
  autoDismissMs?: number;
  /** Set only after the requested transaction has confirmed successfully. */
  transactionComplete?: boolean;
  /** Where to follow the result, for example a bridge transfer's tracker. */
  link?: { href: string; label: string };
};

export type BaseLogType = "info" | "success" | "error" | "warning";

export interface BaseLogEntry {
  id: number;
  message: string;
  type: BaseLogType;
  timestamp: Date;
  txHash?: string;
}

export interface BaseHistoryEntry {
  id: number;
  type:
    | "deposit"
    | "transfer"
    | "withdraw"
    | "receive"
    | "swap"
    | "fee"
    | "bridge";
  eventId?: string;
  feeRole?: "protocol" | "partner" | "relayer";
  amount: string;
  symbol: string;
  memo?: string;
  txHash?: string;
  timestamp: number;
}
