import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Socket } from "node:net";

const envPath = resolve(process.cwd(), ".env");
let envText = "";
try {
  envText = readFileSync(envPath, "utf8");
} catch {
  console.error(`✗ No se pudo leer ${envPath}`);
  process.exit(1);
}

const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      const key = l.slice(0, i).trim();
      let val = l.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return [key, val];
    }),
);

function parse(name) {
  const raw = env[name];
  console.log(`\n— ${name} —`);
  if (!raw) {
    console.log("  ✗ NO DEFINIDA en .env");
    return null;
  }
  if (raw.includes("[") || raw.includes("]")) {
    console.log("  ✗ Contiene corchetes [ o ] — el placeholder [YOUR-PASSWORD] no se reemplazó");
    return null;
  }
  let u;
  try {
    u = new URL(raw);
  } catch (e) {
    console.log(`  ✗ URL inválida: ${e.message}`);
    console.log("    Causa común: caracteres especiales en la contraseña sin URL-encoding (#, @, ?, /, :, &, =, +)");
    return null;
  }
  console.log("  ✓ Sintaxis válida");
  console.log(`    protocolo: ${u.protocol}`);
  console.log(`    user:      ${decodeURIComponent(u.username)}`);
  console.log(`    password:  ${u.password.length} caracteres (oculto)`);
  console.log(`    host:      ${u.hostname}`);
  console.log(`    port:      ${u.port || "(default)"}`);
  console.log(`    database:  ${u.pathname.slice(1) || "(default)"}`);
  if (u.search) console.log(`    query:     ${u.search}`);
  return u;
}

function ping(host, port) {
  return new Promise((ok) => {
    const s = new Socket();
    const done = (result) => {
      s.removeAllListeners();
      s.destroy();
      ok(result);
    };
    s.setTimeout(5000);
    s.once("connect", () => done({ ok: true }));
    s.once("timeout", () => done({ ok: false, reason: "timeout (5s)" }));
    s.once("error", (err) => done({ ok: false, reason: err.message }));
    s.connect(Number(port), host);
  });
}

const dbUrl = parse("DATABASE_URL");
const directUrl = parse("DIRECT_URL");

const targets = [dbUrl, directUrl].filter(Boolean);
if (targets.length > 0) {
  console.log("\n— Conectividad TCP (no autenticada) —");
  for (const u of targets) {
    const port = u.port || (u.protocol === "postgresql:" ? "5432" : "");
    const r = await ping(u.hostname, port);
    if (r.ok) {
      console.log(`  ✓ ${u.hostname}:${port} alcanzable`);
    } else {
      console.log(`  ✗ ${u.hostname}:${port} — ${r.reason}`);
    }
  }
}

console.log("\nListo. Si todo está ✓ y prisma migrate sigue fallando, el problema es de credenciales o de permisos del rol.");
