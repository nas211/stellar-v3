import React from "react";

/** Shared compact control for Max and batch mode. */
export function WalletInlineButton({
  style,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled}
      style={{
        background: disabled
          ? "rgba(240,244,255,0.05)"
          : "rgba(240,244,255,0.12)",
        color: disabled ? "#9ba8bf" : "#e8eeff",
        opacity: 1,
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 8,
        padding: "6px 14px",
        fontSize: 12,
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
        ...style,
      }}
    />
  );
}
