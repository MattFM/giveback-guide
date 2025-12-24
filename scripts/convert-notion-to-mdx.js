#!/usr/bin/env node

/**
 * Convert Notion Markdown exports to MDX files for Giveback Guide
 * 
 * Usage:
 *   node scripts/convert-notion-to-mdx.js <input-dir> [output-dir]
 * 
 * Example:
 *   node scripts/convert-notion-to-mdx.js ./notion-export ./src/content/blog
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEFAULT_OUTPUT_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');

// Component imports to add to each MDX file
const COMPONENT_IMPORTS = `import ResponsiveImage from '../../components/ui/Image/ResponsiveImage.astro';
import AdBox from '../../components/features/ads/AdBox.astro';
import SupportBox from '../../components/sections/SupportBox.astro';
`;

/**
 * Parse Notion-style metadata from markdown content
 */
function parseNotionMetadata(content) {
  const metadata = {
    title: '',
    description: '',
    coverImage: '',
    published: '',
    lastUpdated: '',
    tags: [],
    slug: '', // Notion might provide this
  };

  // Extract title (first h1)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  // Check for Notion property format (key: value at start of file)
  // This format appears when exporting with properties visible
  const propertySection = content.split(/\n#{1,6}\s+/)[0]; // Get content before first heading
  
  // Extract bDescription or Description
  const descMatch = propertySection.match(/^b?Description:\s*(.+)$/mi);
  if (descMatch) {
    metadata.description = descMatch[1].trim();
  }
  
  // Extract bCoverImage or coverImage
  const coverMatch = propertySection.match(/^b?CoverImage:\s*(.+)$/mi);
  if (coverMatch) {
    metadata.coverImage = coverMatch[1].trim();
  }
  
  // Extract bSlug or slug
  const slugMatch = propertySection.match(/^b?Slug:\s*(.+)$/mi);
  if (slugMatch) {
    metadata.slug = slugMatch[1].trim();
  }
  
  // Extract bPublished or Published (dd/mm/yyyy format)
  const publishedMatch = propertySection.match(/^b?Published:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/mi);
  if (publishedMatch) {
    const [, day, month, year] = publishedMatch;
    metadata.published = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Extract bLastUpdated or LastUpdated (dd/mm/yyyy format)
  const updatedMatch = propertySection.match(/^b?LastUpdated:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/mi);
  if (updatedMatch) {
    const [, day, month, year] = updatedMatch;
    metadata.lastUpdated = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Extract bTags or Tags
  const tagsMatch = propertySection.match(/^b?Tags:\s*(.+)$/mi);
  if (tagsMatch) {
    metadata.tags = tagsMatch[1]
      .split(/[,;]/)
      .map(tag => tag.trim())
      .filter(Boolean);
  }
  
  // Fallback: Look for dates in dd/mm/yyyy format anywhere in property section
  if (!metadata.published) {
    const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})/g;
    const dates = [];
    let match;
    while ((match = datePattern.exec(propertySection)) !== null) {
      const [, day, month, year] = match;
      dates.push(new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`));
    }
    
    if (dates.length > 0) {
      // Use the first date as published, most recent as updated
      dates.sort((a, b) => a - b);
      metadata.published = dates[0].toISOString().split('T')[0];
      metadata.lastUpdated = dates[dates.length - 1].toISOString().split('T')[0];
    }
  }
  
  // If lastUpdated not set, use published date
  if (!metadata.lastUpdated && metadata.published) {
    metadata.lastUpdated = metadata.published;
  }

  return metadata;
}

/**
 * Generate slug from filename, Notion property, or title
 */
function generateSlug(filename, title, notionSlug = '') {
  // If Notion provided a slug, use it
  if (notionSlug && notionSlug.trim()) {
    return notionSlug.trim();
  }
  
  // Remove .md extension and clean up filename
  let slug = filename.replace(/\.md$/, '');
  
  // Remove Notion's random ID suffix (e.g., "Title 1eb4f082c62a80be9b45e82737d05fa1.md")
  slug = slug.replace(/\s+[a-f0-9]{32}$/i, '');
  
  // If filename is generic (like "Untitled" or just a UUID), use title
  if (slug.match(/^(untitled|page|post)/i) || slug.match(/^[a-f0-9-]{32,}$/i) || !slug.trim()) {
    slug = title;
  }
  
  // Convert to URL-friendly format
  slug = slug
    .toLowerCase()
    .replace(/['']/g, '') // Remove apostrophes
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  return slug;
}

/**
 * Extract description from content (first paragraph after title)
 */
function extractDescription(content) {
  // Remove title
  const withoutTitle = content.replace(/^#\s+.+$/m, '').trim();
  
  // Get first paragraph
  const firstPara = withoutTitle.split(/\n\n/)[0];
  
  if (firstPara) {
    // Clean up markdown syntax and limit length
    const cleaned = firstPara
      .replace(/[*_`[\]]/g, '')
      .replace(/\n/g, ' ')
      .trim();
    
    return cleaned.length > 160 
      ? cleaned.substring(0, 157) + '...' 
      : cleaned;
  }
  
  return '';
}

/**
 * Find and validate Cloudinary URLs in content
 */
function validateCloudinaryUrls(content) {
  const urlPattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  const images = [];
  
  while ((match = urlPattern.exec(content)) !== null) {
    const [fullMatch, alt, url] = match;
    images.push({ alt, url, fullMatch });
  }
  
  return images;
}

/**
 * Convert markdown images to ResponsiveImage components (optional)
 */
function convertImagesToComponents(content, useComponents = false) {
  if (!useComponents) {
    return content;
  }
  
  const urlPattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  
  return content.replace(urlPattern, (match, alt, url) => {
    // Only convert Cloudinary images
    if (url.includes('cloudinary.com')) {
      return `\n<ResponsiveImage 
  src="${url}" 
  alt="${alt || 'Image'}"
  preset="card"
/>\n`;
    }
    return match;
  });
}

/**
 * Clean and process markdown content
 */
function processContent(content, metadata) {
  // Remove the title from content (it's in frontmatter)
  content = content.replace(/^#\s+.+$/m, '').trim();
  
  // Remove Notion property lines (Status, bTags, bSlug, etc.)
  content = content.replace(/^(Status|b?Title|b?Tags?|b?Published|b?Updated|b?LastUpdated|b?Slug|b?Description|b?CoverImage):\s*.+$/gmi, '').trim();
  
  // Clean up multiple blank lines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Ensure proper spacing around headings
  content = content.replace(/\n(#{2,6}\s)/g, '\n\n$1');
  
  return content;
}

/**
 * Create YAML frontmatter
 */
function createFrontmatter(metadata, slug) {
  const frontmatter = {
    title: metadata.title || 'Untitled Post',
    description: metadata.description || '',
    slug: slug,
    published: metadata.published || new Date().toISOString().split('T')[0],
    lastUpdated: metadata.lastUpdated || new Date().toISOString().split('T')[0],
    tags: metadata.tags,
    coverImage: metadata.coverImage || '',
  };
  
  // Build YAML manually to ensure proper formatting
  let yaml = '---\n';
  yaml += `title: "${frontmatter.title.replace(/"/g, '\\"')}"\n`;
  yaml += `description: "${frontmatter.description.replace(/"/g, '\\"')}"\n`;
  yaml += `slug: "${frontmatter.slug}"\n`;
  yaml += `published: ${frontmatter.published}\n`;
  yaml += `lastUpdated: ${frontmatter.lastUpdated}\n`;
  
  if (frontmatter.tags.length > 0) {
    yaml += 'tags:\n';
    frontmatter.tags.forEach(tag => {
      yaml += `  - "${tag.replace(/"/g, '\\"')}"\n`;
    });
  } else {
    yaml += 'tags: []\n';
  }
  
  if (frontmatter.coverImage) {
    yaml += `coverImage: "${frontmatter.coverImage}"\n`;
  }
  
  yaml += '---\n';
  
  return yaml;
}

/**
 * Convert a single markdown file to MDX
 */
function convertFile(inputPath, outputDir, options = {}) {
  const filename = path.basename(inputPath);
  const content = fs.readFileSync(inputPath, 'utf-8');
  
  console.log(`\nProcessing: ${filename}`);
  
  // Parse metadata
  const metadata = parseNotionMetadata(content);
  
  if (!metadata.title) {
    console.warn(`  ⚠️  No title found, using filename`);
    metadata.title = filename.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\s+[a-f0-9]{32}$/i, '');
  }
  
  // Generate slug (prefer Notion's bSlug if available)
  const slug = generateSlug(filename, metadata.title, metadata.slug);
  console.log(`  📝 Title: ${metadata.title}`);
  console.log(`  🔗 Slug: ${slug}`);
  
  // Extract description if not found
  if (!metadata.description) {
    metadata.description = extractDescription(content);
  }
  
  if (metadata.description) {
    console.log(`  📄 Description: ${metadata.description.substring(0, 60)}...`);
  }
  
  // Validate images
  const images = validateCloudinaryUrls(content);
  if (images.length > 0) {
    console.log(`  🖼️  Found ${images.length} image(s)`);
    images.forEach(img => {
      const isCloudinary = img.url.includes('cloudinary.com');
      console.log(`     ${isCloudinary ? '✅' : '⚠️ '} ${img.url}`);
      if (!isCloudinary) {
        console.warn(`        ^ Not a Cloudinary URL`);
      }
    });
    
    // Use first image as cover if no cover image set
    if (!metadata.coverImage && images.length > 0) {
      const cloudinaryImg = images.find(img => img.url.includes('cloudinary.com'));
      if (cloudinaryImg) {
        metadata.coverImage = cloudinaryImg.url;
        console.log(`  📸 Using first image as cover`);
      }
    }
  }
  
  // Tags
  if (metadata.tags.length > 0) {
    console.log(`  🏷️  Tags: ${metadata.tags.join(', ')}`);
  }
  
  // Dates
  if (metadata.published) {
    console.log(`  📅 Published: ${metadata.published}`);
  }
  
  // Process content
  let processedContent = processContent(content, metadata);
  
  // Convert images to components if requested
  if (options.useComponents) {
    processedContent = convertImagesToComponents(processedContent, true);
    console.log(`  🔄 Converted images to ResponsiveImage components`);
  }
  
  // Create frontmatter
  const frontmatter = createFrontmatter(metadata, slug);
  
  // Combine into MDX
  const mdxContent = `${frontmatter}\n${COMPONENT_IMPORTS}\n${processedContent}`;
  
  // Write output file
  const outputPath = path.join(outputDir, `${slug}.mdx`);
  fs.writeFileSync(outputPath, mdxContent, 'utf-8');
  console.log(`  ✅ Saved to: ${outputPath}`);
  
  return { slug, title: metadata.title, outputPath };
}

/**
 * Main conversion function
 */
function convertNotionExport(inputDir, outputDir = DEFAULT_OUTPUT_DIR, options = {}) {
  console.log('🚀 Notion to MDX Converter for Giveback Guide\n');
  console.log(`📂 Input directory: ${inputDir}`);
  console.log(`📂 Output directory: ${outputDir}\n`);
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ Created output directory\n`);
  }
  
  // Find all .md files in input directory
  const files = fs.readdirSync(inputDir)
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(inputDir, file));
  
  if (files.length === 0) {
    console.error('❌ No .md files found in input directory');
    process.exit(1);
  }
  
  console.log(`Found ${files.length} markdown file(s)\n`);
  console.log('═'.repeat(50));
  
  // Convert each file
  const results = [];
  for (const file of files) {
    try {
      const result = convertFile(file, outputDir, options);
      results.push(result);
    } catch (error) {
      console.error(`\n❌ Error processing ${path.basename(file)}:`);
      console.error(`   ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log(`\n✅ Conversion complete! Processed ${results.length}/${files.length} files\n`);
  
  if (results.length > 0) {
    console.log('📋 Converted posts:');
    results.forEach(({ slug, title }) => {
      console.log(`   • ${title} (${slug})`);
    });
  }
  
  console.log('\n📝 Next steps:');
  console.log('   1. Review the generated MDX files in', outputDir);
  console.log('   2. Check frontmatter metadata is correct');
  console.log('   3. Verify image URLs are working');
  console.log('   4. Add <AdBox /> and <SupportBox /> components where desired');
  console.log('   5. Run `npm run dev` to test the blog');
}

// CLI
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Notion to MDX Converter for Giveback Guide

Usage:
  node scripts/convert-notion-to-mdx.js <input-dir> [output-dir] [options]

Arguments:
  input-dir   Directory containing Notion markdown exports (.md files)
  output-dir  Output directory for MDX files (default: src/content/blog)

Options:
  --components    Convert markdown images to ResponsiveImage components
  --help, -h      Show this help message

Examples:
  node scripts/convert-notion-to-mdx.js ./notion-export
  node scripts/convert-notion-to-mdx.js ./notion-export ./src/content/blog
  node scripts/convert-notion-to-mdx.js ./notion-export --components
`);
  process.exit(0);
}

const inputDir = args[0];
const outputDir = args[1] && !args[1].startsWith('--') ? args[1] : DEFAULT_OUTPUT_DIR;
const useComponents = args.includes('--components');

if (!fs.existsSync(inputDir)) {
  console.error(`❌ Input directory not found: ${inputDir}`);
  process.exit(1);
}

convertNotionExport(inputDir, outputDir, { useComponents });
