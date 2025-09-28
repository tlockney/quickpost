import { marked } from "npm:marked@14.1.4";
import DOMPurify from "npm:isomorphic-dompurify@2.16.0";

// Configure marked for GitHub Flavored Markdown
marked.use({
  gfm: true,
  breaks: true,
});

export function parseMarkdown(content: string): string {
  // Parse markdown to HTML
  const html = marked.parse(content) as string;

  // Sanitize HTML to prevent XSS
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "hr",
      "ul",
      "ol",
      "li",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "a",
      "img",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "del",
      "code",
      "pre",
      "blockquote",
      "input", // For task lists
    ],
    ALLOWED_ATTR: [
      "href",
      "src",
      "alt",
      "title",
      "width",
      "height",
      "type",
      "checked",
      "disabled",
      "class",
    ],
    ALLOW_DATA_ATTR: false,
  });

  return sanitized;
}
