import React, { useMemo, useState } from "react";
import qrcode from "qrcode-generator";

export interface DirectoryState {
  registered: boolean;
  current: boolean;
}
interface Props {
  account: string;
  privateAddress: string;
  unlocked: boolean;
  unavailableMessage: string;
  directory: DirectoryState | null | "checking" | "error";
  busy: boolean;
  onActivate: () => void;
  onCopyAccount: () => void;
  onCopyPrivateAddress: () => void;
}
const short = (value: string, head: number, tail = 4) =>
  value.length > head + tail + 1 ? `${value.slice(0, head)}…${value.slice(-tail)}` : value;
function qr(value: string) {
  const code = qrcode(0, "M");
  code.addData(value);
  code.make();
  return (
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(code.createSvgTag({ cellSize: 4, margin: 4, scalable: true }))
  );
}

export function StellarReceiveTab(props: Props) {
  const [showFull, setShowFull] = useState(false);
  const active =
    props.unlocked &&
    typeof props.directory === "object" &&
    !!props.directory?.registered &&
    props.directory.current;
  const accountQr = useMemo(() => (active ? qr(props.account) : ""), [active, props.account]);
  const privateQr = useMemo(
    () => (props.unlocked && props.privateAddress && !active ? qr(props.privateAddress) : ""),
    [props.unlocked, props.privateAddress, active],
  );
  if (!props.unlocked)
    return (
      <div className="wallet-receive">
        <p className="wallet-review-context" role="status">
          {props.unavailableMessage}
        </p>
      </div>
    );
  const stale =
    typeof props.directory === "object" && props.directory?.registered && !props.directory.current;
  return (
    <div className="wallet-receive">
      {active ? (
        <>
          <img className="wallet-qr" src={accountQr} alt="QR code for your Stellar account" />
          <div className="wallet-account-name">Your Stellar address for private payments</div>
          <span className="wallet-private-address-short" aria-label="Shortened Stellar account">
            {short(props.account, 6)}
          </span>
          <p className="wallet-review-context" role="status">
            Private receiving active. StealthOS senders who enter this G-address are routed to your
            signed private receiving keys; the payment arrives as a private note.
          </p>
          <button type="button" className="wallet-primary" onClick={props.onCopyAccount}>
            Copy G-address
          </button>
        </>
      ) : (
        <>
          {privateQr && (
            <img className="wallet-qr" src={privateQr} alt="QR code for your private receiving address" />
          )}
          <div className="wallet-account-name">Receive private payments with your G-address</div>
          <p className="wallet-review-context" role="status">
            {props.directory === "checking"
              ? "Checking private receiving registration..."
              : props.directory === "error"
                ? "Registration status is unavailable. Retry, or share your stv3 address below."
                : stale
                  ? "Your G-address is registered to a different receiving address. Approve a fresh registration in Freighter to update it."
                  : "Not activated. Approve one message in Freighter to let StealthOS senders pay this G-address privately."}
          </p>
          <button
            type="button"
            className="wallet-primary"
            disabled={props.busy || props.directory === "checking"}
            onClick={props.onActivate}
          >
            {stale ? "Update private receiving" : "Activate private receiving"}
          </button>
        </>
      )}
      <details className="wallet-advanced">
        <summary>Advanced: stv3 private receiving address</summary>
        <span className="wallet-private-address-short" aria-label="Shortened private receiving address">
          {short(props.privateAddress, 11)}
        </span>
        <button type="button" className="wallet-secondary" onClick={props.onCopyPrivateAddress}>
          Copy stv3 address
        </button>
        <button type="button" className="wallet-text-button" onClick={() => setShowFull((v) => !v)}>
          {showFull ? "Hide address" : "View full address"}
        </button>
        {showFull && <code className="wallet-private-address">{props.privateAddress}</code>}
      </details>
      <p className="wallet-review-context">
        The G-address lookup is off-chain metadata linking this account to private receiving.
        Private balances do not appear in Freighter.
      </p>
    </div>
  );
}
