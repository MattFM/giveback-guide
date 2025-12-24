/**
 * Global MDX Components
 * 
 * Components defined here are automatically available in ALL MDX files
 * without needing individual imports. This centralises component management
 * for blog posts and other MDX content.
 * 
 * Benefits of this approach:
 * - Single source of truth for available components
 * - Easy to add/remove components globally
 * - No need to maintain imports in every MDX file
 * - Cleaner MDX files focused on content
 * 
 * How to use in MDX:
 * Simply use these components directly without importing:
 * 
 * ```mdx
 * <ResponsiveImage src="..." alt="..." preset="hero" />
 * <AdBox />
 * ```
 * 
 * How to modify:
 * - To add a component: Import it here and add to the components object
 * - To remove a component: Remove from the components object
 * - Changes apply to all blog posts immediately
 * 
 * Note: SupportBox is intentionally excluded as it's part of the BlogPostLayout
 * template and shouldn't be called within post content.
 */

import ResponsiveImage from './components/ui/Image/ResponsiveImage.astro';
import AdBox from './components/features/ads/AdBox.astro';
import ProjectEmbed from './components/content/ProjectEmbed.astro';
import StayEmbed from './components/content/StayEmbed.astro';

export const components = {
  ResponsiveImage,
  AdBox,
  ProjectEmbed,
  StayEmbed,
};
