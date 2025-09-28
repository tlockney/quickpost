# QuickPost

A lightweight, local web-based markdown editor built with Deno for rapid blog post creation.

## Features

- **Sub-second startup** - Ready to write in under 1 second
- **Real-time preview** - Live markdown rendering with syntax highlighting
- **Slug-based file naming** - Clean, SEO-friendly URLs from post titles
- **Frontmatter support** - YAML frontmatter with custom slug override
- **Auto title extraction** - Smart title detection from content or frontmatter
- **Editable title field** - Seamless in-place title editing
- **Dark theme interface** - Optimized for distraction-free writing
- **Single executable** - Distributes as one file with no dependencies
- **Completely offline** - No external network requests or CDNs

## Quick Start

### Prerequisites

- [Deno](https://deno.land/) installed on your system

### Installation & Usage

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/quickpost.git
   cd quickpost
   ```

2. **Run the development server**
   ```bash
   deno run --allow-net --allow-read --allow-write mod.ts
   ```

3. **Open your browser**
   - QuickPost automatically opens at `http://localhost:7777`
   - Start writing immediately in the markdown editor
   - See live preview with syntax highlighting

### Build Single Executable

```bash
deno compile --allow-net --allow-read --allow-write --output quickpost mod.ts
./quickpost
```

## Usage

### Writing Posts

1. **Start typing** - Begin writing in the markdown editor
2. **Auto title extraction** - Title field automatically populates from your first heading or frontmatter
3. **Edit title** - Click the title field to manually override the extracted title
4. **Save post** - Use Ctrl/Cmd+S or click Save button
5. **Export** - Download your post as a markdown file

### File Organization

Posts are automatically organized in the `posts/` directory:

```
posts/
├── my-first-post/
│   ├── post.md          # Your markdown content
│   ├── meta.json        # Post metadata
│   └── images/          # Directory for post images
└── another-post/
    ├── post.md
    ├── meta.json
    └── images/
```

### Frontmatter Support

Use YAML frontmatter to customize your posts:

```markdown
---
title: My Custom Title
slug: custom-url-slug
---

# Post Content

Your markdown content here...
```

**Supported frontmatter fields:**
- `title` - Custom post title (overrides auto-extracted title)
- `slug` - Custom URL slug (overrides auto-generated slug)

### Keyboard Shortcuts

- `Ctrl/Cmd + S` - Save post
- `Ctrl/Cmd + N` - New post (via New Post button)

## API Reference

QuickPost provides a REST API for programmatic access:

- `GET /api/posts` - List all posts
- `GET /api/posts/:id` - Get specific post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update existing post
- `DELETE /api/posts/:id` - Delete post

## Configuration

### Default Settings

- **Port**: 7777 (configurable via config.json)
- **Posts directory**: `./posts`
- **Auto-open browser**: Yes

### Custom Configuration

Create a `config.json` file to customize settings:

```json
{
  "port": 8080,
  "postsDir": "./my-posts",
  "autoOpen": false
}
```

## Development

### Project Structure

```
quickpost/
├── mod.ts              # CLI entry point and server launcher
├── server.ts           # HTTP server and routing logic
├── lib/
│   ├── posts.ts        # Post file operations
│   ├── markdown.ts     # Markdown processing
│   └── *_test.ts       # Test files
├── static/
│   └── index.html      # Single-page application
├── deno.json           # Deno configuration
└── README.md           # This file
```

### Running Tests

```bash
# Run all tests
deno test --allow-read --allow-write

# Run tests with coverage
deno test --allow-read --allow-write --coverage
```

### Code Quality

```bash
# Format code
deno fmt

# Lint code
deno lint
```

## Technical Details

### Architecture

- **Backend**: Deno runtime with TypeScript
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Markdown**: Marked.js library with GitHub Flavored Markdown
- **Syntax highlighting**: Prism.js with multiple language support
- **Storage**: Local filesystem with JSON metadata
- **Styling**: CSS custom properties with dark theme

### Performance

- **Startup time**: < 1 second from command to browser
- **Bundle size**: Single executable under 50MB
- **Memory usage**: Minimal overhead, scales with content
- **Preview latency**: < 50ms from keystroke to preview update

### Browser Support

- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`deno test --allow-read --allow-write`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Add tests for new functionality
- Use conventional commit messages
- Maintain sub-second startup time
- Keep bundle size minimal

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Deno](https://deno.land/) - Secure runtime for JavaScript and TypeScript
- [Marked.js](https://marked.js.org/) - Markdown parser and compiler
- [Prism.js](https://prismjs.com/) - Syntax highlighting library
- Inspired by [koaning/draft](https://github.com/koaning/draft) for the local-first approach