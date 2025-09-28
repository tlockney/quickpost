#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net

// This script bundles marked.js into the HTML file for a truly standalone experience

async function fetchMarkedSource(): Promise<string> {
  const response = await fetch("https://cdn.jsdelivr.net/npm/marked@14.1.4/lib/marked.esm.js");
  const source = await response.text();

  // Convert to IIFE for inline usage
  const iife = `
(function() {
  ${source.replace(/export\s+{[^}]+}/, "").replace(/export\s+default\s+/, "window.marked = ")}
})();
`;
  return iife;
}

async function buildStandaloneHTML() {
  console.log("Building standalone HTML with embedded Marked...");

  const markedSource = await fetchMarkedSource();

  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuickPost</title>
  <style>
    :root {
      --bg-primary: #1a1a1a;
      --bg-secondary: #242424;
      --text-primary: #e0e0e0;
      --text-secondary: #a0a0a0;
      --border: #333;
      --accent: #4a9eff;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .header {
      display: flex;
      align-items: center;
      padding: 10px 20px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border);
    }

    .header h1 {
      font-size: 18px;
      font-weight: 500;
      margin-right: auto;
    }

    .header button {
      background: var(--accent);
      color: white;
      border: none;
      padding: 6px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-left: 8px;
    }

    .header button:hover {
      opacity: 0.9;
    }

    .container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .editor-pane, .preview-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .editor-pane {
      border-right: 1px solid var(--border);
    }

    .pane-header {
      padding: 10px 20px;
      background: var(--bg-secondary);
      font-size: 12px;
      text-transform: uppercase;
      color: var(--text-secondary);
      letter-spacing: 1px;
    }

    #editor {
      flex: 1;
      background: var(--bg-primary);
      color: var(--text-primary);
      border: none;
      padding: 20px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 14px;
      line-height: 1.6;
      resize: none;
      outline: none;
    }

    #preview {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      font-size: 16px;
      line-height: 1.6;
    }

    /* Markdown styles */
    #preview h1 { margin-bottom: 16px; font-size: 32px; border-bottom: 2px solid var(--border); padding-bottom: 8px; }
    #preview h2 { margin: 24px 0 16px; font-size: 24px; border-bottom: 1px solid var(--border); padding-bottom: 4px; }
    #preview h3 { margin: 20px 0 12px; font-size: 20px; }
    #preview h4 { margin: 16px 0 8px; font-size: 18px; }
    #preview h5 { margin: 12px 0 8px; font-size: 16px; }
    #preview h6 { margin: 12px 0 8px; font-size: 14px; color: var(--text-secondary); }
    #preview p { margin-bottom: 16px; }
    #preview ul, #preview ol { margin-bottom: 16px; padding-left: 24px; }
    #preview li { margin-bottom: 4px; }
    #preview pre {
      background: var(--bg-secondary);
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
      margin-bottom: 16px;
    }
    #preview code {
      background: var(--bg-secondary);
      padding: 2px 4px;
      border-radius: 2px;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 14px;
    }
    #preview pre code {
      background: none;
      padding: 0;
    }
    #preview blockquote {
      border-left: 4px solid var(--accent);
      padding-left: 16px;
      margin: 16px 0;
      color: var(--text-secondary);
    }
    #preview a {
      color: var(--accent);
      text-decoration: none;
    }
    #preview a:hover {
      text-decoration: underline;
    }
    #preview img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 16px 0;
    }
    #preview table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 16px;
    }
    #preview th, #preview td {
      border: 1px solid var(--border);
      padding: 8px 12px;
      text-align: left;
    }
    #preview th {
      background: var(--bg-secondary);
      font-weight: 600;
    }
    #preview tr:nth-child(even) {
      background: rgba(255, 255, 255, 0.02);
    }
    /* Task lists */
    #preview input[type="checkbox"] {
      margin-right: 6px;
    }
    #preview .task-list-item {
      list-style: none;
      margin-left: -20px;
    }

    .status-bar {
      display: flex;
      padding: 8px 20px;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border);
      font-size: 12px;
      color: var(--text-secondary);
    }

    .status-bar span {
      margin-right: 20px;
    }

    @media (max-width: 768px) {
      .container {
        flex-direction: column;
      }
      .editor-pane {
        border-right: none;
        border-bottom: 1px solid var(--border);
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>QuickPost</h1>
    <button id="newBtn">New Post</button>
    <button id="saveBtn">Save</button>
    <button id="exportBtn">Export</button>
  </div>

  <div class="container">
    <div class="editor-pane">
      <div class="pane-header">Markdown</div>
      <textarea id="editor" placeholder="Start writing in markdown...

# Heading 1
## Heading 2

**Bold text** and *italic text*

- Bullet point
- [ ] Task item
- [x] Completed task

\`inline code\` and code blocks:

\`\`\`javascript
console.log('Hello, World!');
\`\`\`

[Link text](https://example.com)
![Alt text](image.png)

> Blockquote

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |"></textarea>
    </div>
    <div class="preview-pane">
      <div class="pane-header">Preview</div>
      <div id="preview"></div>
    </div>
  </div>

  <div class="status-bar">
    <span id="wordCount">0 words</span>
    <span id="charCount">0 characters</span>
    <span id="status">Ready</span>
  </div>

  <script>
    // Embedded Marked.js
    ${markedSource}

    // Configure marked for GitHub Flavored Markdown
    marked.use({
      gfm: true,
      breaks: true,
    });

    // Simple HTML sanitizer (basic XSS protection)
    function sanitizeHtml(html) {
      const temp = document.createElement('div');
      temp.innerHTML = html;

      // Remove script tags and event handlers
      const scripts = temp.querySelectorAll('script');
      scripts.forEach(s => s.remove());

      const allElements = temp.querySelectorAll('*');
      allElements.forEach(el => {
        // Remove all event handlers
        for (let attr of el.attributes) {
          if (attr.name.startsWith('on')) {
            el.removeAttribute(attr.name);
          }
        }
      });

      return temp.innerHTML;
    }

    // Update preview
    function updatePreview() {
      const editor = document.getElementById('editor');
      const preview = document.getElementById('preview');

      try {
        const html = marked.parse(editor.value);
        preview.innerHTML = sanitizeHtml(html);

        // Handle task list checkboxes
        preview.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.disabled = false;
          cb.addEventListener('change', (e) => {
            e.preventDefault();
            // In a real app, this would update the markdown source
            console.log('Task toggled');
          });
        });
      } catch (error) {
        console.error('Markdown parsing error:', error);
        preview.innerHTML = '<p style="color: red;">Error parsing markdown</p>';
      }

      updateStatus();
    }

    // Update status bar
    function updateStatus() {
      const text = document.getElementById('editor').value;
      const words = text.trim().split(/\\s+/).filter(w => w.length > 0).length;
      const chars = text.length;

      document.getElementById('wordCount').textContent = \`\${words} words\`;
      document.getElementById('charCount').textContent = \`\${chars} characters\`;
    }

    // Save post
    async function savePost() {
      const content = document.getElementById('editor').value;
      const title = content.split('\\n')[0].replace(/^#\\s*/, '') || 'Untitled';

      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content })
        });

        if (response.ok) {
          const post = await response.json();
          document.getElementById('status').textContent = 'Saved';
          window.currentPostId = post.id;
          setTimeout(() => {
            document.getElementById('status').textContent = 'Ready';
          }, 2000);
        }
      } catch (error) {
        console.error('Failed to save:', error);
        document.getElementById('status').textContent = 'Error saving';
      }
    }

    // Export post
    async function exportPost() {
      const content = document.getElementById('editor').value;
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'post.md';
      a.click();
      URL.revokeObjectURL(url);
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
      const editor = document.getElementById('editor');

      // Update preview on input with debouncing
      let debounceTimer;
      editor.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updatePreview, 100);
      });

      // Save shortcut (Cmd/Ctrl + S)
      editor.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault();
          savePost();
        }
      });

      // Button handlers
      document.getElementById('saveBtn').addEventListener('click', savePost);
      document.getElementById('exportBtn').addEventListener('click', exportPost);
      document.getElementById('newBtn').addEventListener('click', () => {
        if (confirm('Create a new post? Unsaved changes will be lost.')) {
          editor.value = '';
          window.currentPostId = null;
          updatePreview();
        }
      });

      // Initial update
      updatePreview();

      // Auto-save draft to localStorage
      setInterval(() => {
        localStorage.setItem('quickpost-draft', editor.value);
      }, 5000);

      // Restore draft
      const draft = localStorage.getItem('quickpost-draft');
      if (draft) {
        editor.value = draft;
        updatePreview();
      }

      // Focus editor
      editor.focus();
    });
  </script>
</body>
</html>`;

  await Deno.writeTextFile("./static/index.html", htmlTemplate);
  console.log("✅ Built static/index.html with embedded Marked.js");
}

if (import.meta.main) {
  await buildStandaloneHTML();
}
