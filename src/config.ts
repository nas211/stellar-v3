/** Presentation metadata used by the shared token selector. */
export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  isNative?: boolean;
  tokenType?: "erc20" | "erc721" | "erc1155";
}
