// Create/update a Vercel project (rootDirectory into the monorepo) and upsert
// its env vars from .env. Values go straight from the file to the Vercel API —
// they are never printed. Usage: node scripts/vercel-setup.mjs <app> [extra KEY=VALUE...]

import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);

const TOKEN = env.VERCEL_TOKEN;
if (!TOKEN) throw new Error("VERCEL_TOKEN missing in .env");

const APPS = {
  "padi-agent": {
    root: "apps/padi",
    envs: ["ANTHROPIC_API_KEY", "SCHOLARBOARD_ADDRESS", "ATTESTOR_PRIVATE_KEY"],
  },
  "oga-agent": {
    root: "apps/oga",
    envs: [
      "ANTHROPIC_API_KEY",
      "GIG_SECRET",
      "GIGRECEIPTS_ADDRESS",
      "ATTESTOR_PRIVATE_KEY",
    ],
  },
  "agentsng": { root: "apps/home", envs: [] },
};

const name = process.argv[2];
const app = APPS[name];
if (!app) throw new Error(`unknown app ${name}`);
const extra = process.argv.slice(3).map((kv) => {
  const i = kv.indexOf("=");
  return { key: kv.slice(0, i), value: kv.slice(i + 1) };
});

async function api(path, init = {}) {
  const r = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

// 1. create project (or accept 409 conflict) then ensure rootDirectory
let r = await api("/v11/projects", {
  method: "POST",
  body: JSON.stringify({ name, framework: "nextjs", rootDirectory: app.root }),
});
if (!r.ok && r.status !== 409 && r.body?.error?.code !== "conflict") {
  throw new Error(`create project failed: ${r.status} ${JSON.stringify(r.body.error ?? r.body)}`);
}
r = await api(`/v9/projects/${name}`, {
  method: "PATCH",
  body: JSON.stringify({ rootDirectory: app.root, framework: "nextjs" }),
});
if (!r.ok) throw new Error(`patch project failed: ${r.status}`);
console.log(`project ${name} ready (root: ${app.root})`);

// 2. upsert env vars
const vars = [
  ...app.envs
    .filter((k) => env[k])
    .map((k) => ({ key: k, value: env[k] })),
  ...extra,
];
if (vars.length) {
  r = await api(`/v10/projects/${name}/env?upsert=true`, {
    method: "POST",
    body: JSON.stringify(
      vars.map(({ key, value }) => ({
        key,
        value,
        type: "encrypted",
        target: ["production", "preview"],
      })),
    ),
  });
  if (!r.ok) throw new Error(`env upsert failed: ${r.status} ${JSON.stringify(r.body.error ?? "")}`);
  console.log(`env vars set: ${vars.map((v) => v.key).join(", ")}`);
} else {
  console.log("no env vars to set");
}
