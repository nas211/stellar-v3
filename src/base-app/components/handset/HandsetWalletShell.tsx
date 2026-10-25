import { formatDisplayAmount } from "../../helpers/amountDisplay";
import React, { useEffect, useMemo, useState } from "react";
import { AssetIcon } from "../../../components/AssetIcon";
import type { BaseTabType } from "../../types";
import { marketFigure, rowUsdValue } from "../../../utils/market-prices";
import { useMarketChart } from "../../../app-shell/useMarketChart";
import { useWalletNetwork } from "../../../networks/WalletNetworkContext";
import { BaseSettingsMenu } from "../BaseSettingsMenu";
import { BaseWalletIcon } from "../BaseWalletIcon";
import type { PrivateBalanceRow } from "../BasePrivateBalancesCard";
import {
  HideTotalSetting,
  NetworkPicker,
  OperationCompletion,
  WalletDetails,
} from "../walletShellSections";
import type {
  WalletPortfolio,
  WalletShellProps,
  WalletShellState,
} from "../walletShellTypes";
import { HandsetChart } from "./HandsetChart";
import {
  formatChange,
  formatUsd,
  marketEntries,
  portfolioChange,
  rowMarketId,
  rowMeta,
  type AssetMeta,
} from "./handsetAssets";
import markSrc from "./stealthos-mark.png";
import wordmarkSrc from "./stealthos-wordmark.png";
import "./handset.css";

type Screen = "home" | "markets" | "history" | "settings";
type AssetClass = "crypto" | "stocks";
type IconName = React.ComponentProps<typeof BaseWalletIcon>["name"];

const TILES: { tab: BaseTabType; label: string; icon: IconName }[] = [
  { tab: "shield", label: "Add", icon: "deposit" },
  { tab: "swap", label: "Swap", icon: "swap" },
  { tab: "send", label: "Send", icon: "send" },
  { tab: "receive", label: "Receive", icon: "receive" },
  { tab: "withdraw", label: "Withdraw", icon: "withdraw" },
];
const TILE_TABS = TILES.map((tile) => tile.tab);
// Operations without a tile live in the menu.
const MENU_OPERATIONS: Partial<
  Record<BaseTabType, { icon: IconName; detail: string }>
> = {
  crosschain: {
    icon: "network",
    detail: "Move funds privately to another network",
  },
  perps: { icon: "markets", detail: "Private perpetual futures" },
};
const SCREENS: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: "home", label: "Home", icon: "home" },
  { screen: "markets", label: "Markets", icon: "markets" },
  { screen: "history", label: "History", icon: "history" },
  { screen: "settings", label: "Settings", icon: "settings" },
];
const CLASS_LABELS: Record<AssetClass, string> = {
  crypto: "Crypto",
  stocks: "Stocks",
};
const COMING_SOON: Record<
  Exclude<AssetClass, "crypto">,
  { title: string; detail: string }
> = {
  stocks: {
    title: "Tokenized stocks are coming soon",
    detail: "Private trading of tokenized equities isn't available yet.",
  },
};

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function changeClass(change: number) {
  return change >= 0 ? "up" : "dn";
}

function TokenIcon({ meta, small }: { meta: AssetMeta; small?: boolean }) {
  return (
    <AssetIcon
      marketId={meta.marketId}
      iconId={meta.iconId}
      symbol={meta.symbol}
      size={small ? 34 : 42}
    />
  );
}

function ComingSoon({
  assetClass,
}: {
  assetClass: Exclude<AssetClass, "crypto">;
}) {
  const copy = COMING_SOON[assetClass];
  return (
    <div className="handset-soon" role="status">
      <span className="handset-soon-icon">
        <BaseWalletIcon name="markets" />
      </span>
      <strong>{copy.title}</strong>
      <small>{copy.detail}</small>
    </div>
  );
}

