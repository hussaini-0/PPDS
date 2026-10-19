import { mkdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const tempDirectory = path.resolve(process.cwd(), ".build-tmp");
mkdirSync(tempDirectory, { recursive: true });

const result = spawnSync(
  process.execPath,
  [path.resolve("node_modules/next/dist/bin/next"), "build", "--webpack"],
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
