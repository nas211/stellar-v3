import React from "react";
import { WalletInlineButton } from "./WalletInlineButton";
import { styles } from "../../styles";

/** The same in-field Max control for every chain and spending form. */
export function WalletAmountInput({
  onMax,
  maxDisabled = false,
  containerStyle,
  style,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & {
  onMax: () => void;
  maxDisabled?: boolean;
  containerStyle?: React.CSSProperties;
}) {
  const disabled = maxDisabled || input.disabled;
  return (
    <div
      className="wallet-amount-input"
      style={{
        position: "relative",
        minWidth: 0,
        alignSelf: "start",
        ...containerStyle,
      }}
    >
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        {...input}
        style={{
          ...styles.input,
          display: "block",
          minHeight: 50,
          ...style,
          paddingRight: "72px",
          marginBottom: 0,
        }}
      />
      <WalletInlineButton
        type="button"
        onClick={onMax}
        disabled={disabled}
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          right: 6,
          padding: "0 14px",
        }}
      >
        MAX
      </WalletInlineButton>
    </div>
  );
}
