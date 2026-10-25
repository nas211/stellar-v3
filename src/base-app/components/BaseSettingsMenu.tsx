import React from "react";
import { BaseWalletIcon } from "./BaseWalletIcon";

function SettingsRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ComponentProps<typeof BaseWalletIcon>["name"];
  label: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="wallet-settings-row" onClick={onClick}>
      <BaseWalletIcon name={icon} />
      <span className="wallet-settings-label">{label}</span>
      {value && <span className="wallet-settings-value">{value}</span>}
      <span className="wallet-settings-chevron">
        <BaseWalletIcon name="chevron" />
      </span>
    </button>
  );
}

export function BaseSettingsMenu({
  connected,
  walletAddress,
  claimedHandle,
  chainLabel,
  handlesAvailable = true,
  canCopyHandle,
  onCopyHandle,
  onHandle,
  onWallet,
  onPreferences,
  onNetwork,
  onRecovery,
}: {
  connected: boolean;
  walletAddress: string;
  claimedHandle: string | null;
  chainLabel: string;
  handlesAvailable?: boolean;
  canCopyHandle: boolean;
  onCopyHandle: () => void;
  onHandle: () => void;
  onWallet: () => void;
  onPreferences: () => void;
  onNetwork: () => void;
  onRecovery?: () => void;
}) {
  const handle = connected ? claimedHandle : null;
  return (
    <div className="wallet-settings-home">
      <div className="wallet-profile-card">
        <button
          type="button"
          className="wallet-profile-details"
          aria-label={
            handlesAvailable
              ? handle
                ? "Manage handle"
                : "Claim a handle"
              : "View wallet"
          }
          onClick={handlesAvailable ? onHandle : onWallet}
        >
          <span className="wallet-avatar">
            <BaseWalletIcon name="profile" />
          </span>
          <span className="wallet-profile-description">
            <strong>
              {handle || (handlesAvailable ? "Your profile" : "Your wallet")}
            </strong>
            <small>
              {handlesAvailable
                ? handle
                  ? "Manage your handle"
                  : "Claim a .stealth handle"
                : chainLabel}
            </small>
          </span>
          <span className="wallet-settings-chevron">
            <BaseWalletIcon name="chevron" />
          </span>
        </button>
        {handle && (
          <button
            type="button"
            className="wallet-icon-button wallet-copy-handle"
            aria-label="Copy handle"
            disabled={!canCopyHandle}
            onClick={onCopyHandle}
          >
            <BaseWalletIcon name="copy" />
          </button>
        )}
      </div>
      <div
        className="wallet-settings-group"
        role="group"
        aria-label="Account settings"
      >
        <SettingsRow
          icon="wallet"
          label={connected ? "Connected wallet" : "Connect wallet"}
          value={
            connected
              ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
              : undefined
          }
          onClick={onWallet}
        />
        <SettingsRow
          icon="settings"
          label="Preferences"
          onClick={onPreferences}
        />
        {onRecovery && (
          <SettingsRow
            icon="key"
            label="Recovery & backup"
            onClick={onRecovery}
          />
        )}
      </div>
      <div
        className="wallet-settings-group"
        role="group"
        aria-label="Network settings"
      >
        <SettingsRow
          icon="network"
          label="Network"
          value={chainLabel}
          onClick={onNetwork}
        />
      </div>
    </div>
  );
}
