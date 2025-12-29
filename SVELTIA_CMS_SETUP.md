# Sveltia CMS Setup Guide

## ✅ Installation Complete

Sveltia CMS has been installed and configured for managing your blog posts. The CMS will be accessible at:

**Local:** `http://localhost:4321/admin/`  
**Production:** `https://giveback.guide/admin/`

---

## 🔐 Required: Set Up GitHub OAuth

To authenticate with Sveltia CMS, you need to create a GitHub OAuth application:

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Settings → Developer Settings → OAuth Apps](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the details:
   - **Application name:** `Giveback Guide CMS`
   - **Homepage URL:** `https://giveback.guide`
   - **Authorization callback URL:** `https://api.netlify.com/auth/done`
     - Note: You can use Netlify's OAuth client even if you're not hosting on Netlify
     - Alternative: Set up [Sveltia's own OAuth client](https://github.com/sveltia/sveltia-cms-auth) on Cloudflare Workers

4. Click **"Register application"**
5. Copy your **Client ID** (you'll need this next)
6. Click **"Generate a new client secret"** and copy the secret

### Step 2: Update CMS Configuration

1. Open `/public/admin/config.yml`
2. Find the `backend:` section at the top
3. Add your OAuth app details:

```yaml
backend:
  name: github
  repo: MattFM/giveback-guide
  branch: main
  base_url: https://api.netlify.com  # Netlify's OAuth service
  auth_endpoint: auth
```

### Step 3 (Alternative): Use Personal Access Token (Developer Only)

For quick testing, you can skip OAuth and sign in with a GitHub Personal Access Token:

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Give it a name: `Giveback Guide CMS`
4. Select scopes: `repo` (full control of private repositories)
5. Click **"Generate token"** and copy it
6. When signing into the CMS, click **"Sign in with token"** and paste your PAT

⚠️ **Warning:** Personal access tokens bypass OAuth security and should only be used for testing or solo development.

---

## 📸 Cloudinary Configuration (Optional)

To enable image uploads directly to Cloudinary through the CMS:

1. Log in to your [Cloudinary Console](https://console.cloudinary.com/)
2. Go to **Settings → Access Keys**
3. Copy your **API Key**
4. Open `/public/admin/config.yml`
5. Find the `media_libraries:` section
6. Uncomment and add your API key:

```yaml
media_libraries:
  cloudinary:
    config:
      cloud_name: dnxl7wsnx
      api_key: YOUR_API_KEY_HERE  # Replace with your actual key
```

**Note:** Without the API key, you can still manually upload images to Cloudinary and paste URLs into the CMS.

---

## 🚀 Using the CMS

### Access the CMS

1. Start your dev server: `npm run dev`
2. Navigate to `http://localhost:4321/admin/`
3. Sign in with GitHub OAuth or Personal Access Token

### Create a New Blog Post

1. Click **"New Blog Post"** in the Collections sidebar
2. Fill in all required fields:
   - **Title:** Post headline
   - **Description:** SEO summary (150-160 chars)
   - **Slug:** URL path (e.g., `my-amazing-post`)
   - **Published Date:** Publication date
   - **Last Updated:** Modification date
   - **Tags:** Categorisation tags
   - **Cover Image:** Upload or paste Cloudinary URL
   - **Body:** Your post content in Markdown

3. Click **"Save"** (commits to GitHub with `[skip ci]` by default)
4. Or click **"Save and Publish"** (triggers deployment)

### Edit Existing Posts

1. Click on any post in the list
2. Make your changes
3. Save (commits changes to GitHub)

### Images in Blog Posts

- **Cover Image:** Use the image picker (uploads to Cloudinary/Blog folder)
- **In-body images:** 
  - Click the image icon in the Markdown editor
  - Upload or paste a Cloudinary URL
  - Images auto-convert to `ResponsiveImage` components via remark plugin

---

## 🔧 Configuration Details

### Current Setup

- **Backend:** GitHub (`MattFM/giveback-guide`, branch `main`)
- **Blog Location:** `src/content/blog/*.mdx`
- **Cloudinary:** Cloud name `dnxl7wsnx`, folder `Blog`
- **Auto-deployment:** Currently disabled by default (uses `[skip ci]` in commits)

### Enable/Disable Auto-Deployment

Edit `/public/admin/config.yml`:

```yaml
backend:
  skip_ci: false  # Set to false to deploy on every save
```

Or use **"Save and Publish"** button to manually trigger CI/CD.

---

## 📚 Additional Resources

- **Sveltia CMS Docs:** [github.com/sveltia/sveltia-cms](https://github.com/sveltia/sveltia-cms)
- **Configuration Reference:** [Schema Documentation](https://github.com/sveltia/sveltia-cms#getting-started)
- **Cloudinary Setup:** [Cloudinary Docs](https://cloudinary.com/documentation)

---

## 🐛 Troubleshooting

### "Authentication Aborted" Error

Check your site's Cross-Origin-Opener-Policy header. Change `same-origin` to `same-origin-allow-popups` if needed.

### Images Not Uploading

Ensure Cloudinary API key is correctly set in `config.yml` and you have upload permissions for the Blog folder.

### CMS Not Loading

1. Check the browser console for errors
2. Verify `index.html` and `config.yml` are in `/public/admin/`
3. Try clearing browser cache
4. Confirm GitHub repo name and branch are correct in config

### Changes Not Syncing

1. Pull latest from GitHub: `git pull origin main`
2. Check for merge conflicts
3. Ensure you have write access to the repository
