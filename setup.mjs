#!/usr/bin/env node
// CampusFlow one-command runner. Works on Windows, macOS and Linux (only Node.js 22.13+ needed).
//   node setup.mjs            -> install (if needed) + build + migrate DB (once) + start dev server
//   node setup.mjs --no-dev   -> do the setup only, do not start the server
//   node setup.mjs --reset    -> delete local database and re-create it
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
process.chdir(root);
const args = new Set(process.argv.slice(2));
const isWin = process.platform === "win32";
const PNPM_VERSION = "11.25.0"; // matches "packageManager" in package.json

const log = (m) => console.log(`\n\x1b[36m[CampusFlow]\x1b[0m ${m}`);
const die = (m) => { console.error(`\n\x1b[31m[CampusFlow] ${m}\x1b[0m`); process.exit(1); };
const run = (cmd, argv, opts = {}) =>
  spawnSync(cmd, argv, { stdio: "inherit", shell: isWin && opts.shell !== false, cwd: root, ...opts });
const ok = (r) => !r.error && r.status === 0;

// 1. Node version
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 13))
  die(`Node.js 22.13+ is required (you have ${process.versions.node}). Download it from https://nodejs.org`);

// 2. Pick a pnpm runner (corepack -> global pnpm -> npx)
function pnpmRunner() {
  const probes = [
    ["corepack", ["pnpm", "--version"], ["corepack", "pnpm"]],
    ["pnpm", ["--version"], ["pnpm"]],
    ["npx", ["--yes", `pnpm@${PNPM_VERSION}`, "--version"], ["npx", "--yes", `pnpm@${PNPM_VERSION}`]],
  ];
  for (const [cmd, probe, runner] of probes) {
    const r = spawnSync(cmd, probe, { stdio: "ignore", shell: isWin });
    if (!r.error && r.status === 0) return runner;
  }
  return null;
}

if (args.has("--clean")) {
  for (const d of ["node_modules", "dist", ".wrangler"]) rmSync(join(root, d), { recursive: true, force: true });
  log("Cleaned node_modules, dist and .wrangler.");
  process.exit(0);
}

// 3. Reset (optional)
if (args.has("--reset")) {
  log("Removing local database (.wrangler) ...");
  rmSync(join(root, ".wrangler"), { recursive: true, force: true });
}

// 4. Install dependencies
if (!existsSync(join(root, "node_modules", "vinext"))) {
  log("Installing dependencies (first run only, may take a few minutes) ...");
  const p = pnpmRunner();
  let done = false;
  if (p) done = ok(run(p[0], [...p.slice(1), "install", "--frozen-lockfile"]));
  if (!done) {
    log("pnpm failed or unavailable - falling back to npm install ...");
    done = ok(run("npm", ["install"]));
  }
  if (!done) die("Dependency installation failed. Check your internet connection and try again.");
}

// 5. Build (needed once so wrangler has dist/server/wrangler.json for the DB migration)
if (!existsSync(join(root, "dist", "server", "wrangler.json")) || args.has("--rebuild")) {
  log("Building project ...");
  if (!ok(run("npm", ["run", "build"]))) die("Build failed.");
}

// 6. Create local database once
const marker = join(root, ".wrangler", ".campusflow-migrated");
if (!existsSync(marker)) {
  log("Creating local database (one time) ...");
  const r = run(process.execPath, [
    "--import", "./scripts/sites-env.mjs",
    "./node_modules/wrangler/bin/wrangler.js", "d1", "execute", "DB",
    "--local", "--config", "dist/server/wrangler.json",
    "--persist-to", ".wrangler/state", "--file", "drizzle/0000_daily_toxin.sql",
  ], { shell: false });
  if (!ok(r)) die("Database migration failed.");
  mkdirSync(dirname(marker), { recursive: true });
  writeFileSync(marker, new Date().toISOString());
}

// 7. Start dev server
if (args.has("--no-dev")) {
  log("Setup complete. Start the app any time with:  npm run dev");
  process.exit(0);
}
log("Starting dev server -> open http://localhost:5173  (Ctrl+C to stop)");
process.exit(run("npm", ["run", "dev"]).status ?? 0);
