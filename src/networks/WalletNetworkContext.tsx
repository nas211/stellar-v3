/** The source release presents the Stellar network only. */
export function useWalletNetwork() {
  return {
    network: { key: "stellar", label: "Stellar Testnet" },
    networks: [{ key: "stellar", label: "Stellar Testnet", enabled: true, disabledReason: undefined }],
    blocked: false,
    selectNetwork: (key: string) => key === "stellar",
  };
}
