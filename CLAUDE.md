# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

<overview>
QuickPost is a lightweight, local web-based markdown editor built with Deno for rapid blog post creation. The project emphasizes minimal dependencies, sub-second startup time, and a distraction-free writing experience. This is currently a greenfield project with only a PRD defined.
</overview>

<context>
This project is inspired by koaning/draft but built specifically with Deno for its TypeScript support and ability to create single executable files. The architecture is local-first with no external dependencies or network requests.
</context>

<commands>
<development>
- `deno run --allow-net --allow-read --allow-write mod.ts` - Start development server
- `deno test --allow-read --allow-write` - Run all tests
- `deno fmt` - Format code
- `deno lint` - Lint code
- `deno compile --allow-net --allow-read --allow-write --output quickpost mod.ts` - Build single executable
</development>

<testing>
- `deno test` - Run unit tests
- `deno test --coverage` - Run tests with coverage
- Use Deno's built-in testing framework exclusively
</testing>
</commands>

<architecture>
<backend>
- **Entry Point**: `mod.ts` - CLI and server launcher
- **Server**: `server.ts` - HTTP server with API routes
- **File Structure**: Each blog post in its own folder with `index.md` and images
- **Storage**: Local filesystem, no database
- **Port**: Default 7777, configurable via config.json
</backend>

<frontend>
- **Single File**: `static/index.html` with embedded CSS/JS
- **No Build Step**: Vanilla JavaScript, no frameworks or bundlers
- **Styling**: Dark theme (Typora Blackout inspired)
- **Features**: Split-pane editor with live markdown preview
</frontend>

<api_design>

- `GET /` - Serve main interface
- `GET /api/posts` - List all posts
- `GET /api/posts/:folder` - Get specific post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:folder` - Update post
- `DELETE /api/posts/:folder` - Delete post
- `POST /api/posts/:folder/upload` - Upload images </api_design>
  </architecture>

<performance_requirements critical="true">

- **Startup Time**: Sub-second from CLI command to browser
- **Binary Size**: ~741KB standalone executable with all assets embedded
- **Typing Lag**: No perceptible lag during typing
- **Preview Updates**: <50ms from keystroke to preview update
- **Memory Usage**: Minimal - single executable with low overhead </performance_requirements>

<technology_constraints>
<required>

- **Runtime**: Deno only (no Node.js/npm)
- **Frontend**: Vanilla JavaScript (no React/Vue/Angular)
- **Styling**: No CSS frameworks (Bootstrap/Tailwind)
- **Build**: No bundlers (Webpack/Vite/Rollup)
- **Network**: No external CDNs or API calls
  </required>

<preferred_patterns>

- Use Deno standard library exclusively: https://jsr.io/@std
- Web Standard APIs where possible
- TypeScript strict mode with proper types
- Async/await over promise chains
- Error handling with proper Result types or explicit error objects </preferred_patterns>
  </technology_constraints>

<development_workflow> <tdd_approach mandatory="true"> Even though no code exists yet, follow strict
TDD:

1. Write failing test for smallest feature
2. Implement minimal code to pass
3. Refactor while keeping tests green
4. Repeat for each feature

Example progression:

1. Test server startup → implement basic server
2. Test static file serving → add file serving
3. Test API endpoints → implement REST API
4. Test file operations → add post management </tdd_approach>

<testing_strategy>

- **Unit Tests**: All business logic and utility functions
- **Integration Tests**: API endpoints and file operations
- **E2E Tests**: Use Deno's built-in testing with browser automation
- **Coverage Target**: 90%+ for new code
- **Test Files**: Co-locate with source files using `_test.ts` suffix </testing_strategy>

<commit_strategy>

- Use conventional commits: `feat(editor): add markdown parsing`
- Commit frequently at logical boundaries
- Each commit should have passing tests
- Run `deno fmt && deno lint && deno test` before every commit </commit_strategy>
  </development_workflow>

<file_organization>

```
quickpost/
├── mod.ts                 # CLI entry point and server launcher
├── server.ts             # HTTP server and routing logic
├── lib/
│   ├── config.ts         # Configuration management
│   ├── posts.ts          # Post file operations
│   ├── markdown.ts       # Markdown processing
│   └── utils.ts          # Shared utilities
├── lib/
│   ├── config_test.ts    # Config tests
│   ├── posts_test.ts     # Post management tests
│   └── markdown_test.ts  # Markdown processing tests
├── static/
│   └── index.html        # Single-page application
├── posts/                # Default blog post storage
├── config.json           # Runtime configuration
├── PRD.md               # Product requirements
└── CLAUDE.md            # This file
```

</file_organization>

<security_requirements>

- **Input Sanitization**: All markdown content must be sanitized for XSS
- **File System**: Restrict access to designated directories only
- **Path Validation**: Prevent directory traversal attacks
- **CSP Headers**: Implement Content Security Policy
- **No External Requests**: Completely offline operation </security_requirements>

<coding_standards> <typescript_rules critical="true">

- NEVER use `any` type - use `unknown` with type guards
- Enable strict mode in deno.json
- Proper error handling with Result types or explicit Error objects
- Use type assertions sparingly and with runtime checks </typescript_rules>

<naming_conventions>

- **Files**: kebab-case for modules, PascalCase for types
- **Functions**: camelCase, descriptive names (e.g., `createPostDirectory`)
- **Constants**: SCREAMING_SNAKE_CASE
- **Interfaces**: PascalCase with descriptive names (e.g., `PostMetadata`) </naming_conventions>

<error_handling>

- Use Result types for operations that can fail
- Explicit error objects with context
- Graceful degradation (create missing directories, etc.)
- Clear error messages for users
- Auto-recovery using LocalStorage for unsaved work </error_handling> </coding_standards>

<dependencies>
<allowed>
- Deno standard library only: https://jsr.io/@std
- Specifically useful modules:
  - `@std/http` for server functionality
  - `@std/fs` for file operations
  - `@std/path` for path manipulation
  - `@std/testing` for test utilities
  - `@std/assert` for assertions
</allowed>

<forbidden>
- Any npm packages
- External CDNs or network resources
- Frontend frameworks or libraries
- CSS frameworks
- Build tools or bundlers
</forbidden>
</dependencies>

<launch_workflow>

1. `quickpost` command launches Deno server
2. Server starts on localhost:7777 (or configured port)
3. Automatically opens default browser
4. Single HTML page loads with embedded JavaScript
5. JavaScript connects to local API for file operations
6. Ready to write in <1 second total </launch_workflow>

<success_criteria>

- Launch time consistently under 1 second
- Zero runtime dependencies beyond Deno
- Total codebase under 1000 lines
- Works completely offline
- Single executable distribution
- No build or compilation step for development </success_criteria>

<getting_started> Since this is a greenfield project, start with:

1. Create basic project structure with `deno.json`
2. Implement and test core server functionality
3. Add static file serving
4. Build REST API for post management
5. Create frontend interface
6. Add markdown processing and live preview
7. Implement drag-and-drop image uploads
8. Package as single executable

Always follow TDD - write tests first for each component. </getting_started>
