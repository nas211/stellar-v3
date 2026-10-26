import { Networks, StrKey } from "@stellar/stellar-sdk";

export interface WalletPort {
  isConnected(): Promise<{ isConnected: boolean; error?: unknown }>;
  requestAccess(): Promise<{ address?: string; error?: unknown }>;
  getAddress(): Promise<{ address?: string; error?: unknown }>;
  getNetworkDetails(): Promise<{ networkPassphrase?: string; error?: unknown }>;
}
export interface WalletView {
  address: string;
  balance: string | null;
  balanceError?: string;
}
export type BalanceLoader = (address: string) => Promise<string>;

/** Local connection state only. Freighter retains control of permissions and signing. */
export class TestnetWallet {
  private generation = 0;
  private current: WalletView | null = null;
  constructor(
    private port: WalletPort,
    private loadBalance: BalanceLoader,
  ) {}
  get snapshot(): WalletView | null {
    return this.current ? { ...this.current } : null;
  }
  disconnect(): void {
    this.generation++;
    this.current = null;
  }
  async connect(): Promise<WalletView | null> {
    const generation = ++this.generation;
    this.current = null;
    const available = await this.port.isConnected();
    if (available.error || !available.isConnected)
      throw new Error(
        "Freighter is unavailable. Install or unlock the extension, then try again.",
      );
    const access = await this.port.requestAccess();
    return this.complete(access, generation);
  }
  async refresh(): Promise<WalletView | null> {
    if (!this.current) return null;
    const generation = ++this.generation;
    try {
      return await this.complete(await this.port.getAddress(), generation);
    } catch (error) {
      if (generation === this.generation) this.current = null;
      throw error;
    }
  }
  private async complete(
    access: { address?: string; error?: unknown },
    generation: number,
  ): Promise<WalletView | null> {
    if (
      access.error ||
      !access.address ||
      !StrKey.isValidEd25519PublicKey(access.address)
    )
      throw new Error(
        "Freighter access was declined or the account address is invalid.",
      );
    const network = await this.port.getNetworkDetails();
    if (network.error || network.networkPassphrase !== Networks.TESTNET)
      throw new Error("Switch Freighter to Stellar Testnet, then reconnect.");
    const view: WalletView = { address: access.address, balance: null };
    try {
      const balance = await this.loadBalance(access.address);
      if (!/^\d+(?:\.\d{1,7})?$/.test(balance))
        throw new Error("Invalid balance response");
      view.balance = balance;
    } catch {
      view.balanceError =
        "Public balance unavailable. The Testnet account may not be funded, or Horizon may be offline.";
    }
    if (generation !== this.generation) return null;
    this.current = view;
    return { ...view };
  }
}

export function walletExplorer(address: string): string {
  if (!StrKey.isValidEd25519PublicKey(address))
    throw new Error("Invalid Stellar account");
  return `https://stellar.expert/explorer/testnet/account/${encodeURIComponent(address)}`;
}
