import React, { useEffect, useRef, useState } from "react";
import type { BaseStatusMessage, BaseTabType } from "../types";
import { HandsetWalletShell } from "./handset/HandsetWalletShell";
import type { WalletShellProps, WalletShellView } from "./walletShellTypes";
import "./base-wallet.css";

type View = WalletShellView;
type Props = WalletShellProps;

/**
 * Wallet shell state (open operation, completion, notices) shared by every
 * network's wallet. It renders the StealthOS handset design at every screen
 * size: full width on phones, a centered column on wider screens.
 */
export function BaseWalletShell(props: Props) {
  const [view, setView] = useState<View>(
    props.initialOperation ? "operation" : null,
  );
  const [completion, setCompletion] = useState("");
  const [completionLink, setCompletionLink] =
    useState<BaseStatusMessage["link"]>(undefined);
  const [sendComplete, setSendComplete] = useState(false);
  const [hideTotal, setHideTotal] = useState(() => {
    try {
      return localStorage.getItem("stealthos:hide-total:v1") === "true";
    } catch {
      return false;
    }
  });
  const updateHideTotal = (next: boolean) => {
    setHideTotal(next);
    try {
      localStorage.setItem("stealthos:hide-total:v1", String(next));
    } catch {
      /* Optional device preference. */
    }
  };
  const wasBusy = useRef(false);
  const operationSuccess = useRef<string | null>(null);
  const previousStatus = useRef(props.status);
  const operationSuccessLink = useRef<BaseStatusMessage["link"]>(undefined);
  useEffect(() => {
    props.onOperationVisibilityChange?.(view === "operation");
    return () => props.onOperationVisibilityChange?.(false);
  }, [view, props.onOperationVisibilityChange]);
  const openOperation = (tab: BaseTabType) => {
    if (
      (props.previousPoolMode && tab !== "send") ||
      props.disabledActions?.[tab]
    )
      return;
    if (!props.connected) {
      props.onWallet();
      return;
    }
    if (!props.busy) props.onSelectTab(tab);
    setCompletion("");
    setSendComplete(false);
    setView("operation");
  };
  useEffect(() => {
    setView(props.initialOperation ? "operation" : null);
    setCompletion("");
    setSendComplete(false);
    operationSuccess.current = null;
    wasBusy.current = false;
  }, [props.walletAddress, props.chainLabel]);
  useEffect(() => {
    if (props.busy && !wasBusy.current) {
      operationSuccess.current = null;
      setSendComplete(false);
    }
    // The success toast can expire while encrypted history/recovery is saved.
    // Keep this operation's result independently of the toast's lifetime.
    if (props.busy || wasBusy.current) {
      if (props.status?.type === "error") {
        operationSuccess.current = null;
        setSendComplete(false);
        if (props.activeTab === "send")
          setView((current) =>
            current === "complete" ? "operation" : current,
          );
      } else if (
        props.status?.type === "success" &&
        props.status !== previousStatus.current
      ) {
        operationSuccess.current = props.status.message;
        operationSuccessLink.current = props.status.link;
        if (props.activeTab === "send" && props.status.transactionComplete) {
          setCompletion(props.status.message);
          setCompletionLink(props.status.link);
          setSendComplete(true);
          setView((current) =>
            current === "operation" ? "complete" : current,
          );
        }
      }
    }
    if (wasBusy.current && !props.busy && operationSuccess.current) {
      setCompletion(operationSuccess.current);
      setCompletionLink(operationSuccessLink.current);
      setView((current) =>
        current === "operation"
          ? props.activeTab === "send"
            ? null
            : "complete"
          : current,
      );
      operationSuccess.current = null;
      operationSuccessLink.current = undefined;
    }
    previousStatus.current = props.status;
    wasBusy.current = props.busy;
  }, [props.busy, props.status, props.activeTab]);
  useEffect(() => {
    if (view !== "complete" || !sendComplete) return;
    const timer = setTimeout(() => setView(null), 2000);
    return () => clearTimeout(timer);
  }, [view, sendComplete]);
  useEffect(() => {
    if (props.openPreparedReview && props.reviewing) setView("operation");
  }, [props.openPreparedReview, props.reviewing]);
  const label =
    props.tabs.find((tab) => tab.id === props.activeTab)?.label || "Wallet";
  const title =
    view === "account"
      ? "Settings"
      : view === "wallet"
        ? "Connected wallet"
        : view === "network"
          ? "Network"
          : view === "preferences"
            ? "Preferences"
            : view === "handle"
              ? props.claimedHandle
                ? "Your handle"
                : "Claim a handle"
              : view === "recovery"
                ? "Recovery & backup"
                : view === "complete"
                  ? "Transaction complete"
                  : `${props.reviewing ? "Review " : ""}${label}`;
  // Login recovery stays quiet; the header refresh icon still shows its work.
  // Explicit refreshes own their progress/success/error status and must not be
  // confused with a transaction toast or a claim that an empty wallet has funds.
  const visibleStatus = props.status;
  const notice =
    visibleStatus && !(props.busy && visibleStatus.type === "info") ? (
      <div
        className={`wallet-notice wallet-notice-${visibleStatus.type}`}
        role={visibleStatus.type === "error" ? "alert" : "status"}
      >
        {visibleStatus.message}
        {visibleStatus.link && (
          <>
            {" "}
            <a
              href={visibleStatus.link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {visibleStatus.link.label} ↗
            </a>
          </>
        )}
      </div>
    ) : null;
  return (
    <HandsetWalletShell
      {...props}
      shell={{
        view,
        setView,
        openOperation,
        title,
        label,
        notice,
        hideTotal,
        setHideTotal: updateHideTotal,
        completion,
        completionLink,
        sendComplete,
      }}
    />
  );
}
