import type React from "react";
import type { BaseStatusMessage, BaseTabType } from "../types";
import type { PrivateBalanceRow } from "./BasePrivateBalancesCard";

export type WalletShellView =
  | "operation"
  | "account"
  | "wallet"
  | "network"
  | "preferences"
  | "handle"
  | "recovery"
  | "complete"
  | null;

/** Structured holdings for the phone layout's asset list and Markets. */
export interface WalletPortfolio {
  rows: PrivateBalanceRow[];
  /** USD prices and 24-hour changes in percent, both keyed by row mint. */
  prices: Record<string, number>;
  changes: Record<string, number>;
  /** This network's priced assets: price key (mint) to CoinGecko id. */
  markets: Readonly<Record<string, string>>;
  syncing: boolean;
}

export interface WalletShellProps {
  connected: boolean;
  connectLabel?: string;
  walletAddress: string;
  claimedHandle: string | null;
  chainLabel: string;
  previousPoolMode?: boolean;
  handlesAvailable?: boolean;
  initialOperation?: boolean;
  disabledActions?: Partial<Record<BaseTabType, string>>;
  busy: boolean;
  status: BaseStatusMessage | null;
  activeTab: BaseTabType;
  tabs: { id: BaseTabType; label: string }[];
  onSelectTab: (tab: BaseTabType) => void;
  onOperationVisibilityChange?: (open: boolean) => void;
  onWallet: () => void;
  onCopyHandle: () => void;
  canCopyHandle: boolean;
  balanceUsd: number | null;
  priceCaption?: string;
  balanceCaption: string;
  /** Native total when a reliable fiat quote is unavailable. */
  nativeBalance?: string;
  balancesReady: boolean;
  balanceUnavailable?: boolean;
  /** Chain-owned private-wallet lifecycle, independent of the public wallet connection. */
  privateWalletStatus?: {
    state: "preparing" | "locked" | "reconciling" | "ready" | "failed";
    label: string;
    description: string;
  };
  refreshing: boolean;
  canRefresh: boolean;
  onRefresh: () => void;
  authNotice: React.ReactNode;
  assets: React.ReactNode;
  history: React.ReactNode;
  handle: React.ReactNode;
  recovery: React.ReactNode;
  children: React.ReactNode;
  reviewing: boolean;
  /** Open the ordinary transaction screen for reviews prepared from History/Settings. */
  openPreparedReview?: boolean;
  onBackFromReview: () => void;
  portfolio?: WalletPortfolio;
}

/** View state shared by the desktop and phone layouts of the wallet shell. */
export interface WalletShellState {
  view: WalletShellView;
  setView: (view: WalletShellView) => void;
  openOperation: (tab: BaseTabType) => void;
  /** Title of the open view, e.g. "Send" or "Review Send". */
  title: string;
  /** Label of the active operation, e.g. "Send". */
  label: string;
  notice: React.ReactNode;
  hideTotal: boolean;
  setHideTotal: (hide: boolean) => void;
  completion: string;
  completionLink: BaseStatusMessage["link"];
  sendComplete: boolean;
}
