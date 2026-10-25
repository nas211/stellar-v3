import React from "react";
import type { BaseStatusMessage } from "../types";
import { BaseWalletIcon } from "./BaseWalletIcon";
import { useWalletNetwork } from "../../networks/WalletNetworkContext";

/** Connected wallet details with disconnect. */
export function WalletDetails({
  walletAddress,
  chainLabel,
  busy,
  onDisconnect,
}: {
  walletAddress: string;
  chainLabel: string;
  busy: boolean;
  onDisconnect: () => void;
}) {
  return (
    <>
      <p className="wallet-address">{walletAddress}</p>
      <p className="wallet-address">{chainLabel}</p>
      <button
        type="button"
        className="wallet-account-option"
        onClick={onDisconnect}
        disabled={busy}
      >
        <BaseWalletIcon name="logout" />
        <span>Disconnect</span>
      </button>
    </>
  );
}

/** Settlement network list; switching is refused while a request is open. */
export function NetworkPicker({
  chainLabel,
  busy,
  onKeep,
  onSwitched,
}: {
  chainLabel: string;
  busy: boolean;
  /** The selected network was chosen again. */
  onKeep: () => void;
  onSwitched: () => void;
}) {
  const navigation = useWalletNetwork();
  return (
    <>
      {(
        navigation?.networks ?? [
          {
            key: "current",
            label: chainLabel,
            enabled: true,
            disabledReason: undefined,
          },
        ]
      ).map((network) => {
        const selected = navigation
          ? navigation.network.key === network.key
          : true;
        return (
          <button
            key={network.key}
            type="button"
            className="wallet-account-option"
            disabled={
              !network.enabled || (!selected && (busy || navigation?.blocked))
            }
            aria-label={`${network.label}${selected ? ", selected" : ""}`}
            aria-pressed={selected}
            onClick={() => {
              if (selected) onKeep();
              else if (navigation?.selectNetwork(network.key)) onSwitched();
            }}
          >
            <BaseWalletIcon name={selected ? "check" : "network"} />
            <span>
              {network.label}
              <small>
                {selected
                  ? "Selected network"
                  : network.enabled
                    ? "Switch network"
                    : network.disabledReason}
              </small>
            </span>
          </button>
        );
      })}
      <p className="wallet-address">
        {navigation?.blocked
          ? "Finish the current wallet request before switching networks."
          : "Balances and activity are shown for the selected network."}
      </p>
    </>
  );
}

export function HideTotalSetting({
  hideTotal,
  onChange,
}: {
  hideTotal: boolean;
  onChange: (hide: boolean) => void;
}) {
  return (
    <label className="wallet-setting">
      <span>
        Hide total balance
        <small>Hide the total on your wallet home screen</small>
      </span>
      <input
        type="checkbox"
        checked={hideTotal}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

export function OperationCompletion({
  completion,
  link,
  onDone,
}: {
  completion: string;
  link: BaseStatusMessage["link"];
  onDone: () => void;
}) {
  return (
    <div className="wallet-completion">
      <span className="wallet-completion-check">
        <BaseWalletIcon name="check" />
      </span>
      <p>{completion}</p>
      {link && (
        <p>
          <a href={link.href} target="_blank" rel="noopener noreferrer">
            {link.label} ↗
          </a>
        </p>
      )}
      <button type="button" className="wallet-primary" onClick={onDone}>
        Done
      </button>
    </div>
  );
}
