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
 * ```
 *
 * How to modify:
 * - To add a component: Import it here and add to the components object
 * - To remove a component: Remove from the components object
 * - Changes apply to all blog posts immediately
 */

import ResponsiveImage from './components/ui/Image/ResponsiveImage.astro';
import MdxButton from './components/content/MdxButton.astro';
import SupportCTA from './components/sections/SupportCTA.astro';
import ListingEmbed from './components/content/ListingEmbed.astro';
import TextAd from './components/features/ads/TextAd.astro';

export const components = {
  ResponsiveImage,
  Button: MdxButton,
  SupportCTA,
  ListingEmbed,
  TextAd,
};
