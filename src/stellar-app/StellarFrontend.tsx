import React, { useState } from "react";
import { BaseWalletShell } from "../base-app/components/BaseWalletShell";
import { BaseReceiveTab } from "../base-app/components/BaseReceiveTab";
import { BaseTransactionReview } from "../base-app/components/BaseTransactionReview";
import { BaseHistoryCard } from "../base-app/components/BaseHistoryCard";
import { WalletAmountInput } from "../base-app/components/WalletAmountInput";
import { WalletFeeSummary } from "../base-app/components/WalletFeeSummary";
import type { BaseStatusMessage, BaseTabType } from "../base-app/types";
import type { TokenInfo } from "../config";

const TABS: { id: BaseTabType; label: string }[] = [
  { id: "shield", label: "Add" },
  { id: "swap", label: "Swap" },
  { id: "send", label: "Send" },
  { id: "receive", label: "Receive" },
  { id: "withdraw", label: "Withdraw" },
];
const XLM: TokenInfo = { address: "xlm-display", symbol: "XLM", name: "Stellar Lumens", decimals: 7, isNative: true };

/** Presentation controller: local UI state and form previews only. */
export default function StellarFrontend() {
  const [opened, setOpened] = useState(false);
  const [activeTab, setActiveTab] = useState<BaseTabType>("shield");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [address, setAddress] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [status, setStatus] = useState<BaseStatusMessage | null>(null);
  const note = "Interface preview. No payment is submitted.";
  const info = () => setStatus({ type: "info", message: note });
  const reset = () => { setOpened(!opened); setReviewing(false); setStatus(null); };
  const select = (tab: BaseTabType) => { setActiveTab(tab); setReviewing(false); setStatus(null); };
  const copyAddress = async () => {
    if (!address.trim()) return;
    try { await navigator.clipboard.writeText(address.trim()); setStatus({ type: "info", message: "Preview address copied." }); }
    catch { setStatus({ type: "error", message: "Copy is unavailable in this browser. Select the address to copy it." }); }
  };
  const canReview = /^(?:0|[1-9]\d*)(?:\.\d{1,7})?$/.test(amount) && Number(amount) > 0 && (activeTab !== "send" || recipient.trim().length > 0);
  const kind = activeTab === "shield" ? "deposit" : activeTab === "withdraw" ? "withdrawal" : "private";
  const label = activeTab === "shield" ? "Add XLM" : activeTab === "withdraw" ? "Withdraw XLM" : "Send privately";

  let panel: React.ReactNode;
  if (activeTab === "swap") {
    panel = <div className="wallet-empty">Private swaps are unavailable on Stellar.</div>;
  } else if (activeTab === "receive") {
    panel = <>
      <label className="preview-label" htmlFor="receive-preview">Receiving address preview</label>
      <input id="receive-preview" className="preview-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter a public address to preview its display" autoComplete="off" />
      <p className="preview-note">Enter public receiving information only. This field previews address display and QR formatting.</p>
      <BaseReceiveTab canReceivePrivate={!!address.trim()} privateAddress={address.trim()} compactAddress claimedHandle={null} paymentLinkToken={XLM} setPaymentLinkToken={() => {}} paymentLinkAmountInput="" setPaymentLinkAmountInput={() => {}} copyPaymentLink={info} copyPrivateAddress={() => void copyAddress()} copyHandle={() => void copyAddress()} tokenOptions={[XLM]} paymentLinksAvailable={false} unavailableMessage="Enter an address above to preview Receive." />
    </>;
  } else if (reviewing) {
    panel = <>
      <BaseTransactionReview kind={kind} amount={amount} symbol="XLM" recipient={activeTab === "send" ? recipient : activeTab === "shield" ? "Private balance" : "Connected Stellar account"} network="Stellar Testnet" fee="—" feeLabel="Network fee" feeSummary={<WalletFeeSummary rows={[{ label: "Network fee", value: "Requires a live quote" }, { label: "Protocol fee", value: "0.01 XLM per private settlement" }]} />} delivery={note} onConfirm={info} disabled />
      <p className="preview-note" role="status">{note}</p>
    </>;
  } else {
    panel = <div className="preview-stack">
      <h3>{label}</h3>
      {activeTab === "send" && <label className="preview-label">Recipient<input aria-label="Recipient address" className="preview-input" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Stellar G-address or private receiving address" autoComplete="off" /></label>}
      {activeTab === "withdraw" && <p className="preview-note">Withdraw to your connected Stellar account. The destination and withdrawn amount are public.</p>}
      <label className="preview-label">Amount<WalletAmountInput aria-label="Amount in XLM" value={amount} onChange={e => setAmount(e.target.value)} onMax={info} maxDisabled placeholder="0.00 XLM" /></label>
      <WalletFeeSummary rows={[{ label: "Asset", value: "XLM" }, { label: "Network", value: "Stellar Testnet" }]} />
      <button type="button" className="wallet-primary" disabled={!canReview} onClick={() => setReviewing(true)}>Review {label}</button>
      <p className="preview-note">{note}</p>
    </div>;
  }

  return <>
    <p className="preview-banner"><strong>StealthOS · Stellar interface preview</strong><br />Local interface exploration. No wallet connection, balance query or transaction submission.</p>
    <BaseWalletShell connected={opened} connectLabel="Explore Stellar interface" walletAddress="Stellar interface preview" claimedHandle={null} chainLabel="Stellar Testnet" handlesAvailable={false} busy={false} status={status} activeTab={activeTab} tabs={TABS} onSelectTab={select} onWallet={reset} onCopyHandle={info} canCopyHandle={false} balanceUsd={null} nativeBalance="—" balanceCaption="Interface preview" balancesReady={false} balanceUnavailable privateWalletStatus={{ state: "locked", label: "Interface preview", description: "Private assets appear here in a connected wallet." }} refreshing={false} canRefresh={false} onRefresh={info} authNotice={<p className="preview-note">{note}</p>} assets={<div className="wallet-empty">Private assets appear here in a connected wallet.</div>} history={<BaseHistoryCard historyLoading={false} historyError={null} historyEntries={[]} onRefresh={info} getExplorerTxUrl={() => "#"} />} handle={<p className="preview-note">Receiving identities are managed through the connected wallet.</p>} recovery={<p className="preview-note">Encrypted backup and recovery controls appear here in a connected wallet. Never enter recovery information into an interface preview.</p>} reviewing={reviewing} onBackFromReview={() => setReviewing(false)}>{panel}</BaseWalletShell>
    <footer className="preview-brand">Powered by <strong>Vanta</strong> · Proprietary technology developed and owned by StealthOS.</footer>
  </>;
}
