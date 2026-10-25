import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { inspectPublicSurface } from "../scripts/check-public-surface.mjs";

test("public source has no remote transaction or proving execution surface", async () => {
  const result = await inspectPublicSurface();
  assert.deepEqual(result.errors, []);
});
test("transaction confirmation remains disabled in the presentation controller", async () => {
  const source = await readFile(new URL("../src/stellar-app/StellarFrontend.tsx", import.meta.url), "utf8");
  assert.match(source, /onConfirm=\{info\} disabled/);
  assert.match(source, /Interface preview\. No payment is submitted\./);
  assert.match(source, /historyEntries=\{\[\]\}/);
});
