import React, { useCallback, useEffect, useRef, useState } from "react";
import * as freighter from "@stellar/freighter-api";
import { Networks, StrKey } from "@stellar/stellar-sdk";
import { BaseWalletShell } from "../base-app/components/BaseWalletShell";
import { BaseSendTab } from "../base-app/components/BaseSendTab";
import { amountValidation } from "../base-app/helpers/amountValidation";
import { BaseSwapTab } from "../base-app/components/BaseSwapTab";
import { BaseTransactionReview } from "../base-app/components/BaseTransactionReview";
import { BaseHistoryCard } from "../base-app/components/BaseHistoryCard";
import { WalletAmountInput } from "../base-app/components/WalletAmountInput";
import { WalletFeeSummary } from "../base-app/components/WalletFeeSummary";
import type { BaseStatusMessage, BaseTabType } from "../base-app/types";
import type { TokenInfo } from "../config";
import { styles } from "../styles";
import { useBlockNetworkSwitch } from "../networks/WalletNetworkContext";
import { useStellarWallet } from "./useStellarWallet";
import { StellarReceiveTab, type DirectoryState } from "./StellarReceiveTab";
import {
  registrationMessage,
  signatureBytes,
  signatureValid,
} from "./private-wallet/directory";
import { parseXlm, formatXlm } from "./private-wallet/encoding";
import { privateWalletPasskey } from "./private-wallet/passkey";
import { freighterWalletKey } from "./private-wallet/freighter-key";
import type { PasskeyAuthentication } from "./private-wallet/storage";
import { decodeAddress } from "./private-wallet/address";
import { TESTNET_NETWORK_ID } from "./private-wallet/types";
import { hex } from "./private-wallet/encoding";
import { PrivatePaymentClient } from "./private-payment/client";
import {
  inspectDeposit,
  inspectSignedDeposit,
} from "./private-payment/hackathon-safety";
import defaultPin from "./private-payment/private-send-pin.json";
import { poolProfiles, poolProfile } from "./private-payment/pool-profiles";

