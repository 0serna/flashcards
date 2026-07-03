import { spawn, spawnSync } from "node:child_process";

function run(name, args) {
  const result = spawnSync(name, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (spawnSync("supabase", ["start"], { stdio: "inherit" }).status !== 0) {
  console.log("supabase start failed; recovering from stale state...");
  run("supabase", ["stop"]);
  run("supabase", ["start"]);
}

const dev = spawn("npm", ["run", "dev"], { stdio: "inherit" });

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => dev.kill(signal));
}

dev.on("exit", (code) => {
  process.exit(code ?? 0);
});
