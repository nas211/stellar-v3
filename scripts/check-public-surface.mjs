import { readdir, readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
export async function walk(dir) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist"].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    result.push(...item.isDirectory() ? await walk(full) : [full]);
  }
  return result;
}
export async function inspectPublicSurface(directory = root) {
  const errors = [];
  const files = await walk(directory);
  for (const full of files) {
    const relative = path.relative(directory, full).split(path.sep).join("/");
    if (/(?:^|\/)(?:backend|api|contracts|circuits|artifacts|stellar-artifacts|private-wallet|private-payment|joinsplit(?:-v\d+)?)(?:\/|$)|\.(?:wasm|bin|r1cs|zkey|wtns|rs|vk|pk)$|(?:^|\/)\.env(?:\.|$)/i.test(relative)) errors.push(`Unexpected file: ${relative}`);
    if (/\.(?:ts|tsx|js|mjs|json|html|css)$/.test(relative) && !/^(?:scripts|tests)\//.test(relative) && relative !== "package-lock.json") {
      const text = await readFile(full, "utf8");
      // reference/ holds read-only wallet source that is never built or shipped.
      const shipped = !relative.startsWith("reference/");
      if (shipped && /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(|\bEventSource\s*\(|\bWebAssembly\s*\.|\bnew\s+(?:Shared)?Worker\s*\(|\b(?:signTransaction|signMessage|sendTransaction|submitTransaction)\s*\(/.test(text)) errors.push(`Network or execution primitive: ${relative}`);
      if (shipped && /https?:\/\/(?!www\.w3\.org\/)/.test(text)) errors.push(`Remote endpoint: ${relative}`);
      if (/\bS[A-Z2-7]{55}\b|-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----|\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}/.test(text)) errors.push(`Credential pattern: ${relative}`);
    }
  }
  const html = await readFile(path.join(directory, "index.html"), "utf8");
  for (const directive of ["connect-src 'none'", "worker-src 'none'", "object-src 'none'", "frame-src 'none'", "form-action 'none'"]) if (!html.includes(directive)) errors.push(`Missing content policy: ${directive}`);
  let builtFiles = 0;
  const dist = path.join(directory, "dist");
  let hasDist = false;
  try { await access(dist); hasDist = true; } catch {}
  if (hasDist) {
    const built = await walk(dist);
    builtFiles = built.length;
    for (const file of built) {
      const relative = path.relative(directory, file);
      if (!/\.(?:js|css|html|png)$/.test(file)) errors.push(`Unexpected build artifact: ${relative}`);
      if (!/\.(?:js|css|html)$/.test(file)) continue;
      const text = await readFile(file, "utf8");
      if (/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(|\bWebAssembly\s*\.|\bnew\s+(?:Shared)?Worker\s*\(/.test(text)) errors.push(`Execution or network primitive in build: ${relative}`);
      if (/127\.0\.0\.1:432[234]|\/api\/private|parameters-uncompressed|prover\.wasm|stellar-artifacts/.test(text)) errors.push(`Unexpected deployment reference: ${relative}`);
      // React embeds an error-help link and XML namespace identifiers.
      if (/https?:\/\/(?!www\.w3\.org\/|reactjs\.org\/docs\/error-decoder\.html)/.test(text)) errors.push(`Unexpected URL in build: ${relative}`);
    }
  }
  return { files: files.length, builtFiles, errors };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await inspectPublicSurface();
  console.log(JSON.stringify(result));
  if (result.errors.length) process.exitCode = 1;
  else console.log("Public interface surface checks passed.");
}
