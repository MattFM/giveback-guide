import { visit } from 'unist-util-visit';

/**
 * Remark plugin to convert markdown images to ResponsiveImage components
 * Automatically wraps images in figure tags with captions if alt text contains " - " separator
 * 
 * Example:
 * ![Alt text](url) -> <ResponsiveImage src="url" alt="Alt text" preset="hero" />
 * ![Alt text - Caption](url) -> <figure><ResponsiveImage ... /><figcaption>Caption</figcaption></figure>
 * 
 * Note: ResponsiveImage component is provided globally via mdx-components.ts,
 * so no import statement is needed.
 */
export default function remarkResponsiveImages() {
  return (tree, file) => {
    visit(tree, 'image', (node, index, parent) => {
      
      // Split alt text into alt and caption if " - " separator exists
      const altText = node.alt || '';
      const parts = altText.split(' - ');
      const alt = parts[0].trim();
      const caption = parts.length > 1 ? parts.slice(1).join(' - ').trim() : null;
      
      // Create ResponsiveImage component
      const imageComponent = {
        type: 'mdxJsxFlowElement',
        name: 'ResponsiveImage',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'src',
            value: node.url
          },
          {
            type: 'mdxJsxAttribute',
            name: 'alt',
            value: alt
          },
          {
            type: 'mdxJsxAttribute',
            name: 'preset',
            value: 'hero'
          }
        ],
        children: []
      };

      // If there's a caption, wrap in figure with figcaption
      if (caption) {
        parent.children[index] = {
          type: 'mdxJsxFlowElement',
          name: 'figure',
          attributes: [],
          children: [
            imageComponent,
            {
              type: 'mdxJsxFlowElement',
              name: 'figcaption',
              attributes: [],
              children: [
                {
                  type: 'text',
                  value: caption
                }
              ]
            }
          ]
        };
      } else {
        // Replace image with ResponsiveImage component
        parent.children[index] = imageComponent;
      }
    });
  };
}
