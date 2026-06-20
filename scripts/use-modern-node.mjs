import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const minimumMajor = 22;
const minimumMinor = 13;
const [major, minor] = process.versions.node.split(".").map(Number);
const args = process.argv.slice(2);

if (!args.length) {
  console.error("Usage: node scripts/use-modern-node.mjs <script> [...args]");
  process.exit(1);
}

function currentNodeIsModern() {
  return major > minimumMajor || (major === minimumMajor && minor >= minimumMinor);
}

function bundledNodeCandidates() {
  const home = process.env.USERPROFILE ?? process.env.HOME ?? "";

  return [
    join(
      home,
      ".cache",
      "codex-runtimes",
      "codex-primary-runtime",
      "dependencies",
      "node",
      "bin",
      process.platform === "win32" ? "node.exe" : "node",
    ),
  ];
}

const target = resolve(args[0]);
const targetArgs = [target, ...args.slice(1)];
const nodePath = currentNodeIsModern()
  ? process.execPath
  : bundledNodeCandidates().find((candidate) => existsSync(candidate));

if (!nodePath) {
  console.error(
    `Node ${minimumMajor}.${minimumMinor}+ is required. Install a newer Node.js runtime and retry.`,
  );
  process.exit(1);
}

const result = spawnSync(nodePath, targetArgs, {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
