import { PostManager } from "./lib/posts.ts";
import { join } from "jsr:@std/path@1";

// Try to import bundled assets if available
let bundledAssets: {
  getAsset?: (path: string) => { content: string; isBinary: boolean } | undefined;
} = {};
try {
  bundledAssets = await import("./lib/bundled-assets.ts");
} catch {
  // Bundled assets not available, will use filesystem
}

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

      // Check if requesting an uploaded image
      if (staticPath.startsWith("/images/")) {
        try {
          const imagePath = join(postsDir || "posts", staticPath.slice(1));
          const imageData = await Deno.readFile(imagePath);
          const contentType = getContentType(staticPath);

          return new Response(imageData, {
            status: 200,
            headers: { "content-type": contentType },
          });
        } catch {
          return notFoundResponse();
        }
      }

      // Try bundled assets first
      if (bundledAssets.getAsset) {
        const asset = bundledAssets.getAsset(
          staticPath.startsWith("/") ? staticPath.slice(1) : staticPath,
        );
        if (asset) {
          const contentType = getContentType(staticPath);

          if (asset.isBinary) {
            // Convert base64 back to binary
            const binaryString = atob(asset.content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            return new Response(bytes, {
              status: 200,
              headers: { "content-type": contentType },
            });
          } else {
            return new Response(asset.content, {
              status: 200,
              headers: { "content-type": contentType },
            });
          }
        }
      }

      // Fall back to filesystem
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

    // API routes for images - handle upload endpoint
    const imageUploadMatch = path.match(/^\/api\/posts\/([^\/]+)\/upload$/);
    if (imageUploadMatch) {
      const postId = imageUploadMatch[1];

      if (method === "POST") {
        try {
          const formData = await request.formData();
          const file = formData.get("image");

          if (!file || !(file instanceof File)) {
            return errorResponse(new Error("No image file provided"), 400);
          }

          // Validate file type
          const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
          if (!allowedTypes.includes(file.type)) {
            return errorResponse(new Error("Invalid image type"), 400);
          }

          // Get file extension
          const extension = file.name.split(".").pop()?.toLowerCase() || "png";

          // Read file data
          const arrayBuffer = await file.arrayBuffer();
          const imageData = new Uint8Array(arrayBuffer);

          // Upload image
          const imagePath = await postManager.uploadImage(postId, imageData, extension);

          return jsonResponse({ path: imagePath, markdown: `![](/${imagePath})` }, 201);
        } catch (error) {
          return errorResponse(error);
        }
      }

      if (method === "GET") {
        try {
          const images = await postManager.listImages(postId);
          return jsonResponse({ images });
        } catch (error) {
          return errorResponse(error);
        }
      }

      return methodNotAllowed();
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
