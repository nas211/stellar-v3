import { useCallback, useEffect, useRef, useState } from "react";
import * as freighter from "@stellar/freighter-api";
import {
  TestnetWallet,
  type WalletView,
  type WalletPort,
  type BalanceLoader,
} from "./wallet";

export async function loadTestnetBalance(address: string): Promise<string> {
  const response = await fetch(
    `https://horizon-testnet.stellar.org/accounts/${encodeURIComponent(address)}`,
    {
      credentials: "omit",
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) throw new Error("Public Testnet balance unavailable.");
  const account = await response.json();
  if (account.account_id !== address || !Array.isArray(account.balances)) {
    throw new Error("Unexpected Testnet account response.");
  }
  const native = account.balances.filter(
    (entry: { asset_type?: string }) => entry.asset_type === "native",
  );
  if (native.length !== 1 || typeof native[0].balance !== "string") {
    throw new Error("Native XLM balance unavailable.");
  }
  return native[0].balance;
}

/** Public wallet access only. No note keys, signatures or wallet-derived witnesses. */
export function useStellarWallet(
  onSessionChanged: () => void,
  port: WalletPort = freighter,
  loadBalance: BalanceLoader = loadTestnetBalance,
) {
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const model = useRef<TestnetWallet>();
  if (!model.current) model.current = new TestnetWallet(port, loadBalance);
  const mounted = useRef(true);
  const callback = useRef(onSessionChanged);
  callback.current = onSessionChanged;
  const epoch = useRef(0);
  const lastAddress = useRef<string | null>(null);
  const refreshPending = useRef<Promise<WalletView | null> | null>(null);
  const clear = useCallback(() => {
    epoch.current++;
    model.current!.disconnect();
    lastAddress.current = null;
    if (mounted.current) {
      setWallet(null);
      setConnecting(false);
    }
    callback.current();
  }, []);
  const connect = useCallback(async () => {
    clear();
    const generation = epoch.current;
    setError("");
    setConnecting(true);
    try {
      const next = await model.current!.connect();
      if (!mounted.current || generation !== epoch.current) return;
      lastAddress.current = next?.address ?? null;
      setWallet(next);
    } catch (failure) {
      if (mounted.current && generation === epoch.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "Freighter connection failed.",
        );
    } finally {
      if (mounted.current && generation === epoch.current) setConnecting(false);
    }
  }, [clear]);
  const refresh = useCallback((): Promise<WalletView | null> => {
    if (refreshPending.current) return refreshPending.current;
    const generation = epoch.current;
    const pending = model
      .current!.refresh()
      .then((next) => {
        if (!mounted.current || generation !== epoch.current) return null;
        if (next?.address !== lastAddress.current) {
          epoch.current++;
          callback.current();
        }
        lastAddress.current = next?.address ?? null;
        setWallet(next);
        return next;
      })
      .catch((failure) => {
        if (mounted.current && generation === epoch.current) {
          clear();
          setError(
            failure instanceof Error
              ? failure.message
              : "Reconnect Freighter on Testnet.",
          );
        }
        return null;
      })
      .finally(() => {
        if (refreshPending.current === pending) refreshPending.current = null;
      });
    refreshPending.current = pending;
    return pending;
  }, [clear]);
  useEffect(() => {
    mounted.current = true;
    const onFocus = () => {
      if (lastAddress.current) void refresh();
    };
    const timer = setInterval(onFocus, 15_000);
    window.addEventListener("focus", onFocus);
    return () => {
      mounted.current = false;
      epoch.current++;
      model.current!.disconnect();
      lastAddress.current = null;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);
  return { wallet, connecting, error, connect, refresh, disconnect: clear };
}