function AssetRow({
  row,
  portfolio,
  onSelect,
}: {
  row: PrivateBalanceRow;
  portfolio: WalletPortfolio;
  onSelect?: () => void;
}) {
  const meta = rowMeta(row, portfolio.markets);
  const price = row.isNft
    ? undefined
    : marketFigure(portfolio.prices, row.mint);
  const change = row.isNft
    ? undefined
    : marketFigure(portfolio.changes, row.mint);
  const value = rowUsdValue(row, portfolio.prices);
  const content = (
    <>
      <TokenIcon meta={meta} />
      <span className="handset-tok-mid">
        <span className="handset-tok-name">
          {meta.name}
          {row.badge && <span className="handset-tag">{row.badge}</span>}
          <span className="handset-tag">private</span>
        </span>
        <span className="handset-tok-sub">
          {row.isNft ? (
            "NFT"
          ) : price === undefined ? (
            <span className="handset-nodata">Price unavailable</span>
          ) : (
            <>
              {formatUsd(price)}
              {change !== undefined && (
                <>
                  {" · "}
                  <span className={changeClass(change)}>
                    {formatChange(change)}
                  </span>
                </>
              )}
            </>
          )}
        </span>
      </span>
      <span className="handset-tok-rt">
        <span className="v">{value === null ? "—" : formatUsd(value)}</span>
        <span className="q" title={`${row.amount} ${row.symbol}`}>
          {formatDisplayAmount(row.amount)} {row.symbol}
        </span>
        {row.pendingAmount && (
          <span className="q">
            + {formatDisplayAmount(row.pendingAmount)} awaiting finality
          </span>
        )}
      </span>
    </>
  );
  return onSelect ? (
    <button type="button" className="handset-tok" onClick={onSelect}>
      {content}
    </button>
  ) : (
    <div className="handset-tok">{content}</div>
  );
}

/**
 * The wallet: the StealthOS handset design over the shell state, operations
 * and data from BaseWalletShell. Full width on phones, a centered column on
 * wider screens (handset.css).
 */
