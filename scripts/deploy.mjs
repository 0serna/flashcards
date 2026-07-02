import { execFileSync } from "node:child_process";
import { setTimeout } from "node:timers/promises";

const workflow = "deploy.yml";
const branch = "main";
const listArgs = [
  "run",
  "list",
  "--workflow",
  workflow,
  "--branch",
  branch,
  "--event",
  "workflow_dispatch",
  "--limit",
  "1",
  "--json",
  "url",
  "--jq",
  ".[0].url",
];

execFileSync("gh", ["workflow", "run", workflow, "--ref", branch], {
  stdio: "inherit",
});

await setTimeout(3000);

console.log(execFileSync("gh", listArgs, { encoding: "utf8" }).trimEnd());
