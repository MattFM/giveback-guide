# Remove Deprecated Notion Loader Infrastructure

Run this cleanup once the custom `src/lib/notion-loader.ts` is proven stable in production.

## Files to Modify

### 1. `package.json`
Remove the deprecated package from `devDependencies`:

```diff
  "devDependencies": {
-   "@chlorinec-pkgs/notion-astro-loader": "^1.1.2",
    "@notionhq/client": "^2.3.0",
    "@tailwindcss/typography": "^0.5.19",
    "wrangler": "^4.61.1"
  },
```

### 2. `src/lib/notion-loader.ts`
Remove the revert-block comment at the bottom of the file (lines 127–142). Keep only the active custom loader code.

### 3. `.github/copilot-instructions.md`
Update the outdated reference to the old loader (line 87). Replace:

```diff
- Content is loaded at **build time** via `@chlorinec-pkgs/notion-astro-loader` in `src/content.config.ts`
+ Content is loaded at **build time** via a custom Notion loader (`src/lib/notion-loader.ts`) in `src/content.config.ts`
```

## Commands to Run

After editing the files above, run:

```bash
pnpm install
```

This will remove the deprecated package from `node_modules` and clean up `pnpm-lock.yaml`.

## Post-Cleanup Verification

1. Run `pnpm run build` locally — it should pass.
2. Trigger a deploy via GitHub Actions — it should pass.
3. Check that no references to `@chlorinec-pkgs` remain in the repo:
   ```bash
   grep -r "@chlorinec-pkgs" . --exclude-dir=node_modules --exclude-dir=.git
   ```

## Rollback

If anything breaks, restore from Git:
```bash
git checkout -- package.json pnpm-lock.yaml src/lib/notion-loader.ts
pnpm install
```
