const { spawn } = require("child_process");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const processes = [
  ["BACKEND", ["--prefix", "backend", "run", "dev"]],
  ["FRONTEND", ["--prefix", "frontend", "run", "dev"]],
];

const children = processes.map(([name, args]) => {
  const child = spawn(npm, args, { stdio: "pipe", shell: true });
  child.stdout.on("data", (d) => process.stdout.write(`[${name}] ${d}`));
  child.stderr.on("data", (d) => process.stderr.write(`[${name}] ${d}`));
  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      console.error(`[${name}] exited (${signal || code}). Stopping the other process.`);
      shutdown(code || 1);
    }
  });
  return child;
});

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  setTimeout(() => process.exit(code), 250);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
