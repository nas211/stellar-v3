import React from "react";

/** Presentation only: each chain supplies its own verified fee calculation. */
export function WalletFeeSummary({
  rows,
  received,
  children,
}: {
  rows: Array<{ label: string; value: string }>;
  received?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      aria-label="Transaction fees"
      aria-live="polite"
      style={{
        fontSize: "13px",
        color: "#b0c4de",
        margin: "12px 0",
        overflowWrap: "anywhere",
      }}
    >
      {rows.map(({ label, value }) => (
        <div key={label}>
          {label}: {value}
        </div>
      ))}
      {received !== undefined && (
        <div style={{ color: "#f0f4ff", marginTop: "6px" }}>
          Estimated received: {received}
        </div>
      )}
      {children}
    </div>
  );
}
