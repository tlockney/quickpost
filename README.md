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
- **Standalone binary** - True single-file distribution with bundled assets
- **Completely offline** - No external network requests or CDNs
- **Asset bundling** - All static resources embedded in executable for portability
- **Syntax highlighting** - Support for TypeScript, JavaScript, Python, SQL, Markdown, Bash, JSON,
  Lua, Go, Rust, Java, Docker, and YAML

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
   # Use convenient task commands
   deno task dev    # Start with watch mode
   deno task start  # Start production mode

   # Or run directly with options
   deno run --allow-net --allow-read --allow-write --allow-run mod.ts [OPTIONS] [POSTS_DIRECTORY]

   # Examples:
   ./quickpost --help                        # Show help
   ./quickpost                               # Use default settings
   ./quickpost --port 8080                   # Custom port
   ./quickpost --no-open ./my-blog          # Custom directory, no browser
   ./quickpost -p 3000 ~/Documents/posts    # Short flags
   ```

3. **Open your browser**
   - QuickPost automatically opens at `http://localhost:7777`
   - Start writing immediately in the markdown editor
   - See live preview with syntax highlighting

### Build Standalone Binary

```bash
# Build with bundled assets (recommended for distribution)
deno task build

# Or compile without bundling (development mode)
deno task compile

# Run standalone binary
./quickpost                    # Use default posts directory
./quickpost /path/to/posts     # Use custom directory
```

The `deno task build` command:

1. Bundles all static assets (HTML, CSS, JS) into the binary
2. Creates a truly portable executable with no external dependencies
3. Results in a single standalone executable file

## Usage

### Writing Posts

1. **Start typing** - Begin writing in the markdown editor
2. **Auto title extraction** - Title field automatically populates from your first heading or
   frontmatter
3. **Edit title** - Click the title field to manually override the extracted title
4. **Save post** - Use Ctrl/Cmd+S or click Save button
5. **Export** - Download your post as a markdown file

### File Organization

Posts are automatically organized in the posts directory (defaults to `./posts` in your current
working directory, or the custom directory you specify):

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
- **Posts directory**: `./posts` (relative to current working directory, configurable via
  command-line argument)
- **Auto-open browser**: Yes

### Directory Configuration

QuickPost supports flexible directory configuration for storing your posts:

**Default Behavior:**

- Posts are stored in `./posts` relative to your current working directory
- If you run QuickPost from `/home/user/blog`, posts will be stored in `/home/user/blog/posts`

**Custom Directory:**

- Pass a directory path as the first argument:
  `deno run --allow-net --allow-read --allow-write mod.ts /path/to/posts`
- Supports both absolute paths (`/home/user/my-blog`) and relative paths (`../blog-posts`)
- The directory will be created automatically if it doesn't exist

### Custom Configuration

Create a `config.json` file to customize settings:

```json
{
  "port": 8080,
  "autoOpen": false
}
```

**Note:** Directory configuration is handled via command-line arguments, not the config file.

## Development

### Project Structure

```
quickpost/
├── mod.ts                      # CLI entry point and server launcher
├── server.ts                   # HTTP server with asset bundling support
├── deno.json                   # Deno configuration and tasks
├── lib/
│   ├── posts.ts               # Post file operations
│   ├── markdown.ts            # Markdown processing
│   ├── bundled-assets.ts      # Generated bundled assets (gitignored)
│   └── *_test.ts              # Test files
├── scripts/
│   └── bundle-assets.ts       # Asset bundler for standalone binary
├── static/
│   ├── index.html             # Main application interface
│   ├── marked.min.js          # Markdown parser
│   ├── prism*.min.js          # Syntax highlighting
│   └── prism-dark.css         # Dark theme styles
├── posts/                     # Default blog post storage
├── .gitignore                 # Git ignore patterns
└── README.md                  # This file
```

### Running Tests

```bash
# Use task commands (recommended)
deno task test              # Run all tests
deno task test:watch        # Run tests in watch mode
deno task test:coverage     # Run tests with coverage

# Or run directly
deno test --allow-read --allow-write --allow-env --allow-sys --allow-net
```

### Code Quality

```bash
# Use task commands
deno task fmt     # Format code
deno task lint    # Lint code
deno task check   # Type check

# Asset bundling
deno task bundle  # Generate bundled assets
```

## Technical Details

### Architecture

- **Backend**: Deno runtime with TypeScript
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Markdown**: Marked.js library with GitHub Flavored Markdown
- **Syntax highlighting**: Prism.js with support for TypeScript, JavaScript, Python, SQL, Markdown,
  Bash, JSON, Lua, Go, Rust, Java, Docker, and YAML
- **Storage**: Local filesystem with JSON metadata
- **Styling**: CSS custom properties with dark theme

### Performance

- **Startup time**: < 1 second from command to browser
- **Binary size**: Standalone executable with all assets and language support bundled
- **Memory usage**: Minimal overhead, scales with content
- **Preview latency**: < 50ms from keystroke to preview update
- **Asset loading**: Instant (embedded in binary) vs filesystem reads in dev mode

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
- Use `deno task build` for distribution builds
- Test both development and standalone binary modes

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Deno](https://deno.land/) - Secure runtime for JavaScript and TypeScript
- [Marked.js](https://marked.js.org/) - Markdown parser and compiler
- [Prism.js](https://prismjs.com/) - Syntax highlighting library
- Inspired by [koaning/draft](https://github.com/koaning/draft) for the local-first approach
