import { ensureDir } from "jsr:@std/fs@1";
import { join, resolve } from "jsr:@std/path@1";

export interface Post {
  id: string;
  folder: string;
  title: string;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostData {
  title: string;
  content: string;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
}

export class PostManager {
  private postsDir: string;

  constructor(postsDir?: string) {
    this.postsDir = postsDir ? resolve(postsDir) : resolve(Deno.cwd(), "posts");
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters except hyphens and spaces
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
      .slice(0, 60); // Allow longer slugs
  }

  private parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return { frontmatter: {}, body: content };
    }

    try {
      const frontmatterText = match[1];
      const frontmatter: Record<string, any> = {};

      // Simple YAML-like parsing for basic key: value pairs
      frontmatterText.split("\n").forEach((line) => {
        const colonIndex = line.indexOf(":");
        if (colonIndex > 0) {
          const key = line.slice(0, colonIndex).trim();
          const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, "");
          frontmatter[key] = value;
        }
      });

      return { frontmatter, body: match[2] };
    } catch {
      return { frontmatter: {}, body: content };
    }
  }

  private async slugExists(slug: string): Promise<boolean> {
    try {
      const postDir = join(this.postsDir, slug);
      const stat = await Deno.stat(postDir);
      return stat.isDirectory;
    } catch {
      return false;
    }
  }

  async create(data: CreatePostData): Promise<Post> {
    await ensureDir(this.postsDir);

    // Parse frontmatter to check for custom slug
    const { frontmatter } = this.parseFrontmatter(data.content);

    // Use custom slug from frontmatter, or generate from title
    const slug = frontmatter.slug || this.generateSlug(data.title);

    // Ensure slug is unique by adding a number if needed
    let uniqueSlug = slug;
    let counter = 1;
    while (await this.slugExists(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const folder = uniqueSlug;
    const postDir = join(this.postsDir, folder);

    await ensureDir(postDir);
    await ensureDir(join(postDir, "images"));

    const postFile = join(postDir, "post.md");
    await Deno.writeTextFile(postFile, data.content);

    const now = new Date();
    const metadata = {
      id: uniqueSlug, // Use slug as ID for simplicity
      slug: uniqueSlug,
      title: data.title,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const metaFile = join(postDir, "meta.json");
    await Deno.writeTextFile(metaFile, JSON.stringify(metadata, null, 2));

    return {
      id: uniqueSlug,
      folder,
      title: data.title,
      content: data.content,
      createdAt: now,
      updatedAt: now,
    };
  }

  async get(id: string): Promise<Post | null> {
    try {
      // For slug-based lookup, the ID should match the folder name exactly
      const postPath = join(this.postsDir, id);

      // Check if the directory exists
      try {
        const stat = await Deno.stat(postPath);
        if (!stat.isDirectory) return null;
      } catch {
        return null;
      }

      const metaFile = join(postPath, "meta.json");
      const postFile = join(postPath, "post.md");

      const metadata = JSON.parse(await Deno.readTextFile(metaFile));
      const content = await Deno.readTextFile(postFile);

      return {
        id: metadata.id,
        folder: id,
        title: metadata.title,
        content,
        createdAt: new Date(metadata.createdAt),
        updatedAt: new Date(metadata.updatedAt),
      };
    } catch {
      return null;
    }
  }

  async list(): Promise<Post[]> {
    try {
      await ensureDir(this.postsDir);
      const entries = await Array.fromAsync(Deno.readDir(this.postsDir));
      const posts: Post[] = [];

      for (const entry of entries) {
        if (entry.isDirectory) {
          const metaFile = join(this.postsDir, entry.name, "meta.json");
          try {
            const metadata = JSON.parse(await Deno.readTextFile(metaFile));
            posts.push({
              id: metadata.id,
              folder: entry.name,
              title: metadata.title,
              createdAt: new Date(metadata.createdAt),
              updatedAt: new Date(metadata.updatedAt),
            });
          } catch {
            // Skip invalid post directories
          }
        }
      }

      // Sort by creation date, newest first
      return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch {
      return [];
    }
  }

  async update(id: string, data: UpdatePostData): Promise<Post | null> {
    const post = await this.get(id);
    if (!post) return null;

    const postPath = join(this.postsDir, post.folder);

    if (data.content !== undefined) {
      const postFile = join(postPath, "post.md");
      await Deno.writeTextFile(postFile, data.content);
    }

    const metaFile = join(postPath, "meta.json");
    const metadata = JSON.parse(await Deno.readTextFile(metaFile));

    if (data.title !== undefined) {
      metadata.title = data.title;
    }
    metadata.updatedAt = new Date().toISOString();

    await Deno.writeTextFile(metaFile, JSON.stringify(metadata, null, 2));

    return {
      ...post,
      title: data.title ?? post.title,
      content: data.content ?? post.content,
      updatedAt: new Date(metadata.updatedAt),
    };
  }

  async delete(id: string): Promise<boolean> {
    try {
      const postPath = join(this.postsDir, id);

      // Check if the directory exists
      try {
        const stat = await Deno.stat(postPath);
        if (!stat.isDirectory) return false;
      } catch {
        return false;
      }

      await Deno.remove(postPath, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }
}
