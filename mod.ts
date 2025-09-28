#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write

import { createServer } from "./server.ts";

const DEFAULT_PORT = 7777;

interface Config {
  port?: number;
}

async function loadConfig(): Promise<Config> {
  try {
    const configText = await Deno.readTextFile("./config.json");
    return JSON.parse(configText);
  } catch {
    return {};
  }
}

async function openBrowser(url: string): Promise<void> {
  const os = Deno.build.os;
  let command: string[];

  if (os === "darwin") {
    command = ["open", url];
  } else if (os === "windows") {
    command = ["cmd", "/c", "start", url];
  } else {
    command = ["xdg-open", url];
  }

  try {
    const process = new Deno.Command(command[0], {
      args: command.slice(1),
      stdout: "null",
      stderr: "null",
    });
    await process.output();
  } catch {
    // Silently fail if browser can't be opened
  }
}

async function main() {
  const startTime = performance.now();

  const config = await loadConfig();
  const port = config.port ?? DEFAULT_PORT;

  console.log(`🚀 Starting QuickPost server on http://localhost:${port}`);

  createServer(port);

  // Open browser after server starts
  await openBrowser(`http://localhost:${port}`);

  const startupTime = performance.now() - startTime;
  console.log(`✨ Ready in ${startupTime.toFixed(0)}ms`);

  // Keep the process running
  await new Promise(() => {});
}

if (import.meta.main) {
  main();
}
