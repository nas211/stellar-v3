import React, { useMemo, useState } from "react";
import qrcode from "qrcode-generator";
import type { TokenInfo } from "../../config";
const isPaymentToken = (token: TokenInfo) => token.tokenType !== "erc721";
interface BaseReceiveTabProps {
  canReceivePrivate: boolean;
  paymentLinkToken: TokenInfo | null;
  setPaymentLinkToken: (token: TokenInfo | null) => void;
  paymentLinkAmountInput: string;
  setPaymentLinkAmountInput: (value: string) => void;
  copyPaymentLink: () => void;
  copyPrivateAddress: () => void;
  privateAddress: string;
  claimedHandle: string | null;
  copyHandle: () => void;
  tokenOptions: TokenInfo[];
  paymentLinkDescription?: string;
  tokenNotice?: React.ReactNode;
  paymentLinksAvailable?: boolean;
  compactAddress?: boolean;
  unavailableMessage?: string;
}
export function BaseReceiveTab(props: BaseReceiveTabProps) {
  const [method, setMethod] = useState<"private" | "payment">("private");
  const [showAddress, setShowAddress] = useState(false);
  // Only public receiving keys are encoded; no service receives the address.
  const qr = useMemo(() => {
    if (!props.canReceivePrivate || !props.privateAddress) return "";
    const code = qrcode(0, "M");
    code.addData(props.privateAddress);
    code.make();
    // Long addresses need many modules; a scalable SVG stays scannable at 196px.
    if (props.compactAddress)
      return (
        "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(code.createSvgTag({ cellSize: 4, margin: 4, scalable: true }))
      );
    return code.createDataURL(4, 4);
  }, [props.canReceivePrivate, props.privateAddress, props.compactAddress]);
  const prefixEnd = props.privateAddress.indexOf(":") + 1;
  const shortAddress =
    props.privateAddress.length > prefixEnd + 12
      ? `${props.privateAddress.slice(0, prefixEnd + 6)}…${props.privateAddress.slice(-4)}`
      : props.privateAddress;
  const singleNft = props.paymentLinkToken?.tokenType === "erc721";
  return (
    <div className="wallet-receive">
      <div className="wallet-receive-tabs" aria-label="Receive method">
        <button
          type="button"
          aria-pressed={method === "private"}
          onClick={() => setMethod("private")}
        >
          Private transfer
        </button>
        {props.paymentLinksAvailable !== false && (
          <button
            type="button"
            aria-pressed={method === "payment"}
            onClick={() => setMethod("payment")}
          >
            Payment link
          </button>
        )}
      </div>
      {method === "private" ? (
        <>
          {qr && (
            <img
              className="wallet-qr"
              src={qr}
              alt="QR code for your private receiving address"
            />
          )}
          <div className="wallet-account-name">
            {props.claimedHandle || "Your private address"}
          </div>
          {props.compactAddress && props.canReceivePrivate && (
            <span
              className="wallet-private-address-short"
              aria-label="Shortened private receiving address"
              title="Copy or view the full address below"
            >
              {shortAddress}
            </span>
          )}
          {props.compactAddress && !props.canReceivePrivate && (
            <p className="wallet-review-context" role="status">
              {props.unavailableMessage || "Unlock your private wallet to show its receiving address."}
            </p>
          )}
          <p className="wallet-review-context">
            Share with another StealthOS user to receive a private payment.
          </p>
          <button
            type="button"
            className="wallet-primary"
            disabled={!props.canReceivePrivate}
            onClick={
              props.claimedHandle ? props.copyHandle : props.copyPrivateAddress
            }
          >
            {props.claimedHandle ? "Copy handle" : "Copy private address"}
          </button>
          {props.claimedHandle && (
            <button
              type="button"
              className="wallet-secondary"
              disabled={!props.canReceivePrivate}
              onClick={props.copyPrivateAddress}
            >
              Copy private address
            </button>
          )}
          <button
            type="button"
            className="wallet-text-button"
            disabled={!props.canReceivePrivate}
            onClick={() => setShowAddress((value) => !value)}
          >
            {showAddress
              ? "Hide address"
              : props.compactAddress
                ? "View full address"
                : "View private address"}
          </button>
          {showAddress && props.canReceivePrivate && (
            <code className="wallet-private-address">
              {props.privateAddress}
            </code>
          )}
        </>
      ) : (
        <>
          <p className="wallet-review-context">
            {props.paymentLinkDescription ||
              "Let someone pay you from their connected wallet. The payment arrives in your private balance."}
          </p>
          <div className="wallet-receive-field">
            <label htmlFor="wallet-payment-token">Token (optional)</label>
            <select
              id="wallet-payment-token"
              value={props.paymentLinkToken?.address || ""}
              onChange={(event) =>
                props.setPaymentLinkToken(
                  props.tokenOptions.find(
                    (token) => token.address === event.target.value,
                  ) || null,
                )
              }
            >
              <option value="">Any token</option>
              {props.tokenOptions.filter(isPaymentToken).map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol} – {token.name}
                </option>
              ))}
            </select>
            {props.tokenNotice}
          </div>
          <div className="wallet-receive-field">
            <label htmlFor="wallet-payment-amount">Amount (optional)</label>
            <input
              id="wallet-payment-amount"
              type="number"
              min={props.paymentLinkToken?.tokenType === "erc1155" ? "1" : "0"}
              step={
                props.paymentLinkToken?.tokenType === "erc1155" ? "1" : "any"
              }
              value={singleNft ? "1" : props.paymentLinkAmountInput}
              disabled={singleNft}
              onChange={(event) =>
                props.setPaymentLinkAmountInput(event.target.value)
              }
              placeholder="Leave blank for any amount"
            />
          </div>
          <button
            type="button"
            className="wallet-primary"
            disabled={!props.canReceivePrivate}
            onClick={props.copyPaymentLink}
          >
            Copy payment link
          </button>
        </>
      )}
    </div>
  );
}