const XLM: TokenInfo = {
  address: defaultPin.nativeXlmSac,
  symbol: "XLM",
  name: "Stellar",
  decimals: 7,
  isNative: true,
};
const TABS: { id: BaseTabType; label: string }[] = [
  { id: "shield", label: "Add" },
  { id: "swap", label: "Swap" },
  { id: "send", label: "Send" },
  { id: "receive", label: "Receive" },
  { id: "withdraw", label: "Withdraw" },
];
const noop = () => {};
const explorer = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;
function download(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The same wallet shell as Base and Solana; only the payment adapter changes. */
export default function StellarApp() {
  const [poolId, setPoolId] = useState(defaultPin.contractId);
  const pin = poolProfile(poolId);
  const client = useRef<PrivatePaymentClient | null>(null);
  const busyRef = useRef(false);
  const backgroundRef = useRef(false);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<any>(null);
  const [authentication, setAuthentication] = useState<
    PasskeyAuthentication | undefined
  >();
  const [recoveryKey, setRecoveryKey] = useState("");
  const [preparationAttempt, setPreparationAttempt] = useState(0);
  const [preparationError, setPreparationError] = useState("");
  const [preparationStage, setPreparationStage] = useState("");
  const [preparationSeconds, setPreparationSeconds] = useState(0);
  const [ready, setReady] = useState(false),
    [exists, setExists] = useState<boolean | null>(null);
  const [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [privateFailure, setPrivateFailure] = useState("");
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState("");
  const [status, setStatus] = useState<BaseStatusMessage | null>(null);
  const [progressSeconds, setProgressSeconds] = useState(0);
  useEffect(() => {
    if (!progress) return;
    const started = Date.now();
    setProgressSeconds(0);
    const timer = setInterval(
      () => setProgressSeconds(Math.floor((Date.now() - started) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [progress]);
  const progressText = progress ? `${progress} ${progressSeconds}s` : "";
  const [activeTab, setActiveTab] = useState<BaseTabType>("shield");
  const [amount, setAmount] = useState("10"),
    [recipient, setRecipient] = useState("");
  const [review, setReview] = useState<any>(null);
  const sessionEpoch = useRef(0);
  const reset = useCallback(() => {
    sessionEpoch.current++;
    busyRef.current = false;
    backgroundRef.current = false;
    setBusy(false);
    setSyncing(false);
    setPrivateFailure("");
    client.current?.close();
    client.current = null;
    setSummary(null);
    setAuthentication(undefined);
    setRecoveryKey("");
    setReady(false);
    setExists(null);
    setPassword("");
    setConfirmation("");
    setReview(null);
    setRecipient("");
    setStatus(null);
  }, []);
  const wallet = useStellarWallet(reset);
  useBlockNetworkSwitch(busy || wallet.connecting);
  const ask = useCallback(async (method: string, payload?: unknown) => {
    const c = client.current;
    if (!c) throw Error("Connect Freighter first.");
    const result = await c.request(method, payload);
    if (client.current !== c) throw Error("Wallet account changed; reconnect.");
    return result;
  }, []);
  const run = async (task: () => Promise<void>, background = false) => {
    if (busyRef.current || (background && backgroundRef.current)) return;
    const epoch = sessionEpoch.current;
    if (background) {
      backgroundRef.current = true;
      try {
        await task();
      } catch (error) {
        if (epoch === sessionEpoch.current && !busyRef.current)
          setStatus({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Private balance refresh failed.",
          });
      } finally {
        if (epoch === sessionEpoch.current) backgroundRef.current = false;
      }
      return;
    }
    busyRef.current = true;
    setBusy(true);
    if (!background) setStatus(null);
    try {
      await task();
    } catch (error) {
      if (epoch !== sessionEpoch.current) return;
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Wallet operation failed.",
      });
    } finally {
      if (epoch === sessionEpoch.current) {
        busyRef.current = false;
        setBusy(false);
        setProgress("");
      }
    }
  };
  useEffect(() => {
    if (!wallet.wallet?.address) return;
    let live = true;
    let c: PrivatePaymentClient | null = null;
    const started = Date.now();
    setReady(false);
    setExists(null);
    setPreparationError("");
    setPreparationSeconds(0);
    setPreparationStage("Loading the private-payment engine...");
    const fail = (error: Error) => {
      if (!live) return;
      live = false;
      clearTimeout(deadline);
      clearInterval(ticker);
      c?.close();
      if (client.current === c) client.current = null;
      setPreparationStage("");
      setPreparationError(error.message);
    };
    const ticker = setInterval(() => {
      if (live)
        setPreparationSeconds(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    const deadline = setTimeout(
      () =>
        fail(
          new Error(
            "Private wallet preparation timed out. Retry preparation; your encrypted wallet and pending payments are preserved.",
          ),
        ),
      10000,
    );
    try {
      c = new PrivatePaymentClient((message) => {
        if (live) {
          setPreparationStage(message);
          setProgress(message);
        }
      });
      client.current = c;
      const session = c;
      session
        .request("configure", { contractId: pin.contractId })
        .then(() => session.request("initialize"))
        .then(() => {
          if (!live) throw new Error("Preparation cancelled.");
          setPreparationStage("Checking this account's encrypted wallet...");
          return session.request("exists", { source: wallet.wallet!.address });
        })
        .then(async (found) => {
          const auth = found
            ? await session.request("authentication", {
                source: wallet.wallet!.address,
              })
            : undefined;
          if (live) {
            setAuthentication(auth);
            clearTimeout(deadline);
            clearInterval(ticker);
            setReady(true);
            setExists(found);
            setPreparationStage("");
            setProgress("");
          }
        })
        .catch(fail);
    } catch (error) {
      fail(
        error instanceof Error
          ? error
          : new Error("Private wallet could not start."),
      );
    }
    return () => {
      live = false;
      clearTimeout(deadline);
      clearInterval(ticker);
      c?.close();
      if (client.current === c) client.current = null;
    };
  }, [wallet.wallet?.address, preparationAttempt, poolId]);
  const refreshPrivate = useCallback(async () => {
    const epoch = sessionEpoch.current;
    setSyncing(true);
    try {
      const next = await ask("sync");
      if (epoch !== sessionEpoch.current) return;
      setSummary(next);
      setPrivateFailure(next.recoveryError ?? "");
    } catch (error) {
      if (epoch !== sessionEpoch.current) return;
      setPrivateFailure(
        error instanceof Error
          ? error.message
          : "Private wallet reconciliation failed.",
      );
      setSummary((old: any) => (old ? { ...old, authenticated: false } : old));
      throw error;
    } finally {
      if (epoch === sessionEpoch.current) {
        setSyncing(false);
        if (!busyRef.current) setProgress("");
      }
    }
  }, [ask]);
  useEffect(() => {
    if (!summary) return;
    const initial = setTimeout(() => {
      if (!busyRef.current) void run(refreshPrivate, true);
    }, 0);
    const timer = setInterval(() => {
      if (!busyRef.current) void run(refreshPrivate, true);
    }, 30000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [!!summary, refreshPrivate]);
  const checkAccount = async () => {
    const expected = wallet.wallet?.address;
    const fresh = await wallet.refresh();
    if (!expected || fresh?.address !== expected || !client.current)
      throw Error(
        "Freighter account or network changed. Reconnect before continuing.",
      );
    return fresh;
  };
  const open = () =>
    run(async () => {
      setProgress("Approve the wallet unlock message in Freighter...");
      const fresh = await checkAccount();
      const scope = JSON.stringify([
        TESTNET_NETWORK_ID,
        pin.contractId,
        fresh.address,
      ]);
      const freighterKey = await freighterWalletKey(
        freighter,
        fresh.address,
        scope,
        Networks.TESTNET,
      );
      // Existing passkey or password wallets are re-keyed once in place; identity and notes are unchanged.
      let legacyPassword: string | undefined;
      if (exists && authentication?.type === "webauthn-prf") {
        setProgress("One-time move to Freighter unlock: confirm with your device...");
        legacyPassword = (await privateWalletPasskey(scope, authentication))
          .password;
      } else if (exists && !authentication) legacyPassword = password;
      setProgress("Opening your private wallet...");
      setSummary(
        await ask("open", {
          source: fresh.address,
          create: !exists,
          password: legacyPassword ?? freighterKey.password,
          ...(!exists ? { authentication: freighterKey.authentication } : {}),
          ...(legacyPassword !== undefined ? { upgrade: freighterKey } : {}),
        }),
      );
      setAuthentication(freighterKey.authentication);
      setExists(true);
      setPassword("");
      setConfirmation("");
    });
  useEffect(() => {
    if (ready && exists === false && !summary && !busyRef.current) open();
    else if (
      ready &&
      authentication?.type === "freighter-signature" &&
      !summary &&
      !busyRef.current
    )
      open();
    // A connection/preparation transition requests one Freighter approval.
    // Locking does not automatically unlock the wallet again.
  }, [ready, wallet.wallet?.address]);
  const prepareDeposit = () =>
    run(async () => {
      const fresh = await checkAccount();
      setProgress("Estimating the public deposit and network fee...");
      const requested = parseXlm(amount).toString();
      const prepared = await ask("deposit", {
        source: fresh.address,
        amount: requested,
      });
      inspectDeposit(prepared.draft, prepared.context, pin.contractId, Date.now(), pin.depositAdapterId);
      setReview({
        kind: "deposit",
        ...prepared,
        amount: formatXlm(requested),
        recipient: "Your private XLM balance",
        fee: prepared.draft.fee,
      });
    });
  const prepareSend = (withdraw = false) =>
    run(async () => {
      await checkAccount();
      setProgress("Preparing...");
      await ask(
        withdraw ? "prepareWithdraw" : "prepareSend",
        withdraw
          ? { recipient: wallet.wallet!.address }
          : { address: recipient.trim(), amount: parseXlm(amount).toString() },
      );
      setProgress("Preparing: requesting the network fee quote...");
      // The quote step re-verifies the pool itself; no separate resync is needed.
      const quote = await ask("quote");
      setSummary(await ask("summary"));
      setReview({
        ...quote,
        kind: withdraw ? "withdrawal" : "private",
        amount: formatXlm(quote.review.amount),
        recipient: quote.review.recipient,
      });
    });
  const resumeReview = () =>
    run(async () => {
      await checkAccount();
      const quote = await ask("quote");
      setActiveTab("send");
      setReview({
        ...quote,
        kind: quote.kind === "withdraw" ? "withdrawal" : "private",
        amount: formatXlm(quote.review.amount),
        recipient: quote.review.recipient,
      });
    });
  const finish = async (result: any) => {
    setSummary(result.summary);
    setReview(null);
    if (
      result.result.status === "SUCCESS" &&
      result.summary.authenticated &&
      result.summary.receipts.some(
        (receipt: any) => receipt.hash === result.result.hash,
      )
    ) {
      setStatus({
        type: "success",
        message: "Payment confirmed on Stellar Testnet.",
        transactionComplete: true,
        link: {
          href: explorer(result.result.hash),
          label: "View public receipt",
        },
      });
    } else if (result.result.status === "FAILED") {
      setStatus({
        type: "error",
        message:
          "Stellar confirmed that this transaction failed. The failed attempt is saved; review a new transaction to retry.",
      });
    } else
      setStatus({
        type: "info",
        message:
          result.result.status === "UNSIGNED"
            ? "This quote was not signed. Review the pending payment in History to get a fresh fee quote."
            : ["FAILED", "EXPIRED"].includes(result.summary.pendingOutcome)
              ? "The previous transaction did not settle. Review the saved payment in History to retry safely."
              : "Still pending confirmation after three minutes. Its exact transaction is saved; Refresh to reconcile it.",
        ...(result.result.hash
          ? {
              link: {
                href: explorer(result.result.hash),
                label: "View pending transaction",
              },
            }
          : {}),
      });
    await wallet.refresh();
  };
  const confirm = () =>
    run(async () => {
      const fresh = await checkAccount();
      const approved = review;
      if (!approved) throw Error("Review the transaction first.");
      if (approved.kind === "deposit") {
        inspectDeposit(approved.draft, approved.context, pin.contractId, Date.now(), pin.depositAdapterId);
        if (fresh.address !== approved.context.source)
          throw Error("Deposit belongs to a different account.");
        const network = await freighter.getNetworkDetails();
        if (network.error || network.networkPassphrase !== Networks.TESTNET)
          throw Error("Select Stellar Testnet in Freighter.");
        setProgress("Approve the public deposit in Freighter...");
        const session = client.current;
        const signed = await freighter.signTransaction(
          approved.draft.unsignedXdr,
          { address: fresh.address, networkPassphrase: Networks.TESTNET },
        );
        if (
          client.current !== session ||
          signed.error ||
          !signed.signedTxXdr ||
          (signed.signerAddress && signed.signerAddress !== fresh.address)
        )
          throw Error("Freighter approval was declined or the wallet changed.");
        inspectSignedDeposit(
          signed.signedTxXdr,
          approved.draft,
          approved.context,
          pin.contractId,
          Date.now(),
          pin.depositAdapterId,
        );
        setProgress("Waiting for authenticated Stellar confirmation...");
        await finish(
          await ask("submitDeposit", {
            id: approved.draft.hash,
            signedXdr: signed.signedTxXdr,
          }),
        );
      } else {
        const epoch = sessionEpoch.current;
        setProgress("Submitting...");
        let outcome = await ask("send", {
          approved: true,
          hash: approved.hash,
          fee: approved.fee,
        });
        const submittedAt = Date.now();
        // Show the acknowledged hash at once; success waits for the authenticated receipt.
        while (
          epoch === sessionEpoch.current &&
          outcome.result.hash &&
          !["SUCCESS", "FAILED", "UNSIGNED"].includes(outcome.result.status) &&
          Date.now() - submittedAt < 180000
        ) {
          setStatus({
            type: "info",
            message: `Pending confirmation: transaction ${outcome.result.hash.slice(0, 8)}…${outcome.result.hash.slice(-6)} was submitted and is waiting for a Stellar ledger.`,
            link: {
              href: explorer(outcome.result.hash),
              label: "View pending transaction",
            },
          });
          setProgress("Pending confirmation...");
          await new Promise((resolve) => setTimeout(resolve, 2500));
          outcome = await ask("status", { light: true });
        }
        if (epoch !== sessionEpoch.current) return;
        await finish(outcome);
      }
    });
  const available = summary?.authenticated
    ? formatXlm(summary.available)
    : "Unavailable";
  const [directory, setDirectory] = useState<
    DirectoryState | null | "checking" | "error"
  >(null);
  const unlockedAddress = summary?.address as string | undefined;
  useEffect(() => {
    if (!unlockedAddress || !wallet.wallet?.address) {
      setDirectory(null);
      return;
    }
    let live = true;
    setDirectory("checking");
    ask("directoryStatus", { account: wallet.wallet.address })
      .then((state) => live && setDirectory(state))
      .catch(() => live && setDirectory("error"));
    return () => {
      live = false;
    };
  }, [unlockedAddress, wallet.wallet?.address]);
  const activateReceiving = () =>
    run(async () => {
      const fresh = await checkAccount();
      const body = {
        account: fresh.address,
        networkPassphrase: Networks.TESTNET,
        contractId: pin.contractId,
        assetContractId: pin.nativeXlmSac,
        receivingAddress: summary.address as string,
        issuedAt: Math.floor(Date.now() / 1000),
      };
      const message = registrationMessage(body);
      setProgress("Approve the private receiving registration in Freighter...");
      const signed = await freighter.signMessage(message, {
        address: fresh.address,
        networkPassphrase: Networks.TESTNET,
      });
      if (!signed || (signed as any).error)
        throw Error("Freighter did not approve the registration. Nothing was changed.");
      if ((signed as any).signerAddress && (signed as any).signerAddress !== fresh.address)
        throw Error("Freighter signed with a different account. Reconnect and retry.");
      const signature = signatureBytes((signed as any).signedMessage);
      if (!signatureValid(fresh.address, message, signature))
        throw Error("Freighter returned an unverifiable signature. Nothing was registered.");
      setProgress("Registering your signed receiving address...");
      setDirectory(
        await ask("directoryRegister", {
          registration: {
            version: 1,
            ...body,
            signature: btoa(String.fromCharCode(...Array.from(signature))),
          },
        }),
      );
      setStatus({
        type: "success",
        message: `Private receiving active. Share ${fresh.address.slice(0, 6)}…${fresh.address.slice(-4)} with StealthOS senders.`,
      });
    });
  const copyAccount = async () => {
    const account = wallet.wallet?.address ?? "";
    if (!StrKey.isValidEd25519PublicKey(account)) return;
    await navigator.clipboard.writeText(account);
    setStatus({ type: "info", message: "G-address copied." });
  };
  const trimmedRecipient = recipient.trim();
  const recipientProblem: string | null = !trimmedRecipient
    ? null
    : StrKey.isValidEd25519PublicKey(trimmedRecipient)
      ? trimmedRecipient === wallet.wallet?.address
        ? "That is your own connected account. Use Withdraw to move private XLM to it publicly."
        : null
      : /^stv3:[a-f0-9]{404}$/.test(trimmedRecipient)
        ? null
        : "Enter a Stellar G-address or a stv3 private receiving address.";
  const copy = async () => {
    try {
      const address = summary.address;
      await decodeAddress(address, {
        networkId: TESTNET_NETWORK_ID,
        poolId: hex(StrKey.decodeContract(pin.contractId)),
        assetId: hex(StrKey.decodeContract(pin.nativeXlmSac)),
      });
      await navigator.clipboard.writeText(address);
      setStatus({ type: "info", message: "Private receiving address copied." });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Address copy failed.",
      });
    }
  };
  const authNotice = (
    <>
      <p className="wallet-review-context">
        Testnet only. Faucet funds. Development cryptography is unsafe for real
        value.
      </p>
      {!wallet.wallet ? (
        <button
          className="wallet-primary"
          disabled={wallet.connecting}
          onClick={() => void wallet.connect()}
        >
          {wallet.connecting ? "Connecting..." : "Connect Freighter"}
        </button>
      ) : !summary ? (
        <section aria-label="Private wallet authentication">
          <p className="wallet-review-context">
            {exists && !authentication
              ? "Enter your existing wallet password once to move it to Freighter unlock. Your notes and spending keys stay unchanged."
              : exists && authentication?.type === "webauthn-prf"
                ? "This wallet was protected with a device passkey. Confirm it once to move it to Freighter unlock; your notes and spending keys stay unchanged."
                : "Approve the unlock message in Freighter to open your private wallet. It does not move funds."}
          </p>
          {exists === true && !authentication && (
            <>
              <label htmlFor="stellar-password">
                Existing wallet password (one-time migration)
              </label>
              <input
                id="stellar-password"
                style={styles.input}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
            </>
          )}
          <button
            className="wallet-primary"
            disabled={
              !ready ||
              busy ||
              (exists === true && !authentication && password.length < 8)
            }
            onClick={open}
          >
            {!ready
              ? preparationError
                ? "Private wallet unavailable"
                : "Preparing private wallet..."
              : busy
                ? "Preparing private wallet..."
                : exists && authentication?.type !== "freighter-signature"
                  ? "Move to Freighter unlock"
                  : "Open with Freighter"}
          </button>
          {!ready && (
            <div aria-live="polite">
              {preparationError ? (
                <p role="alert">{preparationError}</p>
              ) : (
                <p role="status">
                  {preparationStage} {preparationSeconds}s elapsed. First
                  preparation normally finishes within ten seconds. Retry if it
                  stalls.
                </p>
              )}
              {(preparationError || preparationSeconds >= 10) && (
                <button
                  className="wallet-secondary"
                  onClick={() => setPreparationAttempt((n) => n + 1)}
                >
                  Retry preparation
                </button>
              )}
            </div>
          )}
          <p className="wallet-review-context">
            Save a recovery backup under Settings. The server cannot recover
            private spending keys.
          </p>
        </section>
      ) : null}
      {wallet.error && <p role="alert">{wallet.error}</p>}
      {wallet.wallet && !summary && status?.type === "error" && (
        <p role="alert">{status.message}</p>
      )}
      {progress && <p role="status">{progressText}</p>}
      {wallet.wallet && (
        <p className="wallet-review-context">
          Screening status: Stellar provider coverage is unverified.
        </p>
      )}
      {summary?.depositOutcome && !summary.depositPending && (
        <p role="status">
          Previous deposit{" "}
          {summary.depositOutcome.outcome === "FAILED"
            ? "failed on Stellar"
            : "expired without settlement"}
          . No private funds were credited.{" "}
          {summary.depositOutcome.fee
            ? `Network fee charged: ${formatXlm(summary.depositOutcome.fee)} XLM. `
            : ""}
          You can review a new deposit.
        </p>
      )}
      {summary && privateFailure && (
        <button
          className="wallet-secondary"
          disabled={busy || syncing}
          onClick={() => void run(refreshPrivate)}
        >
          Retry reconciliation
        </button>
      )}
      {summary && !summary.authenticated && (
        <p role="status">
          {syncing
            ? "Checking your private balance in the background. You can add XLM or open Receive now."
            : "Private balance verification needs a refresh before sending. Add and Receive remain available."}
        </p>
      )}
      {wallet.wallet && (
        <p className="wallet-review-context">
          Public XLM: {wallet.wallet.balance ?? "Unavailable"}. Available
          private XLM: {available}
        </p>
      )}
      {summary?.authenticated &&
        summary.state?.nextSlot > pin.capacity - 21 && (
          <p role="status">
            This Testnet pool has limited capacity. New deposits are
            unavailable;{" "}
            {Math.floor((pin.capacity - summary.state.nextSlot) / 5)} private
            settlements remain in this contract.
          </p>
        )}
      {summary && (summary.pending || summary.depositPending) && (
        <p role="status">
          Pending payment saved securely. Reconcile it in History before
          starting another.
        </p>
      )}
    </>
  );
  const recovery = (
    <section aria-label="Security and recovery">
      {poolProfiles.length > 1 && (
        <label>
          Stellar Testnet pool
          <select
            aria-label="Stellar Testnet pool"
            disabled={busy || wallet.connecting}
            value={poolId}
            onChange={(e) => {
              reset();
              setPoolId(e.target.value);
            }}
          >
            {poolProfiles.map((p, i) => (
              <option key={p.contractId} value={p.contractId}>
                {i === 0 ? "Current pool" : "Previous pool - existing notes"} (
                {p.capacity} rows)
              </option>
            ))}
          </select>
          <p>
            Each pool keeps separate private notes and history. Select the
            previous pool to access its existing funds.
          </p>
        </label>
      )}
      <h3>Private wallet backup</h3>
      <p className="wallet-review-context">
        Save the encrypted wallet and delivery backups. Passkey wallets export a
        separate recovery key; keep it apart from the encrypted file. Use the
        same Freighter account to restore. The server never holds your spending
        keys.
      </p>
      <button
        className="wallet-primary"
        disabled={!summary || busy}
        onClick={() =>
          void run(async () => {
            const exported = await ask("exportBackup");
            if (exported.recoveryKey) setRecoveryKey(exported.recoveryKey);
            download(
              exported.backup ?? exported,
              "stealthos-stellar-encrypted-wallet.json",
            );
          })
        }
      >
        Download encrypted wallet backup
      </button>
      {recoveryKey && (
        <section aria-label="Private wallet recovery key">
          <p>Save this recovery key separately from the encrypted backup.</p>
          <code style={{ overflowWrap: "anywhere" }}>{recoveryKey}</code>
          <button onClick={() => navigator.clipboard.writeText(recoveryKey)}>
            Copy recovery key
          </button>
          <button onClick={() => setRecoveryKey("")}>Hide recovery key</button>
        </section>
      )}
      <button
        className="wallet-secondary"
        disabled={!summary || busy}
        onClick={() =>
          void run(async () =>
            download(
              await ask("exportDelivery"),
              "stealthos-stellar-encrypted-deliveries.json",
            ),
          )
        }
      >
        Download encrypted note delivery
      </button>
      {!summary && (
        <>
          <label htmlFor="stellar-recovery-password">
            Recovery key or legacy password
          </label>
          <input
            id="stellar-recovery-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
        </>
      )}
      <label className="wallet-setting">
        Restore encrypted wallet
        <input
          type="file"
          accept="application/json"
          disabled={!ready || !!summary || busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
              void run(async () => {
                if (file.size > 64 * 1024 * 1024)
                  throw Error("Backup too large.");
                await ask("restoreBackup", {
                  source: wallet.wallet!.address,
                  password,
                  backup: JSON.parse(await file.text()),
                });
                setExists(true);
                setStatus({
                  type: "info",
                  message:
                    "Encrypted wallet restored. Unlock private payments to authenticate notes.",
                });
              });
          }}
        />
      </label>
      <label className="wallet-setting">
        Restore encrypted note delivery
        <input
          type="file"
          accept="application/json"
          disabled={!summary || busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
              void run(async () => {
                if (file.size > 500000)
                  throw Error("Delivery backup too large.");
                setSummary(
                  await ask("importDelivery", JSON.parse(await file.text())),
                );
              });
          }}
        />
      </label>
      <button
        className="wallet-secondary"
        disabled={!summary || busy}
        onClick={() =>
          void run(async () => {
            await ask("lock");
            setSummary(null);
            setRecoveryKey("");
            setReview(null);
          })
        }
      >
        Lock private payments
      </button>
      <button
        className="wallet-secondary"
        disabled={!summary?.authenticated || summary?.pending || busy}
        onClick={() => {
          setActiveTab("send");
          void prepareSend(true);
        }}
      >
        Withdraw all private XLM to connected account
      </button>
      <p className="wallet-review-context">
        Stellar risk and sanctions provider coverage is unverified. This wallet
        has not passed full compliance screening. Existing screening on other
        networks is unchanged.
      </p>
      <p className="wallet-review-context">
        Public deposits and withdrawals reveal their amount and account. Private
        sends conceal the internal amount and recipient in transaction fields;
        hashes, fees, commitments, nullifiers, roots and timing remain public.
        Small pools can permit correlation. Encrypted delivery is off-chain.
      </p>
    </section>
  );
  const history = (
    <section aria-label="Stellar private history">
      <p className="wallet-review-context">
        Your authenticated private operations. Amounts are decrypted locally;
        explorer links show public transaction details.
      </p>
      {summary?.depositPending && (
        <button
          className="wallet-primary"
          disabled={busy}
          onClick={() =>
            void run(async () => finish(await ask("recoverDeposit")))
          }
        >
          Reconcile pending deposit
        </button>
      )}
      {summary?.pending && (
        <>
          <button
            className="wallet-secondary"
            disabled={busy}
            onClick={() => void run(async () => finish(await ask("status")))}
          >
            Reconcile pending payment
          </button>
          <button
            className="wallet-primary"
            disabled={busy}
            onClick={resumeReview}
          >
            Review pending payment
          </button>
          <button
            className="wallet-secondary"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                setSummary(await ask("cancel"));
                setReview(null);
              })
            }
          >
            Cancel unsubmitted payment
          </button>
        </>
      )}
      {!summary?.receipts?.length && (
        <p className="wallet-empty">
          {summary?.authenticated
            ? "No confirmed private operations yet."
            : "Unlock and refresh to authenticate your history."}
        </p>
      )}
      <BaseHistoryCard
        historyLoading={busy}
        historyError={
          summary && !summary.authenticated
            ? "Ledger authentication unavailable. Refresh to retry."
            : null
        }
        historyEntries={(summary?.receipts ?? []).map((r: any, i: number) => ({
          id: i,
          type:
            (
              {
                "private send": "transfer",
                "public exit": "withdraw",
                deposit: "deposit",
                receive: "receive",
              } as const
            )[r.kind] ?? "receive",
          amount: r.amount ? formatXlm(r.amount) : "Unavailable",
          symbol: "XLM",
          timestamp: 0,
          txHash: r.hash,
          memo: `Confirmed ledger ${r.ledger}${r.fee ? ` | Network fee charged ${formatXlm(r.fee)} XLM` : ""}${r.amount ? " | Amount decrypted locally" : " | Amount unavailable in this historical receipt"}`,
        }))}
        onRefresh={() => void run(refreshPrivate)}
        getExplorerTxUrl={explorer}
      />
    </section>
  );
  function reviewPanel() {
    return (
      review && (
        <BaseTransactionReview
          exactAmountDisplay
          kind={review.kind}
          amount={review.amount}
          symbol="XLM"
          recipient={review.recipient}
          network="Stellar Testnet"
          fee={formatXlm(review.fee)}
          feeLabel="Maximum network fee"
          feeSummary={
            <WalletFeeSummary
              rows={[
                ...(review.kind === "withdrawal"
                  ? [
                      { label: "Destination (public)", value: review.recipient },
                      { label: "You receive (public)", value: `${review.amount} XLM` },
                    ]
                  : []),
                {
                  label: "Maximum network fee",
                  value: `${formatXlm(review.fee)} XLM`,
                },
                {
                  label: "Network fee payer",
                  value:
                    review.kind === "deposit"
                      ? "Your Freighter account"
                      : "Testnet relayer",
                },
                {
                  label: "Protocol fee",
                  value: review.kind === "deposit" ? "0 XLM" : "0.01 XLM",
                },
                {
                  label: "Network fee cap",
                  value:
                    review.kind === "deposit"
                      ? "5 XLM"
                      : `${formatXlm(pin.privateFeeCapStroops)} XLM`,
                },
              ]}
            />
          }
          onConfirm={confirm}
          disabled={busy}
          delivery={
            review.kind === "private"
              ? "Private amount and receiving identity remain off public transaction fields."
              : review.kind === "withdrawal"
                ? "Public withdrawal: the Stellar receipt reveals the destination account and the amount."
                : "The public Stellar receipt shows the account and amount."
          }
        />
      )
    );
  }
  const privateState = !ready
    ? preparationError
      ? "failed"
      : "preparing"
    : !summary
      ? busy
        ? "preparing"
        : status?.type === "error"
          ? "failed"
          : "locked"
      : syncing
        ? "reconciling"
        : privateFailure || summary.recoveryError
          ? "failed"
          : summary.authenticated
            ? "ready"
            : "preparing";
  const privateLabels = {
    preparing: "Preparing private wallet",
    locked: "Private wallet locked",
    reconciling: "Reconciling private wallet",
    ready: "Private wallet ready",
    failed: "Private wallet failed",
  };
  const privateDescriptions = {
    preparing:
      "Preparing your encrypted private wallet. Freighter is already connected.",
    locked:
      "Unlock private payments with your device or existing recovery credentials to load private assets.",
    reconciling:
      summary?.pending || summary?.depositPending
        ? "Verifying your saved payment against Stellar. Pending records and reserved notes are preserved."
        : "Verifying encrypted notes and confirmed Stellar history.",
    ready:
      summary?.pending || summary?.depositPending
        ? "Private balance verified. A saved payment reserves funds; review it in History."
        : "Your private balance is authenticated.",
    failed:
      privateFailure ||
      preparationError ||
      summary?.recoveryError ||
      (!summary && status?.type === "error" ? status.message : "") ||
      "Private-wallet preparation failed. Retry without clearing your encrypted wallet.",
  };
  const withdrawPayout =
    summary?.authenticated && BigInt(summary.available ?? "0") > 100000n
      ? BigInt(summary.available) - 100000n
      : 0n;
  const withdrawPanel = (
    <section aria-label="Withdraw to your Stellar account">
      <p className="wallet-review-context">
        Withdraw moves your whole private XLM balance to your connected
        Freighter account as a public Stellar payment.
      </p>
      <WalletFeeSummary
        rows={[
          {
            label: "Destination",
            value: wallet.wallet
              ? `${wallet.wallet.address.slice(0, 6)}…${wallet.wallet.address.slice(-4)} (connected Freighter account)`
              : "Connect Freighter",
          },
          { label: "Private balance", value: `${available} XLM` },
          {
            label: "You receive",
            value: summary?.authenticated
              ? `${formatXlm(withdrawPayout)} XLM`
              : "Unavailable",
          },
          { label: "Protocol fee", value: "0.01 XLM" },
          {
            label: "Network fee",
            value: "Estimated on the next screen; paid by the Testnet relayer",
          },
        ]}
      />
      <p className="wallet-review-context" role="note">
        Withdrawal is public: the Stellar receipt reveals the destination
        account and the amount. Use Send for private payments.
      </p>
      <button
        type="button"
        className="wallet-primary"
        disabled={
          !summary?.authenticated ||
          summary?.pending ||
          summary?.depositPending ||
          withdrawPayout <= 0n ||
          busy
        }
        onClick={() => void prepareSend(true)}
      >
        {summary?.pending
          ? "Resolve the saved payment in History first"
          : "Review withdrawal"}
      </button>
    </section>
  );
  const canAdd =
    !!wallet.wallet &&
    !!summary &&
    !summary.pending &&
    !summary.depositPending &&
    !busy;
  const sendBalance =
    summary?.authenticated && !summary.pending && !summary.depositPending
      ? BigInt(summary?.available ?? "0") > 100000n
        ? BigInt(summary?.available ?? "0") - 100000n
        : 0n
      : null;
  return (
    <BaseWalletShell
      connectLabel="Connect Freighter"
      connected={!!wallet.wallet}
      walletAddress={wallet.wallet?.address ?? ""}
      claimedHandle={null}
      chainLabel="Stellar Testnet"
      handlesAvailable={false}
      busy={(busy && !!summary) || wallet.connecting}
      status={
        status ??
        (wallet.error ? { type: "error", message: wallet.error } : null)
      }
      activeTab={activeTab}
      tabs={TABS}
      onSelectTab={(tab) => {
        setActiveTab(tab);
        setReview(null);
        setAmount(tab === "shield" ? "10" : "");
      }}
      onWallet={() => {
        if (wallet.wallet) wallet.disconnect();
        else void wallet.connect();
      }}
      onCopyHandle={noop}
      canCopyHandle={false}
      balanceUsd={null}
      nativeBalance={
        summary?.authenticated ? `${formatXlm(summary.balance)} XLM` : undefined
      }
      balanceCaption="Private XLM | Stellar Testnet"
      balancesReady={!!summary?.authenticated}
      balanceUnavailable={!summary?.authenticated}
      privateWalletStatus={
        wallet.wallet
          ? {
              state: privateState,
              label: privateLabels[privateState],
              description: privateDescriptions[privateState],
            }
          : undefined
      }
      refreshing={busy || syncing}
      canRefresh={!!wallet.wallet && !busy}
      onRefresh={() =>
        void run(async () => {
          await checkAccount();
          if (summary) await refreshPrivate();
        })
      }
      authNotice={authNotice}
      assets={null}
      history={history}
      handle={null}
      recovery={recovery}
      openPreparedReview
      reviewing={!!review}
      onBackFromReview={() => setReview(null)}
      portfolio={{
        rows: summary?.authenticated
          ? [
              {
                id: "xlm",
                mint: pin.nativeXlmSac,
                symbol: "XLM",
                name: "Stellar",
                amount: formatXlm(summary.balance),
                isNft: false,
              },
            ]
          : [],
        prices: {},
        changes: {},
        markets: { [pin.nativeXlmSac]: "stellar" },
        syncing: syncing,
      }}
    >
      {review ? (
        reviewPanel()
      ) : activeTab === "receive" ? (
        <StellarReceiveTab
          account={wallet.wallet?.address ?? ""}
          privateAddress={summary?.address ?? ""}
          unlocked={!!summary}
          unavailableMessage={
            !wallet.wallet
              ? "Connect Freighter to receive private payments."
              : preparationError ||
                (ready
                  ? "Approve the unlock in Freighter to show your receiving address."
                  : `${preparationStage || "Preparing private wallet..."} ${preparationSeconds}s`)
          }
          directory={directory}
          busy={busy}
          onActivate={activateReceiving}
          onCopyAccount={copyAccount}
          onCopyPrivateAddress={copy}
        />
      ) : activeTab === "withdraw" ? (
        withdrawPanel
      ) : activeTab === "swap" ? (
        <BaseSwapTab
          enabled={false}
          chainLabel="Stellar Testnet"
          tokens={[XLM]}
          inputToken={XLM}
          outputToken={XLM}
          setInputToken={noop}
          setOutputToken={noop}
          amount=""
          setAmount={noop}
          slippageBps="0"
          setSlippageBps={noop}
          inputPrivateBalance={
            summary?.authenticated ? formatXlm(summary.available) : "0"
          }
          quote={null}
          quoteLoading={false}
          quoteError="Private swaps are unavailable: the current Stellar contract has no compatible private swap settlement."
          loading={false}
          connected={true}
          spendingKeysReady={false}
          onSwap={noop}
        />
      ) : activeTab === "send" ? (
        <BaseSendTab
          recipientCheck={{
            valid: !recipientProblem && !!recipient.trim(),
            error: recipientProblem,
            message:
              recipientProblem ??
              (StrKey.isValidEd25519PublicKey(recipient.trim())
                ? "This G-address is resolved to the recipient's signed private receiving keys before proof generation. It is never sent as a public payment."
                : "The receiving address and its network are verified before proof generation."),
            retry: noop,
          }}
          canUseBatchWithdraw={false}
          sendTokenOptions={[XLM]}
          selectedSendToken={XLM}
          setSelectedSendToken={noop}
          sendBatchMode={false}
          setSendBatchMode={noop}
          batchFileInputRef={batchFileInputRef}
          handleBatchFileUpload={noop}
          sendBatchRows={[]}
          setSendBatchRows={noop}
          setSendRecipient={setRecipient}
          setSendAmount={setAmount}
          sendRecipient={recipient}
          sendAmount={amount}
          enterBatchMode={noop}
          activeSendToken={XLM}
          sendPrivateBalanceDisplay={available}
          spendablePrivateBalance={BigInt(summary?.available ?? "0")}
          sendMemo=""
          setSendMemo={noop}
          sendFeesApply={false}
          protocolFeeBps={0}
          partnerFeeBps={0}
          batchSendProtocolFee={0}
          sendProtocolFee={0.01}
          batchSendPartnerFee={0}
          sendPartnerFee={0}
          loading={busy}
          sendProgress={progressText}
          connected={!!wallet.wallet}
          isComplianceBlocked={false}
          isComplianceChecking={false}
          onSend={() => prepareSend()}
          chainAdapter={{
            recipientHint:
              "Enter the recipient's G-address (they must have activated private receiving) or their stv3 private address. Stellar screening coverage is unverified.",
            recipientPlaceholder: "G-address or stv3 private address",
            validation: amountValidation({
              amount,
              decimals: 7,
              symbol: "XLM",
              privateBalance: true,
              balance: sendBalance,
              feePending:
                (summary?.state?.nextSlot ?? 0) > pin.capacity - 5
                  ? "This pool has no settlement capacity. Select the current pool in Settings."
                  : null,
            }),
            feeSummary: (
              <>
                <p>Available private balance: {available} XLM</p>
                <WalletFeeSummary
                  rows={[
                    { label: "Protocol fee", value: "0.01 XLM" },
                    {
                      label: "Network fee",
                      value:
                        "Estimated before confirmation; paid separately by the Testnet relayer",
                    },
                  ]}
                />
              </>
            ),
            onMax: () =>
              setAmount(
                BigInt(summary?.available ?? "0") > 100000n
                  ? formatXlm(BigInt(summary?.available ?? "0") - 100000n)
                  : "0",
              ),
            continueLabel: "Review private send",
          }}
        />
      ) : (
        <section aria-label="Add funds">
          <label htmlFor="stellar-token">Token</label>
          <select id="stellar-token" style={styles.input} value="XLM" disabled>
            <option>XLM</option>
          </select>
          <label htmlFor="stellar-amount">Amount</label>
          <WalletAmountInput
            id="stellar-amount"
            value={amount}
            disabled={!wallet.wallet || busy}
            onChange={(e) => setAmount(e.target.value)}
            maxDisabled={true}
            onMax={() => {
              const value = BigInt(summary?.available ?? "0") - 100000n;
              setAmount(value > 0n ? formatXlm(value) : "0");
            }}
          />
          <p className="wallet-review-context">
            Available {`public: ${wallet.wallet?.balance ?? "Unavailable"}`} XLM
          </p>
          <WalletFeeSummary
            rows={[
              {
                label: "Protocol fee",
                value: "0 XLM",
              },
              {
                label: "Network fee",
                value:
                  "Estimated before confirmation; separate from the protocol fee",
              },
            ]}
          />
          {activeTab === "shield" && (
            <p className="wallet-review-context">
              The deposit amount and public account are visible on Stellar.
              Maximum deposit: 100 Testnet XLM.
            </p>
          )}
          <button
            className="wallet-primary"
            disabled={
              (!summary ? !ready || busy : !canAdd) ||
              !amount ||
              (summary?.state?.nextSlot ?? 0) > pin.capacity - 21
            }
            onClick={() => (summary ? prepareDeposit() : open())}
          >
            {summary ? "Review deposit" : "Unlock to review deposit"}
          </button>
          {summary?.pending && (
            <button
              className="wallet-secondary"
              disabled={busy}
              onClick={resumeReview}
            >
              Review pending payment
            </button>
          )}
        </section>
      )}
    </BaseWalletShell>
  );
}
