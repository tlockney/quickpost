import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { createServer } from "./server.ts";

Deno.test("Server - creates HTTP server on specified port", async () => {
  const port = 8888;
  const server = createServer(port);

  assertExists(server);
  assertEquals(server.port, port);

  // Test that server responds
  const response = await fetch(`http://localhost:${port}/health`);
  assertEquals(response.status, 200);

  const text = await response.text();
  assertEquals(text, "OK");

  await server.shutdown();
});

Deno.test("Server - serves static files from /", async () => {
  const port = 8889;
  const server = createServer(port);

  const response = await fetch(`http://localhost:${port}/`);
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("content-type"), "text/html; charset=utf-8");

  const html = await response.text();
  assertExists(html);

  await server.shutdown();
});

Deno.test("Server - handles API routes", async () => {
  const port = 8890;
  const server = createServer(port);

  // Test API posts endpoint
  const response = await fetch(`http://localhost:${port}/api/posts`);
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("content-type"), "application/json");

  const data = await response.json();
  assertEquals(Array.isArray(data), true);

  await server.shutdown();
});

Deno.test("Server - returns 404 for unknown routes", async () => {
  const port = 8891;
  const server = createServer(port);

  const response = await fetch(`http://localhost:${port}/unknown`);
  assertEquals(response.status, 404);

  const text = await response.text();
  assertEquals(text, "Not Found");

  await server.shutdown();
});
