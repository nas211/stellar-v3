import React, { useEffect, useRef, useState } from "react";

/** Mount only during an operation so each attempt starts its own elapsed clock. */
export function BaseOperationProgress({
  message,
  extendedPreparationMessage,
  completed = false,
}: {
  message: string;
  extendedPreparationMessage?: string;
  completed?: boolean;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const started = useRef(Date.now());
  useEffect(() => {
    if (completed) return;
    const timer = setInterval(
      () =>
        setElapsedSeconds(Math.floor((Date.now() - started.current) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [completed]);
  return (
    <div style={{ color: "#b0c4de", marginBottom: "12px", fontSize: "14px" }}>
      <div role="status">
        {completed
          ? "Transaction complete"
          : elapsedSeconds >= 20 &&
              extendedPreparationMessage &&
              message === "Preparing transaction…"
            ? extendedPreparationMessage
            : message}
      </div>
      <div aria-live="off">
        Elapsed: {Math.floor(elapsedSeconds / 60)}:
        {String(elapsedSeconds % 60).padStart(2, "0")}.
        {!completed && " Keep this tab open."}
      </div>
    </div>
  );
}
