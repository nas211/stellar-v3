/**
 * Styled components / CSS-in-JS styles
 * Color palette aligned with landing page dark theme
 */
import type { CSSProperties } from "react";

// ── Palette tokens ──────────────────────────────────────────────────────────
const BG_BASE = "var(--wallet-page-background, #04040a)";
const BG_CARD = "var(--wallet-card-background, rgba(10, 12, 22, 0.92))";
const BG_INPUT = "var(--wallet-input-background, rgba(255, 255, 255, 0.04))";
const BORDER = "var(--wallet-border, rgba(255, 255, 255, 0.08))";
const BORDER_FOCUS = "var(--wallet-focus-border, rgba(255, 255, 255, 0.22))";
const TEXT_PRIMARY = "var(--wallet-text, #e8eeff)";
const TEXT_MUTED = "var(--wallet-muted, #b0c4de)";
const TEXT_DIM = "#4a5e82";
const ACCENT_GREEN = "#e8eeff";
const ACCENT_AMBER = "#f59e0b";
const ACCENT_BLUE = "#60a5fa";
const ACCENT_RED = "#ef4444";

export const styles: Record<string, CSSProperties> = {
  app: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "48px 32px 80px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
    minHeight: "100vh",
    background: "transparent",
    color: TEXT_PRIMARY,
  },
  header: {
    textAlign: "left" as const,
    marginBottom: "32px",
    padding: "0 0 20px",
    borderBottom: `1px solid ${BORDER}`,
  },
  logo: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: TEXT_PRIMARY,
    marginBottom: "10px",
  },
  logoImage: {
    display: "block",
    height: "56px",
    width: "auto",
    margin: "0 auto 10px",
  },
  subtitle: {
    color: TEXT_MUTED,
    fontSize: "1.1rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "20px",
    marginTop: "24px",
  },
  card: {
    background: BG_CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: "16px",
    padding: "24px",
    backdropFilter: "blur(8px)",
    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35)",
  },
  cardTitle: {
    fontSize: "1.05rem",
    fontWeight: 600,
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: TEXT_PRIMARY,
  },
  button: {
    padding: "12px 16px",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    width: "100%",
  },
  primaryButton: {
    background: "#f0f4ff",
    color: "#06060f",
    border: "none",
    boxShadow: "0 4px 14px rgba(255,255,255,0.08)",
  },
  secondaryButton: {
    background: "transparent",
    color: TEXT_PRIMARY,
    border: `1px solid ${BORDER_FOCUS}`,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    background: BG_INPUT,
    border: `1px solid ${BORDER}`,
    borderRadius: "12px",
    color: TEXT_PRIMARY,
    fontSize: "14px",
    marginBottom: "12px",
    boxSizing: "border-box" as const,
    outline: "none",
  },
  label: {
    display: "block",
    color: TEXT_MUTED,
    fontSize: "12px",
    marginBottom: "6px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  },
  balance: {
    textAlign: "center" as const,
    padding: "30px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "14px",
    marginBottom: "20px",
    border: `1px solid ${BORDER}`,
  },
  balanceValue: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: TEXT_PRIMARY,
  },
  status: {
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px",
  },
  statusSuccess: {
    background: "rgba(255,255,255,0.05)",
    color: "#e8eeff",
    border: `1px solid rgba(16, 185, 129, 0.25)`,
  },
  statusError: {
    background: "rgba(239, 68, 68, 0.12)",
    color: ACCENT_RED,
    border: `1px solid rgba(239, 68, 68, 0.25)`,
  },
  statusInfo: {
    background: "rgba(255, 255, 255, 0.05)",
    color: TEXT_MUTED,
    border: `1px solid ${BORDER}`,
  },
  log: {
    background: "rgba(4, 4, 10, 0.7)",
    borderRadius: "12px",
    padding: "16px",
    maxHeight: "200px",
    overflowY: "auto" as const,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "13px",
    border: `1px solid ${BORDER}`,
  },
  logEntry: {
    padding: "6px 0",
    borderBottom: `1px solid rgba(255,255,255,0.05)`,
  },
  txRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    marginLeft: "8px",
  },
  txHashButton: {
    padding: "2px 6px",
    borderRadius: "6px",
    border: `1px solid ${BORDER_FOCUS}`,
    background: "rgba(255,255,255,0.06)",
    color: TEXT_PRIMARY,
    cursor: "pointer",
    fontSize: "11px",
  },
  txExternalButton: {
    padding: "2px 4px",
    borderRadius: "6px",
    border: `1px solid ${BORDER_FOCUS}`,
    background: "rgba(255,255,255,0.06)",
    color: ACCENT_BLUE,
    cursor: "pointer",
    fontSize: "11px",
  },
  stealthAddress: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    color: "#e8eeff",
    wordBreak: "break-all" as const,
    background: "rgba(255,255,255,0.04)",
    padding: "8px 12px",
    borderRadius: "6px",
    marginTop: "8px",
    border: "rgba(16,185,129,0.2)",
  },
  tabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "20px",
    flexWrap: "wrap" as const,
  },
  tab: {
    padding: "8px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    transition: "all 0.2s",
    border: `1px solid ${BORDER}`,
    background: "transparent",
    color: TEXT_MUTED,
  },
  tabActive: {
    background: "rgba(255,255,255,0.1)",
    color: TEXT_PRIMARY,
    borderColor: BORDER_FOCUS,
  },
  tabInactive: {
    background: "transparent",
    color: TEXT_MUTED,
    border: `1px solid ${BORDER}`,
  },
  paymentApp: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
    background: BG_BASE,
    color: TEXT_PRIMARY,
  },
  paymentHeader: {
    textAlign: "center" as const,
    marginBottom: "18px",
  },
  paymentTitle: {
    fontSize: "1.6rem",
    fontWeight: 700,
    marginBottom: "6px",
    color: TEXT_PRIMARY,
  },
  paymentSubtitle: {
    color: TEXT_MUTED,
  },
  paymentCard: {
    width: "100%",
    maxWidth: "440px",
    background: BG_CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.45)",
    backdropFilter: "blur(10px)",
  },
  paymentButton: {
    background: "#f0f4ff",
    color: "#06060f",
    borderRadius: "8px",
    border: "none",
    boxShadow: "0 4px 14px rgba(255,255,255,0.08)",
  },
  paymentInput: {
    width: "100%",
    padding: "12px 14px",
    background: BG_INPUT,
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    color: TEXT_PRIMARY,
    fontSize: "16px",
    marginBottom: "12px",
    boxSizing: "border-box" as const,
  },
  paymentLabel: {
    display: "block",
    color: TEXT_MUTED,
    fontSize: "13px",
    marginBottom: "6px",
    fontWeight: 500,
  },
  paymentStatus: {
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
    fontSize: "14px",
  },
  paymentStatusSuccess: {
    background: "rgba(255,255,255,0.05)",
    color: "#e8eeff",
    border: `1px solid rgba(16, 185, 129, 0.25)`,
  },
  paymentStatusError: {
    background: "rgba(239, 68, 68, 0.12)",
    color: ACCENT_RED,
    border: `1px solid rgba(239, 68, 68, 0.25)`,
  },
  paymentStatusInfo: {
    background: "rgba(255, 255, 255, 0.05)",
    color: TEXT_MUTED,
    border: `1px solid ${BORDER}`,
  },
};
