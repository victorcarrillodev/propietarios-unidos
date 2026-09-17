// Levanta o detiene PostgreSQL con Docker.
// Usa "docker compose" si está instalado; si no, "docker-compose"; y si tampoco
// existe, crea el contenedor directamente con "docker run" (mismos parámetros).
// Uso: npm run db:up  |  npm run db:down
import { spawnSync, type SpawnSyncOptions } from "node:child_process";
import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");

const CONTAINER = "propietarios-unidos-db";
const VOLUME = "propietarios-unidos_pgdata";
const IMAGE = "postgres:18-alpine";
const user = process.env.POSTGRES_USER ?? "propietarios";
const password = process.env.POSTGRES_PASSWORD ?? "propietarios";
const database = process.env.POSTGRES_DB ?? "propietarios_unidos";
const port = process.env.DB_PORT ?? "5432";

function run(command: string, args: string[], options: SpawnSyncOptions = {}) {
  return spawnSync(command, args, { stdio: "inherit", ...options });
}

function works(command: string, args: string[]) {
  return spawnSync(command, args, { stdio: "ignore" }).status === 0;
}

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

async function waitUntilReady() {
  process.stdout.write("⏳ Esperando a PostgreSQL");
  for (let attempt = 0; attempt < 60; attempt++) {
    if (works("docker", ["exec", CONTAINER, "pg_isready", "-U", user, "-d", database])) {
      console.log("\n✅ PostgreSQL listo en el puerto", port);
      return;
    }
    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  fail("PostgreSQL no respondió a tiempo. Revisa: docker logs " + CONTAINER);
}

const action = process.argv[2] ?? "up";

if (!works("docker", ["info"])) {
  fail(
    "No se puede usar Docker. Verifica que esté instalado y encendido, y que tu usuario pertenezca al grupo docker " +
      "(después de agregarlo, cierra sesión y vuelve a entrar).",
  );
}

const compose = works("docker", ["compose", "version"])
  ? ["docker", ["compose"]]
  : works("docker-compose", ["version"])
    ? ["docker-compose", []]
    : null;

if (action === "down") {
  if (compose) {
    const [command, base] = compose as [string, string[]];
    run(command, [...base, "stop", "db"]);
  } else {
    run("docker", ["stop", CONTAINER]);
  }
  process.exit(0);
}

if (compose) {
  const [command, base] = compose as [string, string[]];
  const result = run(command, [...base, "up", "-d", "db"]);
  if (result.status !== 0) fail("No se pudo iniciar la base de datos con Docker Compose.");
} else {
  const exists = spawnSync("docker", ["ps", "-a", "--filter", `name=^${CONTAINER}$`, "--format", "{{.Names}}"], {
    encoding: "utf8",
  }).stdout.trim();
  const result = exists
    ? run("docker", ["start", CONTAINER])
    : run("docker", [
        "run",
        "-d",
        "--name",
        CONTAINER,
        "--restart",
        "unless-stopped",
        "-e",
        `POSTGRES_USER=${user}`,
        "-e",
        `POSTGRES_PASSWORD=${password}`,
        "-e",
        `POSTGRES_DB=${database}`,
        "-p",
        `127.0.0.1:${port}:5432`,
        "-v",
        `${VOLUME}:/var/lib/postgresql`,
        IMAGE,
      ]);
  if (result.status !== 0) fail("No se pudo iniciar el contenedor de PostgreSQL.");
}

await waitUntilReady();
