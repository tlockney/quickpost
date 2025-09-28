# Product Requirements Document: QuickPost

## Overview

A lightweight, local web-based markdown editor optimized for rapid blog post creation with
near-instant startup time and minimal dependencies. Inspired by
[koaning/draft](https://github.com/koaning/draft) but built with Deno for its built-in TypeScript
support, secure-by-default architecture, and ability to create single executable files.

## Problem Statement

Writers need a frictionless way to capture thoughts and draft blog posts without the overhead of
opening heavy applications or navigating complex interfaces. Current solutions either require too
much setup, take too long to load, or have unnecessary complexity.

## Goals

- Sub-second launch time from terminal command
- Zero-friction writing experience
- Beautiful, distraction-free interface inspired by Typora's Blackout theme
- Minimal external dependencies
- Local-first architecture
- Single executable distribution

## User Stories

1. **As a writer**, I want to launch the editor from anywhere via terminal command or keyboard
   shortcut so I can immediately capture ideas.

2. **As a writer**, I want to see my markdown rendered in real-time so I can visualize the final
   output while writing.

3. **As a writer**, I want my work automatically saved locally so I never lose progress.

4. **As a writer**, I want to export my finished posts so I can publish them elsewhere.

## Functional Requirements

### Inspiration from draft

Key features to adopt from [koaning/draft](https://github.com/koaning/draft):

- Clean folder structure with each post in its own directory containing `index.md` and associated
  images
- Drag-and-drop image uploads with automatic UUID naming
- Frontmatter support for metadata (title, date, etc.)
- Keyboard shortcuts for common actions
- Auto-save functionality
- Simple, focused UI with live preview

### Core Features

**Editor**

- Split-pane view: markdown editor (left), live preview (right)
- Syntax highlighting for markdown
- Auto-save to local storage every 5 seconds
- Word count and reading time display
- Support for common markdown extensions (tables, footnotes, task lists)
- Drag-and-drop image upload with automatic UUID naming
- Image preview in editor

**File Management**

- Create new post with automatic timestamp-based folder name
- Each post stored in its own folder with index.md and images
- Save to designated local directory (default: `./posts/`)
- Export as .md, .html, or .txt
- Recent files list (last 10 posts)
- Open existing markdown files from posts directory
- Frontmatter support for metadata (title, date, tags)

**Launch Methods**

- CLI command: `quickpost` or `qp`
- Automatically opens default browser to localhost:7777
- Optional: System tray icon for quick access

### Performance Requirements

- Browser window opens in <1 second
- No perceptible lag during typing
- Preview updates within 50ms of keystroke
- Total bundle size <100KB

## Technical Requirements

### Architecture

**Backend (Deno)**

- Single executable file
- HTTP server on localhost (default port: 7777)
- File system access for saving/loading posts
- Automatic browser launch on server start
- Graceful shutdown on window close

**Frontend**

- Vanilla JavaScript only
- Single HTML file with embedded CSS/JS
- No build step required
- LocalStorage for temporary saves
- Inline markdown parser (no external CDN)

### Styling

Based on Typora Blackout theme:

- Dark background (#1e1e1e)
- High contrast text (#e0e0e0)
- Accent color for links/headers (#4fc3f7)
- Monospace font for code blocks (Consolas, 'Courier New', monospace)
- Clean typography with generous spacing
- Smooth transitions for UI interactions

### Dependencies

**Required:**

- Deno runtime
- Modern browser (Chrome/Firefox/Safari latest 2 versions)

**Explicitly Avoided:**

- Node.js/npm
- Frontend frameworks (React, Vue, Angular)
- CSS frameworks (Bootstrap, Tailwind)
- Build tools (Webpack, Vite, Rollup)
- External CDNs or network requests

## File Structure

```
quickpost/
├── mod.ts           # Main Deno server entry point
├── server.ts        # HTTP server logic and routes
├── static/
│   └── index.html   # Single page with embedded CSS/JS
├── posts/           # Default save directory
│   ├── my-first-post/
│   │   ├── index.md
│   │   └── image1.png
│   └── another-post/
│       ├── index.md
│       └── diagram.jpg
└── config.json      # User preferences
```

Posts are organized like draft: each post gets its own folder with `index.md` for content and any
uploaded images stored alongside.

## Configuration

Config file (`config.json`) should support:

```json
{
  "port": 7777,
  "postsDirectory": "./posts",
  "autoSaveInterval": 5000,
  "theme": "blackout"
}
```

## API Endpoints

- `GET /` - Serve the main HTML interface
- `GET /api/posts` - List all post folders
- `GET /api/posts/:folder` - Get post content and metadata
- `POST /api/posts` - Create new post folder with index.md
- `PUT /api/posts/:folder` - Update existing post
- `DELETE /api/posts/:folder` - Delete post folder
- `POST /api/posts/:folder/upload` - Upload image to post folder
- `GET /api/export/:folder` - Export post in specified format

## Keyboard Shortcuts

- `Ctrl+S` - Save current post
- `Ctrl+N` - New post
- `Ctrl+O` - Open post
- `Ctrl+E` - Export
- `Ctrl+/` - Toggle preview
- `Tab` - Insert 2 spaces (in editor)

## Success Metrics

- Launch time consistently under 1 second
- Zero runtime dependencies
- Total codebase under 1000 lines
- Works offline without any degradation
- No build or compilation step needed

## Non-Goals

- Collaborative editing
- Cloud synchronization
- Plugin system
- Multiple themes (only Blackout)
- Mobile support
- WYSIWYG editing
- Image uploads
- Database storage

## Security Considerations

- Sanitize markdown to prevent XSS in preview
- Restrict file system access to designated directories
- No external network requests
- Content Security Policy headers
- Validate all file paths to prevent directory traversal

## Error Handling

- Graceful fallback if posts directory doesn't exist (create it)
- Clear error messages for file permission issues
- Auto-recovery from failed saves using LocalStorage
- Prevent data loss during unexpected shutdown

This tool prioritizes speed and simplicity above all else, providing writers with an instant,
beautiful environment for capturing thoughts without any friction or setup overhead.
