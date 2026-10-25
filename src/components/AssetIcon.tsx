import React, { useState } from "react";
import "./asset-icon.css";

// Keys come from the network's configured asset identities, never token symbols.
const LOGOS: Readonly<Record<string, string>> = {
  ethereum: "/tokens/ethereum.svg",
  dogecoin: "/tokens/dogecoin.png",
  solana: "/tokens/solana.svg",
  "usd-coin": "/tokens/usdc.svg",
  tether: "/tokens/usdt.svg",
  zcash: "/tokens/zcash.svg",
};

/** Decorative logo alongside a visible asset name or token selector. */
export function AssetIcon({
  marketId,
  iconId,
  symbol,
  size = 42,
  className = "",
}: {
  marketId?: string;
  /** Explicit configured display identity; does not opt an asset into pricing. */
  iconId?: string;
  symbol: string;
  size?: number;
  className?: string;
}) {
  const identity = iconId ?? marketId;
  const src = identity ? LOGOS[identity] : undefined;
  const [failedSrc, setFailedSrc] = useState<string>();
  return (
    <span
      className={`asset-icon ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {src && src !== failedSrc ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span className="asset-icon-fallback">
          {symbol.slice(0, 1).toUpperCase() || "?"}
        </span>
      )}
    </span>
  );
}
