import { mkdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const tempDirectory = path.resolve(process.cwd(), ".test-tmp");
mkdirSync(tempDirectory, { recursive: true });

const result = spawnSync(
  process.execPath,
  [path.resolve("node_modules/vitest/vitest.mjs"), ...process.argv.slice(2)],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      TEMP: tempDirectory,
      TMP: tempDirectory,
      TMPDIR: tempDirectory,
    },
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
