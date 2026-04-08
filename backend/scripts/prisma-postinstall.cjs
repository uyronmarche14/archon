const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const envFilePath = path.resolve(
  process.cwd(),
  process.env.DOTENV_CONFIG_PATH || ".env",
);

const parseEnvValue = (fileContents, key) => {
  const line = fileContents
    .split(/\r?\n/u)
    .find((candidate) => candidate.startsWith(`${key}=`));

  if (!line) {
    return null;
  }

  return line.slice(key.length + 1).trim().replace(/^['"]|['"]$/gu, "");
};

const resolvedDatabaseUrl =
  process.env.DATABASE_URL ||
  (fs.existsSync(envFilePath)
    ? parseEnvValue(fs.readFileSync(envFilePath, "utf8"), "DATABASE_URL")
    : null);

if (!resolvedDatabaseUrl) {
  process.stdout.write(
    "[backend postinstall] Skipping prisma generate because DATABASE_URL is not configured for this install.\n",
  );
  process.exit(0);
}

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const result = spawnSync(pnpmCommand, ["prisma", "generate"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    DATABASE_URL: resolvedDatabaseUrl,
  },
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
