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

  private addDefaultFrontmatter(content: string, title: string, slug: string): string {
    const { frontmatter, body } = this.parseFrontmatter(content);

    // If content already has frontmatter, return as-is
    if (Object.keys(frontmatter).length > 0) {
      return content;
    }

    // Generate default frontmatter
    const now = new Date();
    const publishDate = now.toISOString().replace(/\.\d{3}Z$/, "-07:00"); // Format: 2021-06-08T21:47:59-07:00
    const isoTimestamp = now.toISOString();

    const defaultFrontmatter = [
      "---",
      `title: ${title}`,
      `slug: ${slug}`,
      `publishDate: ${publishDate}`,
      `createdAt: ${isoTimestamp}`,
      `updatedAt: ${isoTimestamp}`,
      "draft: true",
      "---",
      "",
    ].join("\n");

    return defaultFrontmatter + body;
  }

  private async slugExists(slug: string): Promise<boolean> {
    try {
      const postFile = join(this.postsDir, `${slug}.md`);
      const stat = await Deno.stat(postFile);
      return stat.isFile;
    } catch {
      return false;
    }
  }

  async create(data: CreatePostData): Promise<Post> {
    await ensureDir(this.postsDir);

    // Generate initial slug from title
    const initialSlug = this.generateSlug(data.title);

    // Ensure slug is unique by adding a number if needed
    let uniqueSlug = initialSlug;
    let counter = 1;
    while (await this.slugExists(uniqueSlug)) {
      uniqueSlug = `${initialSlug}-${counter}`;
      counter++;
    }

    // Add default frontmatter if none exists, using the unique slug
    const contentWithFrontmatter = this.addDefaultFrontmatter(data.content, data.title, uniqueSlug);

    const postFile = join(this.postsDir, `${uniqueSlug}.md`);
    await Deno.writeTextFile(postFile, contentWithFrontmatter);

    // Parse the final frontmatter to get metadata for return value
    const { frontmatter } = this.parseFrontmatter(contentWithFrontmatter);

    return {
      id: uniqueSlug,
      folder: uniqueSlug, // Keep for backward compatibility, but it's just the slug now
      title: data.title,
      content: contentWithFrontmatter,
      createdAt: new Date(frontmatter.createdAt || new Date().toISOString()),
      updatedAt: new Date(frontmatter.updatedAt || new Date().toISOString()),
    };
  }

  async get(id: string): Promise<Post | null> {
    try {
      const postFile = join(this.postsDir, `${id}.md`);

      // Check if the file exists
      try {
        const stat = await Deno.stat(postFile);
        if (!stat.isFile) return null;
      } catch {
        return null;
      }

      const content = await Deno.readTextFile(postFile);

      // Parse frontmatter to get metadata
      const { frontmatter } = this.parseFrontmatter(content);

      return {
        id: frontmatter.slug || id,
        folder: id, // Keep for backward compatibility, but it's just the slug now
        title: frontmatter.title || "Untitled",
        content,
        createdAt: new Date(frontmatter.createdAt || new Date().toISOString()),
        updatedAt: new Date(frontmatter.updatedAt || new Date().toISOString()),
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
        if (entry.isFile && entry.name.endsWith(".md")) {
          const postFile = join(this.postsDir, entry.name);
          try {
            const content = await Deno.readTextFile(postFile);
            const { frontmatter } = this.parseFrontmatter(content);

            // Extract slug from filename (remove .md extension)
            const slug = entry.name.slice(0, -3);

            posts.push({
              id: frontmatter.slug || slug,
              folder: slug, // Keep for backward compatibility, but it's just the slug now
              title: frontmatter.title || "Untitled",
              createdAt: new Date(frontmatter.createdAt || new Date().toISOString()),
              updatedAt: new Date(frontmatter.updatedAt || new Date().toISOString()),
            });
          } catch {
            // Skip invalid post files
          }
        }
      }

      // Sort by creation date, newest first
      return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch {
      return [];
    }
  }

  private updateFrontmatterField(content: string, field: string, value: string): string {
    const { frontmatter, body } = this.parseFrontmatter(content);

    // Update the specific field
    frontmatter[field] = value;

    // Reconstruct the content with updated frontmatter
    const frontmatterText = Object.entries(frontmatter)
      .map(([key, val]) => `${key}: ${val}`)
      .join("\n");

    return `---\n${frontmatterText}\n---\n${body}`;
  }

  async update(id: string, data: UpdatePostData): Promise<Post | null> {
    const post = await this.get(id);
    if (!post) return null;

    const postFile = join(this.postsDir, `${id}.md`);

    let updatedContent = post.content!;

    // Update content if provided
    if (data.content !== undefined) {
      updatedContent = data.content;
    }

    // Update title in frontmatter if provided
    if (data.title !== undefined) {
      updatedContent = this.updateFrontmatterField(updatedContent, "title", data.title);
    }

    // Always update the updatedAt timestamp
    const now = new Date().toISOString();
    updatedContent = this.updateFrontmatterField(updatedContent, "updatedAt", now);

    // Write the updated content back to file
    await Deno.writeTextFile(postFile, updatedContent);

    // Parse the updated frontmatter to return accurate metadata
    const { frontmatter } = this.parseFrontmatter(updatedContent);

    return {
      id: post.id,
      folder: post.folder,
      title: frontmatter.title || post.title,
      content: updatedContent,
      createdAt: post.createdAt,
      updatedAt: new Date(frontmatter.updatedAt || now),
    };
  }

  async delete(id: string): Promise<boolean> {
    try {
      const postFile = join(this.postsDir, `${id}.md`);

      // Check if the file exists
      try {
        const stat = await Deno.stat(postFile);
        if (!stat.isFile) return false;
      } catch {
        return false;
      }

      await Deno.remove(postFile);
      return true;
    } catch {
      return false;
    }
  }
}
