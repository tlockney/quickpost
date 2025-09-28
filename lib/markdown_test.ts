import { assertEquals } from "jsr:@std/assert@1";
import { parseMarkdown } from "./markdown.ts";

Deno.test("Markdown - parses basic markdown", () => {
  const input = "# Heading\n\nThis is a **bold** text.";
  const output = parseMarkdown(input);
  assertEquals(output.includes("<h1"), true);
  assertEquals(output.includes("<strong>bold</strong>"), true);
});

Deno.test("Markdown - supports GitHub Flavored Markdown", () => {
  const input = `
# Task List
- [x] Completed task
- [ ] Incomplete task

\`\`\`javascript
console.log("Hello");
\`\`\`

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
  const output = parseMarkdown(input);

  // Check for GFM features
  assertEquals(output.includes("checkbox"), true); // Task lists
  assertEquals(output.includes("<table>"), true); // Tables
  assertEquals(output.includes("<code"), true); // Code blocks
});

Deno.test("Markdown - sanitizes HTML", () => {
  const input = `<script>alert('xss')</script>

# Safe heading`;

  const output = parseMarkdown(input);
  assertEquals(output.includes("<script>"), false);
  assertEquals(output.includes("alert"), false);
  assertEquals(output.includes("<h1"), true);
});

Deno.test("Markdown - handles links", () => {
  const input = "[GitHub](https://github.com)";
  const output = parseMarkdown(input);
  assertEquals(output.includes('<a href="https://github.com"'), true);
});

Deno.test("Markdown - handles images", () => {
  const input = "![Alt text](image.png)";
  const output = parseMarkdown(input);
  assertEquals(output.includes('<img src="image.png"'), true);
  assertEquals(output.includes('alt="Alt text"'), true);
});
