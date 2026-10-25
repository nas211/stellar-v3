import React from "react";

const paths = {
  deposit: "M12 5v14M5 12h14",
  swap: "M4 8h16m-4-4 4 4-4 4M20 16H4m4-4-4 4 4 4",
  profile: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
  settings: "M4 7h16M4 17h16M8 4v6M16 14v6",
  wallet: "M20 8H5a2 2 0 0 1 0-4h13v4M4 6v14h16V8M20 12h-5v4h5",
  network:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z",
  send: "M6 18 18 6M6 6h12v12",
  receive: "M18 6 6 18M6 6v12h12",
  withdraw: "M12 15V3m-5 5 5-5 5 5M4 15v5h16v-5",
  copy: "M9 9h11v11H9zM15 9V4H4v11h5",
  chevron: "m8 10 4 4 4-4",
  close: "m6 6 12 12M6 18 18 6",
  back: "m12 5-7 7 7 7M5 12h14",
  refresh: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8M21 3v5h-5",
  lock: "M6 10h12v10H6zM8 10V7a4 4 0 0 1 8 0v3",
  key: "M15 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 12l-8 8M4 16l4 4",
  handle: "M16 8v7c0 3 5 2 5-3a9 9 0 1 0-5 8M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  logout: "M10 4H4v16h6M9 12h11m-5-5 5 5-5 5",
  check: "m5 12 4 4L19 6",
  home: "M4 11 12 4l8 7M6.5 9.5V20h11V9.5",
  markets: "M4 19h16M7.5 16V9.5M12 16V5.5M16.5 16v-4.5",
  history: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM12 7.5V12l3 2",
  menu: "M4 7h16M4 12h16M4 17h16",
} as const;

export function BaseWalletIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "refresh" ? 2 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
