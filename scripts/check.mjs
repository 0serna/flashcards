import { spawnSync } from "node:child_process";

const checks = [
  {
    name: "lint",
    command: "npm",
    args: ["run", "lint", "--", "--format", "json"],
  },
  {
    name: "design",
    command: "npm",
    args: ["run", "design"],
  },
  {
    name: "typecheck",
    command: "npm",
    args: ["run", "typecheck"],
  },
];

const results = checks.map((check) => {
  const result = spawnSync(check.command, check.args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  const passed = (result.status ?? 1) === 0;

  if (!passed) {
    process.stdout.write(`---CHECK:${check.name}---\n`);
    process.stdout.write(`$ ${check.command} ${check.args.join(" ")}\n`);
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }

  return { name: check.name, passed };
});

process.stdout.write("---CHECK:SUMMARY---\n");
for (const result of results) {
  process.stdout.write(`${result.name}: ${result.passed ? "PASS" : "FAIL"}\n`);
}
process.stdout.write("---CHECK:DONE---\n");

if (results.some((result) => !result.passed)) {
  process.exitCode = 1;
}
