// Root cause: nothing stops a screen/component from importing the Firebase SDK (or
// firebase/auth.ts, firebase/db.ts) directly, bypassing data/store.tsx — the one place
// that's supposed to own every read/write. A single direct call from a UI file is how
// that discipline quietly erodes over time. This script is the guard: it fails the
// build the moment it happens, instead of relying on remembering to review for it.
//
// Single source of truth for Firebase access: src/data/store.tsx is the ONLY file
// outside src/firebase/** allowed to import from the firebase SDK or from
// src/firebase/*. Everything else (screens, components, other data/ files) must go
// through the store's context (useStore/useActiveChild).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = new URL("../src", import.meta.url).pathname;
const ALLOWED_FILES = new Set(["data/store.tsx"]);
const ALLOWED_DIRS = ["firebase"];

const FIREBASE_IMPORT = /from\s+["'](firebase\/[\w-]+|\.\.?\/(\.\.?\/)?firebase\/[\w-]+)["']/;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const violations = [];
for (const file of walk(SRC)) {
  const rel = relative(SRC, file);
  if (ALLOWED_FILES.has(rel)) continue;
  if (ALLOWED_DIRS.some((d) => rel.startsWith(`${d}/`) || rel.startsWith(`${d}\\`))) continue;

  const content = readFileSync(file, "utf8");
  for (const line of content.split("\n")) {
    if (FIREBASE_IMPORT.test(line)) {
      violations.push(`src/${rel}: ${line.trim()}`);
    }
  }
}

if (violations.length > 0) {
  console.error("Firebase access boundary violated — only src/data/store.tsx may import the firebase SDK or src/firebase/*:\n");
  for (const v of violations) console.error(`  ${v}`);
  console.error(`\n${violations.length} violation(s). Route this through data/store.tsx instead.`);
  process.exit(1);
}

console.log("Firebase access boundary OK — no direct SDK/firebase imports outside data/store.tsx.");
