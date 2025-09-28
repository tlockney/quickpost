import { PostManager } from "./lib/posts.ts";

function getContentType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html":
      return "text/html; charset=utf-8";
    case "js":
      return "application/javascript";
    case "css":
      return "text/css";
    case "json":
      return "application/json";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    default:
      return "text/plain";
  }
}

interface Server {
  port: number;
  shutdown: () => Promise<void>;
}

// Helper functions for common response patterns
const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

const errorResponse = (error: unknown, status = 400): Response => {
  const message = error instanceof Error ? error.message : "Unknown error";
  return jsonResponse({ error: message }, status);
};

const notFoundResponse = () => new Response("Not Found", { status: 404 });
const methodNotAllowed = () => new Response("Method Not Allowed", { status: 405 });

export function createServer(port: number, postsDir?: string): Server {
  const postManager = new PostManager(postsDir);

  const handler = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Log all requests
    console.log(`${method} ${path}`);

    // Health check endpoint
    if (path === "/health") {
      return new Response("OK", { status: 200 });
    }

    // Serve static files
    if (!path.startsWith("/api/")) {
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

    // API routes - single regex for both collection and single resource
    const apiMatch = path.match(/^\/api\/posts(?:\/([^\/]+))?$/);
    if (!apiMatch) return notFoundResponse();

    const postId = apiMatch[1];

    // Route based on method and presence of ID
    switch (method) {
      case "GET": {
        if (postId) {
          const post = await postManager.get(postId);
          return post ? jsonResponse(post) : notFoundResponse();
        }
        return jsonResponse(await postManager.list());
      }

      case "POST": {
        if (postId) return methodNotAllowed();
        try {
          const data = await request.json();
          const post = await postManager.create(data);
          return jsonResponse(post, 201);
        } catch (error) {
          return errorResponse(error);
        }
      }

      case "PUT": {
        if (!postId) return methodNotAllowed();
        try {
          const data = await request.json();
          const post = await postManager.update(postId, data);
          return post ? jsonResponse(post) : notFoundResponse();
        } catch (error) {
          return errorResponse(error);
        }
      }

      case "DELETE": {
        if (!postId) return methodNotAllowed();
        const deleted = await postManager.delete(postId);
        return deleted ? new Response(null, { status: 204 }) : notFoundResponse();
      }

      default: {
        return methodNotAllowed();
      }
    }
  };

  const abortController = new AbortController();
  const serverPromise = Deno.serve(
    {
      port,
      signal: abortController.signal,
      onListen: () => { },
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
