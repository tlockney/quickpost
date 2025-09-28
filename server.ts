import { PostManager } from "./lib/posts.ts";

function getContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html': return 'text/html; charset=utf-8';
    case 'js': return 'application/javascript';
    case 'css': return 'text/css';
    case 'json': return 'application/json';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'svg': return 'image/svg+xml';
    default: return 'text/plain';
  }
}

interface Server {
  port: number;
  shutdown: () => Promise<void>;
}

export function createServer(port: number): Server {
  const postManager = new PostManager();

  const handler = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Log all API requests
    if (path.startsWith("/api/")) {
      console.log(`${method} ${path}`);
    }

    // Health check endpoint
    if (path === "/health") {
      return new Response("OK", { status: 200 });
    }

    // Serve main HTML page
    if (path === "/") {
      try {
        const html = await Deno.readTextFile("./static/index.html");
        return new Response(html, {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      } catch {
        // Return minimal HTML if file doesn't exist yet
        return new Response("<html><body>QuickPost</body></html>", {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
    }

    // Serve static files
    if (path.startsWith("/") && !path.startsWith("/api/")) {
      const staticPath = path === "/" ? "/index.html" : path;
      const filePath = `./static${staticPath}`;

      try {
        const fileContent = await Deno.readFile(filePath);
        const contentType = getContentType(staticPath);

        return new Response(fileContent, {
          status: 200,
          headers: { "content-type": contentType },
        });
      } catch {
        // File not found, continue to other routes
      }
    }

    // API routes
    if (path === "/api/posts") {
      if (method === "GET") {
        const posts = await postManager.list();
        return new Response(JSON.stringify(posts), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (method === "POST") {
        try {
          const data = await request.json();
          const post = await postManager.create(data);
          return new Response(JSON.stringify(post), {
            status: 201,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          return new Response(JSON.stringify({ error: message }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
      }
    }

    // Single post operations
    const postMatch = path.match(/^\/api\/posts\/([^\/]+)$/);
    if (postMatch) {
      const postId = postMatch[1];

      if (method === "GET") {
        const post = await postManager.get(postId);
        if (!post) {
          return new Response("Not Found", { status: 404 });
        }
        return new Response(JSON.stringify(post), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (method === "PUT") {
        try {
          const data = await request.json();
          const post = await postManager.update(postId, data);
          if (!post) {
            return new Response("Not Found", { status: 404 });
          }
          return new Response(JSON.stringify(post), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          return new Response(JSON.stringify({ error: message }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
      }

      if (method === "DELETE") {
        const deleted = await postManager.delete(postId);
        if (!deleted) {
          return new Response("Not Found", { status: 404 });
        }
        return new Response(null, { status: 204 });
      }
    }

    // 404 for unknown routes
    return new Response("Not Found", { status: 404 });
  };

  const abortController = new AbortController();
  const serverPromise = Deno.serve(
    {
      port,
      signal: abortController.signal,
      onListen: () => {},
    },
    handler,
  );

  return {
    port,
    shutdown: async () => {
      abortController.abort();
      await serverPromise;
    },
  };
}
