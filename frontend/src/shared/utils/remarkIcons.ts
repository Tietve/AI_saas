import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Text } from 'mdast';
import { hasIcons } from './iconParser';

/**
 * Remark plugin to handle :icon_name: syntax
 * Converts :icon: to a custom node type that will be rendered as an icon component
 */
export const remarkIcons: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      // Type guard: index can be number | undefined from visit callback
      if (!parent || index === null || index === undefined || !hasIcons(node.value)) {
        return;
      }

      const iconRegex = /:([a-zA-Z0-9_]+):/g;
      const newChildren: any[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = iconRegex.exec(node.value)) !== null) {
        const iconName = match[1].toLowerCase();

        // Add text before icon
        if (match.index > lastIndex) {
          newChildren.push({
            type: 'text',
            value: node.value.substring(lastIndex, match.index),
          });
        }

        // Add icon node (custom type)
        newChildren.push({
          type: 'icon',
          data: {
            hName: 'icon',
            hProperties: {
              iconName,
            },
          },
          iconName,
        });

        lastIndex = iconRegex.lastIndex;
      }

      // Add remaining text
      if (lastIndex < node.value.length) {
        newChildren.push({
          type: 'text',
          value: node.value.substring(lastIndex),
        });
      }

      // Replace the text node with multiple nodes
      if (newChildren.length > 0) {
        parent.children.splice(index, 1, ...newChildren);
      }
    });
  };
};