export function HandsetWalletShell(
  props: WalletShellProps & { shell: WalletShellState },
) {
  const { shell, portfolio } = props;
  const { view, setView } = shell;
  const [screen, setScreen] = useState<Screen>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  // The app's network by name, never the connected wallet's chain number.
  const networkLabel = useWalletNetwork()?.network.label ?? props.chainLabel;
  const [assetFilter, setAssetFilter] = useState<AssetClass | "all">("all");
  const [marketClass, setMarketClass] = useState<AssetClass>("crypto");
  const [marketId, setMarketId] = useState<string | null>(null);
  const markets = useMemo(
    () => (portfolio ? marketEntries(portfolio) : []),
    [portfolio],
  );
  const market =
    markets.find((entry) => entry.id === marketId) ?? markets[0] ?? null;
  const chart = useMarketChart(
    props.connected &&
      !view &&
      screen === "markets" &&
      marketClass === "crypto" &&
      market
      ? market.id
      : null,
  );

  // Settings is a screen, not a dialog.
  useEffect(() => {
    if (view === "account") {
      setScreen("settings");
      setView(null);
    }
  }, [view, setView]);
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [screen, view]);
  const back = () => {
    if (view === "operation" && props.reviewing && !props.busy)
      props.onBackFromReview();
    else if (view) setView(null);
    else setScreen("home");
  };
  // Escape closes a pop-up or the menu first, then steps back.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (networkOpen) setNetworkOpen(false);
      else if (menuOpen) setMenuOpen(false);
      else if (view) back();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const go = (next: Screen) => {
    setMenuOpen(false);
    if (view) setView(null);
    setScreen(next);
  };
  const operate = (tab: BaseTabType) => {
    setMenuOpen(false);
    shell.openOperation(tab);
  };
  const tabIds = new Set(props.tabs.map((tab) => tab.id));
  const available = (tab: BaseTabType) =>
    tabIds.has(tab) && !props.disabledActions?.[tab];
  const blocked = (tab: BaseTabType) =>
    (props.busy && props.activeTab !== tab) ||
    (!!props.previousPoolMode && tab !== "send");
  const tiles = TILES.filter((tile) => available(tile.tab));
  const menuOperations = props.tabs.filter(
    (tab) => !TILE_TABS.includes(tab.id) && available(tab.id),
  );

  const viewSection = (
    <section className="handset-view" hidden={!view} aria-label={shell.title}>
      <div className="handset-vhead">
        <button
          type="button"
          className="handset-back"
          aria-label="Back"
          onClick={back}
        >
          <BaseWalletIcon name="back" />
        </button>
        <h2>{shell.title}</h2>
      </div>
      <div className="handset-pad">
        {view &&
          (view !== "complete" || props.status?.type === "error") &&
          shell.notice}
        {view === "operation" && props.authNotice}
        <div hidden={view !== "operation"} className="wallet-operation">
          {props.children}
        </div>
        {view === "wallet" && (
          <WalletDetails
            walletAddress={props.walletAddress}
            chainLabel={props.chainLabel}
            busy={props.busy}
            onDisconnect={() => {
              setView(null);
              props.onWallet();
            }}
          />
        )}
        {view === "network" && (
          <NetworkPicker
            chainLabel={networkLabel}
            busy={props.busy}
            onKeep={() => setView(null)}
            onSwitched={() => setView(null)}
          />
        )}
        {view === "preferences" && (
          <HideTotalSetting
            hideTotal={shell.hideTotal}
            onChange={shell.setHideTotal}
          />
        )}
        <div hidden={view !== "handle"}>{props.handle}</div>
        {/* Leaving backup must remove revealed recovery words from the DOM. */}
        {view === "recovery" && <div>{props.recovery}</div>}
        {view === "complete" && (
          <OperationCompletion
            completion={shell.completion}
            link={shell.completionLink}
            onDone={() => setView(null)}
          />
        )}
      </div>
    </section>
  );

  // The network list in a pop-up, styled like the wallet picker.
  const networkModal = networkOpen && (
    <div
      className="handset-modal"
      role="presentation"
      onClick={() => setNetworkOpen(false)}
    >
      <div
        className="handset-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="handset-network-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="handset-modal-head">
          <h3 id="handset-network-title">Select network</h3>
          <button
            type="button"
            className="handset-modal-close"
            aria-label="Close"
            onClick={() => setNetworkOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="handset-network-list">
          <NetworkPicker
            chainLabel={networkLabel}
            busy={props.busy}
            onKeep={() => setNetworkOpen(false)}
            onSwitched={() => setNetworkOpen(false)}
          />
        </div>
      </div>
    </div>
  );

  if (!props.connected)
    return (
      <main className="handset handset-locked">
        {viewSection}
        {networkModal}
        <div className="handset-lock" hidden={!!view}>
          <img className="handset-lock-mark" src={markSrc} alt="" />
          <img
            className="handset-lock-word"
            src={wordmarkSrc}
            alt="StealthOS"
          />
          <p className="handset-lock-sub">Private wallet</p>
          {shell.notice}
          <button
            type="button"
            className="handset-lock-btn"
            disabled={props.busy}
            onClick={props.onWallet}
          >
            {props.connectLabel ?? "Connect wallet"}
          </button>
          <button
            type="button"
            className="handset-lock-network"
            onClick={() => setNetworkOpen(true)}
          >
            <BaseWalletIcon name="network" />
            {networkLabel}
          </button>
        </div>
      </main>
    );

  const change =
    portfolio &&
    props.balancesReady &&
    !props.balanceUnavailable &&
    !shell.hideTotal
      ? portfolioChange(portfolio)
      : null;
  const total = props.balanceUnavailable
    ? "—"
    : shell.hideTotal
      ? "••••"
      : props.balancesReady
        ? (props.nativeBalance ??
          (props.balanceUsd == null
            ? "—"
            : props.balanceUsd.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })))
        : "$0";
  const caption = props.privateWalletStatus
    ? props.privateWalletStatus.state === "ready"
      ? `${props.balanceCaption} | Ready`
      : props.privateWalletStatus.label
    : props.balanceUnavailable
      ? "Sign in to load your private balance"
      : !props.balancesReady
        ? "Loading private balances…"
        : shell.hideTotal
          ? null
          : props.balanceCaption;
  const rows = portfolio?.rows ?? [];
  const assets =
    assetFilter === "stocks" ? (
      <ComingSoon assetClass="stocks" />
    ) : !portfolio ? (
      props.assets
    ) : !rows.length ? (
      <div className="handset-empty">
        {props.privateWalletStatus
          ? props.privateWalletStatus.description
          : props.balanceUnavailable
            ? "Sign in to see your private assets."
            : portfolio.syncing
              ? "Loading private balances…"
              : "No private assets yet. Add funds to get started."}
      </div>
    ) : (
      rows.map((row) => {
        const id = rowMarketId(row, portfolio.markets);
        return (
          <AssetRow
            key={row.id}
            row={row}
            portfolio={portfolio}
            onSelect={
              id && markets.some((entry) => entry.id === id)
                ? () => {
                    setMarketId(id);
                    setMarketClass("crypto");
                    go("markets");
                  }
                : undefined
            }
          />
        );
      })
    );
  const running = props.busy && !shell.sendComplete && (
    <div className="handset-running" role="status">
      <span>{shell.label} in progress</span>
      <button type="button" onClick={() => setView("operation")}>
        View progress
      </button>
    </div>
  );

  const home = (
    <>
      {shell.notice}
      <section className="handset-bal" aria-label="Private balance">
        {props.previousPoolMode && (
          <p className="handset-prev">
            Previous balance · Withdraw remaining funds to your public wallet.
          </p>
        )}
        <div className={`handset-big${total === "—" ? " none" : ""}`}>
          {total}
        </div>
        {caption && (
          <div className="handset-delta">
            {change !== null && (
              <span className={changeClass(change)}>
                {formatChange(change)}
              </span>
            )}
            <span className="sub">
              {change !== null ? "today · " : ""}
              {caption}
            </span>
          </div>
        )}
        <div className="handset-caption">
          {networkLabel}
          {props.balancesReady &&
            !props.balanceUnavailable &&
            !shell.hideTotal &&
            props.priceCaption &&
            ` · ${props.priceCaption}`}
        </div>
      </section>
      <nav
        className="handset-tiles"
        aria-label="Wallet actions"
        style={{ gridTemplateColumns: `repeat(${tiles.length}, 1fr)` }}
      >
        {tiles.map((tile) => (
          <button
            key={tile.tab}
            type="button"
            className={`handset-tile${tile.tab === "shield" ? " handset-tile-add" : ""}`}
            disabled={blocked(tile.tab)}
            onClick={() => operate(tile.tab)}
          >
            <BaseWalletIcon name={tile.icon} />
            <span>{tile.label}</span>
          </button>
        ))}
      </nav>
      {running}
      {props.authNotice && (
        <div className="handset-auth">{props.authNotice}</div>
      )}
      <div
        className="handset-sect handset-assets-head"
        role="tablist"
        aria-label="Assets"
      >
        {(["all", "crypto", "stocks"] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={assetFilter === filter}
            className="handset-tabtext"
            onClick={() => setAssetFilter(filter)}
          >
            {filter === "all" ? "All assets" : CLASS_LABELS[filter]}
          </button>
        ))}
      </div>
      <div className="handset-assets">{assets}</div>
    </>
  );

  const marketsScreen = (
    <div className="handset-pad">
      <div className="handset-seg" role="tablist" aria-label="Asset class">
        {(["crypto", "stocks"] as const).map((assetClass) => (
          <button
            key={assetClass}
            type="button"
            role="tab"
            aria-selected={marketClass === assetClass}
            className={marketClass === assetClass ? "on" : ""}
            onClick={() => setMarketClass(assetClass)}
          >
            {CLASS_LABELS[assetClass]}
          </button>
        ))}
      </div>
      {marketClass !== "crypto" ? (
        <ComingSoon assetClass={marketClass} />
      ) : !market ? (
        <div className="handset-empty">
          No market prices for {networkLabel}.
        </div>
      ) : (
        <>
          <div className="handset-chartcard">
            <div className="handset-ctitle">
              {market.name} <span className="csym">{market.symbol}</span>
            </div>
            <div
              className={`handset-cprice${market.price === null ? " none" : ""}`}
            >
              {market.price === null
                ? "Price unavailable"
                : formatUsd(market.price)}
              {market.change !== null && (
                <span className={`cchg ${changeClass(market.change)}`}>
                  {formatChange(market.change)}
                </span>
              )}
            </div>
            {chart.status === "ready" ? (
              <>
                <HandsetChart
                  points={chart.points}
                  label={`${market.name} price over the last 24 hours`}
                />
                <div className="handset-crange">24 hours · live</div>
              </>
            ) : chart.status === "error" ? (
              <div className="handset-chartempty">
                <span>Chart unavailable</span>
                <button
                  type="button"
                  className="wallet-secondary"
                  onClick={chart.retry}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="handset-chartempty">Loading chart…</div>
            )}
          </div>
          <div className="handset-sect handset-flush">Prices</div>
          {markets.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`handset-prow${entry.id === market.id ? " on" : ""}`}
              aria-pressed={entry.id === market.id}
              onClick={() => setMarketId(entry.id)}
            >
              <TokenIcon meta={entry} small />
              <span className="mid">
                <span className="t1">{entry.symbol}</span>
                <span className="t2">{entry.name}</span>
              </span>
              <span className="rt">
                <span className="v">
                  {entry.price === null ? "—" : formatUsd(entry.price)}
                </span>
                {entry.change !== null && (
                  <span className={`q ${changeClass(entry.change)}`}>
                    {formatChange(entry.change)}
                  </span>
                )}
              </span>
            </button>
          ))}
          <p className="handset-hint">Reference prices from CoinGecko.</p>
        </>
      )}
    </div>
  );

  const settingsScreen = (
    <div className="handset-pad">
      <BaseSettingsMenu
        connected={props.connected}
        walletAddress={props.walletAddress}
        claimedHandle={props.claimedHandle}
        chainLabel={networkLabel}
        handlesAvailable={props.handlesAvailable}
        canCopyHandle={props.canCopyHandle}
        onCopyHandle={props.onCopyHandle}
        onHandle={() => setView("handle")}
        onWallet={() => setView("wallet")}
        onPreferences={() => setView("preferences")}
        onNetwork={() => setNetworkOpen(true)}
        onRecovery={props.recovery ? () => setView("recovery") : undefined}
      />
    </div>
  );

  return (
    <main className="handset">
      <header className="handset-appbar">
        <button
          type="button"
          className="handset-acct"
          aria-label="Open settings"
          onClick={() => go("settings")}
        >
          <span className="handset-avatar">
            <BaseWalletIcon name="profile" />
          </span>
          <span className="handset-acct-name">
            {props.claimedHandle || shortAddress(props.walletAddress)}
            {props.privateWalletStatus && (
              <small
                aria-label="Private wallet status"
                data-wallet-state={props.privateWalletStatus.state}
                style={{ display: "block", fontSize: 11, fontWeight: 400 }}
              >
                {props.privateWalletStatus.label}
              </small>
            )}
          </span>
          <span className="handset-acct-chevron">
            <BaseWalletIcon name="chevron" />
          </span>
        </button>
        <span className="handset-spacer" />
        <button
          type="button"
          className={`handset-ibtn${props.refreshing ? " handset-spin" : ""}`}
          aria-label="Refresh balances"
          disabled={!props.canRefresh || props.refreshing || props.busy}
          onClick={props.onRefresh}
        >
          <BaseWalletIcon name="refresh" />
        </button>
        <button
          type="button"
          className="handset-ibtn"
          aria-label="History"
          onClick={() => go("history")}
        >
          <BaseWalletIcon name="history" />
        </button>
        <button
          type="button"
          className="handset-ibtn"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <BaseWalletIcon name="menu" />
        </button>
      </header>
      {viewSection}
      <div className="handset-screen" hidden={!!view}>
        {screen === "home" ? (
          home
        ) : (
          <>
            <div className="handset-vhead">
              <button
                type="button"
                className="handset-back"
                aria-label="Back"
                onClick={back}
              >
                <BaseWalletIcon name="back" />
              </button>
              <h2>{SCREENS.find((entry) => entry.screen === screen)!.label}</h2>
            </div>
            {running}
            {screen === "markets" && marketsScreen}
            {screen === "history" && (
              <div className="handset-pad">{props.history}</div>
            )}
            {screen === "settings" && settingsScreen}
          </>
        )}
      </div>
      <nav className="handset-tabbar" aria-label="Main">
        {SCREENS.map((entry, index) => (
          <React.Fragment key={entry.screen}>
            {index === 2 && <span className="handset-tb-gap" />}
            <button
              type="button"
              className={`handset-tb${!view && screen === entry.screen ? " on" : ""}`}
              aria-current={
                !view && screen === entry.screen ? "page" : undefined
              }
              onClick={() => go(entry.screen)}
            >
              <BaseWalletIcon name={entry.icon} />
              <span>{entry.label}</span>
            </button>
          </React.Fragment>
        ))}
        {available("shield") && (
          <button
            type="button"
            className="handset-fab"
            aria-label="Add funds"
            disabled={blocked("shield")}
            onClick={() => operate("shield")}
          >
            <BaseWalletIcon name="deposit" />
          </button>
        )}
      </nav>
      {menuOpen && (
        <div className="handset-drawer">
          <div className="handset-scrim" onClick={() => setMenuOpen(false)} />
          <nav className="handset-sheet" aria-label="Main menu">
            <div className="handset-sheet-head">
              <span className="handset-avatar">
                <BaseWalletIcon name="profile" />
              </span>
              <span className="handset-sheet-id">
                <strong>{props.claimedHandle || "Your wallet"}</strong>
                <small>{shortAddress(props.walletAddress)}</small>
              </span>
              <button
                type="button"
                className="handset-ibtn"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <BaseWalletIcon name="close" />
              </button>
            </div>
            {menuOperations.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className="handset-sheet-row"
                disabled={blocked(tab.id)}
                onClick={() => operate(tab.id)}
              >
                <span className="ic">
                  <BaseWalletIcon
                    name={MENU_OPERATIONS[tab.id]?.icon ?? "network"}
                  />
                </span>
                <span className="lbl">
                  <strong>{tab.label}</strong>
                  {MENU_OPERATIONS[tab.id] && (
                    <small>{MENU_OPERATIONS[tab.id]!.detail}</small>
                  )}
                </span>
              </button>
            ))}
            {props.recovery && (
              <button
                type="button"
                className="handset-sheet-row"
                onClick={() => {
                  setMenuOpen(false);
                  setView("recovery");
                }}
              >
                <span className="ic">
                  <BaseWalletIcon name="key" />
                </span>
                <span className="lbl">
                  <strong>Recovery & backup</strong>
                  <small>Restore and reconcile private notes</small>
                </span>
              </button>
            )}
            <button
              type="button"
              className="handset-sheet-row"
              onClick={() => {
                setMenuOpen(false);
                setNetworkOpen(true);
              }}
            >
              <span className="ic">
                <BaseWalletIcon name="network" />
              </span>
              <span className="lbl">
                <strong>Network</strong>
                <small>{networkLabel}</small>
              </span>
            </button>
            <button
              type="button"
              className="handset-sheet-row"
              onClick={() => go("settings")}
            >
              <span className="ic">
                <BaseWalletIcon name="settings" />
              </span>
              <span className="lbl">
                <strong>Settings</strong>
                <small>Handle, wallet and preferences</small>
              </span>
            </button>
            <a className="handset-sheet-row" href="/">
              <span className="ic">
                <BaseWalletIcon name="home" />
              </span>
              <span className="lbl">
                <strong>Back to Home</strong>
                <small>The StealthOS website</small>
              </span>
            </a>
            <button
              type="button"
              className="handset-sheet-row danger"
              disabled={props.busy}
              onClick={() => {
                setMenuOpen(false);
                props.onWallet();
              }}
            >
              <span className="ic">
                <BaseWalletIcon name="logout" />
              </span>
              <span className="lbl">
                <strong>Disconnect</strong>
                <small>Disconnect this wallet</small>
              </span>
            </button>
          </nav>
        </div>
      )}
      {networkModal}
    </main>
  );
}
