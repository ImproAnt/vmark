import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const args = process.argv.slice(2);
const isDev = args[0] === "dev";
const hasConfig = args.includes("--config") || args.includes("-c");

const scriptPath = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(scriptPath);
const projectRoot = path.resolve(scriptsDir, "..");

// Use platform-specific tauri CLI path from node_modules
const isWindows = process.platform === "win32";
const tauriBin = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  isWindows ? "tauri.cmd" : "tauri"
);

const tauriArgs = isDev && !hasConfig
  ? [...args, "--config", "src-tauri/tauri.dev.conf.json"]
  : args;

const result = spawnSync(tauriBin, tauriArgs, { stdio: "inherit", shell: isWindows });
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(typeof result.status === "number" ? result.status : 1);
