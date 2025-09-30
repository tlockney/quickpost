# QuickPost Priority Improvements Plan

## Overview

This document outlines the incremental improvement plan to address the three highest-priority issues
identified in the QuickPost codebase review.

## Item 1: Fix TypeScript `any` Type Usage

**Location:** lib/posts.ts:41, 51

**Goal:** Replace `Record<string, any>` with proper type-safe alternatives

**Approach:**

- Define a proper `Frontmatter` interface with known fields (title, slug, publishDate, createdAt,
  updatedAt, draft)
- Use `Record<string, unknown>` for additional/custom fields
- Add type guards to safely access and validate values
- Keep changes minimal - only modify the type definitions and add validation where needed

**Benefits:**

- Compliance with TypeScript strict mode rules
- Better type safety without performance impact
- No functional changes, purely type improvements

**Estimated Impact:** ~20 lines changed, zero runtime performance impact

---

## Item 2: Add Image Upload Functionality

**Goal:** Enable drag-and-drop image uploads stored alongside posts

**Decision Point:** Given the current flat-file structure (`posts/my-post.md`), we need to choose:

### Option A: Minimal - Keep flat files, store images separately

- Posts stay as `posts/slug.md`
- Images go in `posts/images/slug/uuid.ext`
- Simpler migration, no existing post disruption
- ~100 lines of code (API endpoint + frontend)

### Option B: PRD-compliant - Migrate to folder structure

- Posts become `posts/slug/index.md`
- Images in `posts/slug/uuid.ext`
- Requires migration logic for existing posts
- Better organization, PRD-aligned
- ~150 lines of code (migration + API + frontend)

**Recommendation:** Option A for lightweight efficiency

- Faster to implement
- No breaking changes to existing posts
- Simpler file organization
- Can migrate to folders later if needed

**Implementation Steps:**

1. Add image storage directory creation
2. Add `POST /api/posts/:id/upload` endpoint with UUID naming
3. Add drag-and-drop zone to editor UI
4. Add image list/preview in the editor
5. Return image markdown syntax to insert in editor
6. Add tests for upload functionality

**Estimated Impact:** ~100-120 lines total, minimal runtime overhead

---

## Item 3: Implement LocalStorage Auto-Save

**Goal:** Protect against data loss with automatic draft saving

**Approach:**

- Store current post content + title in LocalStorage every 5 seconds
- Key format: `quickpost:draft` (single draft at a time, lightweight)
- On page load, check for unsaved draft and prompt user to restore
- Clear LocalStorage on successful save
- Add visual indicator showing "Draft saved at HH:MM:SS"

**Implementation Steps:**

1. Add auto-save timer (5 second interval) in frontend JavaScript
2. Store `{ title, content, timestamp }` in LocalStorage
3. On page load, check for existing draft and show restore prompt
4. Clear draft on successful POST/PUT to server
5. Add unobtrusive "Draft saved" indicator in UI

**Benefits:**

- Protection against browser crashes/accidental closes
- No server-side changes needed
- Minimal performance impact (localStorage is synchronous but fast)
- ~60-80 lines of JavaScript

**Estimated Impact:** ~70 lines, negligible performance impact

---

## Summary

**Total estimated additions:** ~200-250 lines of code **Current total:** 5,946 lines (mostly
vendored libraries) **New total:** ~6,200 lines (still under budget for core code)

**Order of execution:**

1. **Item 1** - Pure type safety, no functional changes
2. **Item 2** - Core feature, enables richer content
3. **Item 3** - Safety feature, frontend-only

All three items maintain the lightweight philosophy while adding critical functionality.
