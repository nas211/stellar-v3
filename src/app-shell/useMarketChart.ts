/** No remote market feed is requested by the presentation layer. */
export function useMarketChart(_marketId: string | null): {
  status: "ready" | "error" | "loading";
  points: number[];
  retry: () => void;
} {
  return { status: "error", points: [], retry: () => {} };
}
