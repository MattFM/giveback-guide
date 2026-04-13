# Staff Documentation - Markdown Export (Notion-Optimized)

> **For Notion Import**  
> **Date Exported:** April 2026  
> **Format:** Markdown optimized for Notion copy-paste

---

## Contents

This directory contains all internal staff documentation converted to **Notion-optimized Markdown** format.

### How-To Guides (`/how-tos/`)

Technical implementation guides:

| File | Topic | Lines |
|------|-------|-------|
| `integrated-header.md` | Header system implementation | ~430 |
| `navigation-drawer.md` | Navigation component guide | ~110 |
| `responsive-images.md` | Cloudinary integration | ~470 |

### Research (`/research/`)

Design and user research:

| File | Topic | Lines |
|------|-------|-------|
| `ford-foundation-design-system.md` | Design analysis | ~500 |
| `layout-design-survey.md` | User research survey | ~240 |

### Planning

Architecture roadmap:

| File | Topic | Lines |
|------|-------|-------|
| `locations-database-plan.md` | Database restructure | ~660 |

### Examples (`/examples/`)

Interactive page summaries:

| File | Topic | Type |
|------|-------|------|
| `design-system.md` | Design tokens showcase | Summary |
| `hero-examples.md` | Hero component demos | Summary |
| `index.md` | Staff docs landing | Summary |

---

## How to Import to Notion

### Method 1: Copy-Paste (Recommended)

1. **Open the .md file** in a text editor (VS Code, TextEdit, etc.)
2. **Select all content** (Cmd+A / Ctrl+A)
3. **Copy** (Cmd+C / Ctrl+C)
4. **Paste into Notion** (Cmd+V / Ctrl+V)
5. **Notion automatically formats:**
   - Headings → Notion headings
   - Tables → Notion tables
   - Code blocks → Code snippets
   - Lists → Bulleted/numbered lists
   - Callouts (>) → Notion callouts
   - Bold/italic → Rich text

### Method 2: Notion Import Feature

1. In Notion, click "+" to add a new page
2. Select "Import" → "Markdown"
3. Upload the .md file
4. Notion will import and format automatically

---

## Formatting Features

All files include:

✅ **Notion-style callouts at the top** - Using `>` blockquotes  
✅ **Clean heading hierarchy** - Proper H1, H2, H3 structure  
✅ **Well-formatted tables** - Using `|` pipe syntax  
✅ **Code blocks with language** - Using triple backticks + language  
✅ **Clear section dividers** - Using `---` horizontal rules  
✅ **Task/checkbox lists** - Using `- [ ]` syntax  
✅ **Bold/italic emphasis** - Using `**` and `*`

---

## Total Documentation

- **10 comprehensive guides**
- **~2,400 lines of documentation**
- **All technical implementation details**
- **Ready for immediate Notion import**

---

## File Structure

```
staff-markdown/
├── README.md
├── index.md
├── locations-database-plan.md
├── examples/
│   ├── design-system.md
│   └── hero-examples.md
├── how-tos/
│   ├── integrated-header.md
│   ├── navigation-drawer.md
│   └── responsive-images.md
└── research/
    ├── ford-foundation-design-system.md
    └── layout-design-survey.md
```

---

## Note on Example Files

The `/examples/` folder contains **summaries** of interactive Astro pages. These are not markdown versions of the pages themselves, but rather documentation about what each page contains and how to view it.

To see the actual interactive examples:
1. Run `npm run dev`
2. Visit the URLs mentioned in each summary file

---

## Tips for Best Results

1. **Open in VS Code or similar** for best copy-paste experience
2. **Copy the entire file** - don't select partial content
3. **Paste into a blank Notion page** for cleanest import
4. **Check tables after pasting** - occasionally need minor adjustment
5. **Review code blocks** - ensure language tags preserved

---

## Need Help?

If you encounter any issues with the formatting:
1. Try the copy-paste method if import fails
2. Check that tables have proper `|` delimiters
3. Ensure code blocks have language specified (e.g., ` ```typescript `)
4. Contact [your-email] for assistance
