import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { PostManager } from "./posts.ts";

const TEST_DIR = "./test_posts";

Deno.test("PostManager - creates and retrieves a post", async () => {
  const manager = new PostManager(TEST_DIR);

  const post = await manager.create({
    title: "Test Post",
    content: "# Test Post\n\nThis is a test post.",
  });

  assertExists(post.id);
  assertExists(post.folder);
  assertEquals(post.title, "Test Post");

  const retrieved = await manager.get(post.id);

  // Content should now include frontmatter
  assertExists(retrieved?.content);
  assertEquals(retrieved!.content.includes("# Test Post\n\nThis is a test post."), true);
  assertEquals(retrieved!.content.includes("title: Test Post"), true);

  // Cleanup
  await Deno.remove(TEST_DIR, { recursive: true });
});

Deno.test("PostManager - lists all posts", async () => {
  const testDir = "./test_posts_list";
  const manager = new PostManager(testDir);

  await manager.create({ title: "Post 1", content: "Content 1" });
  await manager.create({ title: "Post 2", content: "Content 2" });

  const posts = await manager.list();
  assertEquals(posts.length, 2);

  // Cleanup
  await Deno.remove(testDir, { recursive: true });
});

Deno.test("PostManager - updates a post", async () => {
  const manager = new PostManager(TEST_DIR);

  const post = await manager.create({
    title: "Original Title",
    content: "Original content",
  });

  await manager.update(post.id, {
    title: "Updated Title",
    content: "Updated content",
  });

  const updated = await manager.get(post.id);
  assertEquals(updated?.title, "Updated Title");

  // Content should include frontmatter and updated content
  assertEquals(updated?.content?.includes("Updated content"), true);
  assertEquals(updated?.content?.includes("title: Updated Title"), true);

  // Cleanup
  await Deno.remove(TEST_DIR, { recursive: true });
});

Deno.test("PostManager - creates post with default frontmatter", async () => {
  const manager = new PostManager(TEST_DIR);

  const post = await manager.create({
    title: "Test Post",
    content: "This is a test post without frontmatter.",
  });

  const retrieved = await manager.get(post.id);
  assertExists(retrieved?.content);

  // Should have frontmatter added
  const content = retrieved!.content;
  assertEquals(content.startsWith("---\n"), true);
  assertEquals(content.includes("title: Test Post"), true);
  assertEquals(content.includes("publishDate: "), true);
  assertEquals(content.includes("draft: true"), true);

  // Should preserve original content after frontmatter
  assertEquals(content.includes("This is a test post without frontmatter."), true);

  // Cleanup
  await Deno.remove(TEST_DIR, { recursive: true });
});

Deno.test("PostManager - preserves existing frontmatter", async () => {
  const manager = new PostManager(TEST_DIR);

  const post = await manager.create({
    title: "Test Post",
    content: "---\ntitle: Custom Title\ndraft: false\n---\n\nCustom content.",
  });

  const retrieved = await manager.get(post.id);
  assertExists(retrieved?.content);

  // Should preserve existing frontmatter
  const content = retrieved!.content;
  assertEquals(content.includes("title: Custom Title"), true);
  assertEquals(content.includes("draft: false"), true);
  assertEquals(content.includes("Custom content."), true);

  // Cleanup
  await Deno.remove(TEST_DIR, { recursive: true });
});

Deno.test("PostManager - deletes a post", async () => {
  const manager = new PostManager(TEST_DIR);

  const post = await manager.create({
    title: "To Delete",
    content: "Will be deleted",
  });

  await manager.delete(post.id);

  const deleted = await manager.get(post.id);
  assertEquals(deleted, null);

  // Cleanup
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // Directory might already be empty
  }
});
