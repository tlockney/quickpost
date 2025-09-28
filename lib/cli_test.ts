import { assertEquals, assertMatch } from "jsr:@std/assert@1";
import { resolve } from "jsr:@std/path@1";

Deno.test("CLI - default directory resolution", async () => {
  const cwd = Deno.cwd();

  // Import the main module to test directory resolution logic
  const { PostManager } = await import("./posts.ts");

  // Test default behavior - should use current working directory + "posts"
  const manager = new PostManager();

  // We can't directly access the private postsDir, but we can test by creating a post
  // and verifying the directory structure is created correctly
  const testPost = await manager.create({
    title: "Test CLI Default",
    content: "# Test CLI Default\n\nTesting default directory behavior.",
  });

  // Verify the post was created
  assertEquals(testPost.title, "Test CLI Default");
  assertMatch(testPost.id, /test-cli-default/);

  // Check that the posts directory was created in the current working directory
  const expectedDir = resolve(cwd, "posts");
  try {
    const stat = await Deno.stat(expectedDir);
    assertEquals(stat.isDirectory, true);
  } catch {
    throw new Error(`Expected posts directory not found at: ${expectedDir}`);
  }

  // Cleanup
  await Deno.remove(expectedDir, { recursive: true });
});

Deno.test("CLI - custom directory resolution", async () => {
  const customDir = "./test_custom_posts";
  const { PostManager } = await import("./posts.ts");

  // Test custom directory behavior
  const manager = new PostManager(customDir);

  const testPost = await manager.create({
    title: "Test CLI Custom",
    content: "# Test CLI Custom\n\nTesting custom directory behavior.",
  });

  // Verify the post was created
  assertEquals(testPost.title, "Test CLI Custom");
  assertMatch(testPost.id, /test-cli-custom/);

  // Check that the custom directory was created
  const expectedDir = resolve(customDir);
  try {
    const stat = await Deno.stat(expectedDir);
    assertEquals(stat.isDirectory, true);
  } catch {
    throw new Error(`Expected custom posts directory not found at: ${expectedDir}`);
  }

  // Cleanup
  await Deno.remove(expectedDir, { recursive: true });
});

Deno.test("CLI - absolute path resolution", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "quickpost_test_" });
  const { PostManager } = await import("./posts.ts");

  try {
    // Test absolute path behavior
    const manager = new PostManager(tempDir);

    const testPost = await manager.create({
      title: "Test CLI Absolute",
      content: "# Test CLI Absolute\n\nTesting absolute path behavior.",
    });

    // Verify the post was created
    assertEquals(testPost.title, "Test CLI Absolute");
    assertMatch(testPost.id, /test-cli-absolute/);

    // Check that the post was created in the temp directory
    const postDir = resolve(tempDir, testPost.folder);
    const stat = await Deno.stat(postDir);
    assertEquals(stat.isDirectory, true);

    // Verify post file exists
    const postFile = resolve(postDir, "post.md");
    const postContent = await Deno.readTextFile(postFile);
    assertEquals(postContent, "# Test CLI Absolute\n\nTesting absolute path behavior.");
  } finally {
    // Cleanup
    await Deno.remove(tempDir, { recursive: true });
  }
});
