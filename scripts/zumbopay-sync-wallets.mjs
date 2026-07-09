#!/usr/bin/env node
/**
 * Sincroniza as carteiras (wallet_id) da tua conta ZumboPay.
 * Uso: node scripts/zumbopay-sync-wallets.mjs
 * Lê ZUMBOPAY_API_KEY de .env.local e imprime os wallet_id por método
 * (M-Pesa / e-Mola / Cartão) prontos a colar em .env.local.
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");

function readEnvVar(name) {
  try {
    const content = readFileSync(envPath, "utf-8");
    const match = content.match(new RegExp(`^${name}=(.*)$`, "m"));
    return match ? match[1].trim() : "";
  } catch {
    return "";
  }
}

const apiKey = process.env.ZUMBOPAY_API_KEY || readEnvVar("ZUMBOPAY_API_KEY");
if (!apiKey) {
  console.error("ZUMBOPAY_API_KEY não encontrada. Preenche-a em .env.local primeiro.");
  process.exit(1);
}

const API_URL = "https://zumbopay.com/api/public/v1";

async function main() {
  console.log("A validar a API key...");
  const val = await fetch(`${API_URL}/merchant/validate`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  }).then(r => r.json());

  if (!val?.data) {
    console.error("API key inválida ou erro na ligação:", val?.error ?? val);
    process.exit(1);
  }
  console.log(`✓ Merchant: ${val.data.name ?? val.data.legal_name ?? "?"} (ID: ${val.data.merchant_id ?? "?"})`);

  console.log("\nA listar carteiras...");
  const res = await fetch(`${API_URL}/wallets`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  }).then(r => r.json());

  const wallets = res?.data ?? [];
  if (!wallets.length) {
    console.log("\nNenhuma carteira encontrada. Cria carteiras em https://zumbopay.com/app/wallets");
    return;
  }

  console.log(`\n✓ ${wallets.length} carteira(s) encontrada(s):\n`);
  const byMethod = { mpesa: [], emola: [], card: [] };
  for (const w of wallets) {
    if (!w.is_active) continue;
    if (byMethod[w.method]) byMethod[w.method].push(w);
    console.log(`  [${w.method}] ${w.wallet_code ?? "?"} — ${w.name ?? "Wallet"} — id: ${w.id}`);
  }

  console.log("\n── Cola isto em .env.local ──────────────────────────");
  for (const m of ["mpesa", "emola", "card"]) {
    const w = byMethod[m][0];
    const envKey = `ZUMBOPAY_WALLET_${m.toUpperCase()}`;
    if (w) {
      console.log(`${envKey}=${w.id}${byMethod[m].length > 1 ? "  # aviso: tens mais que uma carteira, escolhe a certa" : ""}`);
    } else {
      console.log(`${envKey}=  # nenhuma carteira activa para ${m} — cria uma em zumbopay.com/app/wallets`);
    }
  }
  console.log("──────────────────────────────────────────────────────");
}

main().catch(e => {
  console.error("Erro:", e);
  process.exit(1);
});
