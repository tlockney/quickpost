#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-run

import { resolve } from "jsr:@std/path@1";
import { parseArgs } from "jsr:@std/cli@1/parse-args";
import { createServer } from "./server.ts";

const DEFAULT_PORT = 7777;
const DEFAULT_POSTS_DIR = "posts";

interface Config {
  port?: number;
  autoOpen?: boolean;
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
  } catch (error) {
    console.error("Failed to open browser:", error);
  }
}

function showHelp() {
  console.log(`
QuickPost - Lightweight markdown editor for rapid blog post creation

USAGE:
    quickpost [OPTIONS] [POSTS_DIRECTORY]

OPTIONS:
    -p, --port <PORT>        Server port (default: ${DEFAULT_PORT})
    -n, --no-open           Don't automatically open browser
    -h, --help              Show this help message

ARGUMENTS:
    POSTS_DIRECTORY         Directory to store posts (default: ${DEFAULT_POSTS_DIR})

EXAMPLES:
    quickpost                           # Use default settings
    quickpost --port 8080              # Use custom port
    quickpost --no-open ./blog-posts   # Custom directory, no browser
    quickpost -p 3000 ~/Documents/blog # Custom port and directory

CONFIG FILE:
    Create config.json for persistent settings:
    {
      "port": 8080,
      "autoOpen": false
    }
`);
}

async function main() {
  const startTime = performance.now();

  // Parse CLI arguments
  const flags = parseArgs(Deno.args, {
    string: ["port", "p"],
    boolean: ["help", "h", "no-open", "n"],
    alias: {
      port: "p",
      help: "h",
      "no-open": "n",
    },
    default: {
      port: DEFAULT_PORT.toString(),
      "no-open": false,
    },
  });

  // Show help if requested
  if (flags.help) {
    showHelp();
    return;
  }

  // Parse port
  const portArg = flags.port;
  const port = parseInt(portArg, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(`❌ Invalid port: ${portArg}. Port must be a number between 1 and 65535.`);
    Deno.exit(1);
  }

  // Determine posts directory from positional arguments or default
  const postsDir = flags._.length > 0
    ? resolve(flags._[0] as string)
    : resolve(Deno.cwd(), DEFAULT_POSTS_DIR);

  // Load configuration from file
  const config = await loadConfig();

  // CLI flags override config file settings
  const finalPort = flags.port !== DEFAULT_PORT.toString() ? port : (config.port ?? port);
  const shouldOpenBrowser = !flags["no-open"] && (config.autoOpen ?? true);

  console.log(`🚀 Starting QuickPost server on http://localhost:${finalPort}`);
  console.log(`📁 Using posts directory: ${postsDir}`);

  createServer(finalPort, postsDir);

  // Open browser after server starts (if enabled)
  if (shouldOpenBrowser) {
    await openBrowser(`http://localhost:${finalPort}`);
  }

  const startupTime = performance.now() - startTime;
  console.log(`✨ Ready in ${startupTime.toFixed(0)}ms`);

  // Keep the process running
  await new Promise(() => {});
}

if (import.meta.main) {
  main();
}
