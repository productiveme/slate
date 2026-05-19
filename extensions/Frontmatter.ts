import { Node, mergeAttributes } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import FrontmatterComponent from './FrontmatterComponent.vue';

export interface FrontmatterOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    frontmatter: {
      setFrontmatter: (data: Record<string, any>) => ReturnType;
      updateFrontmatter: (data: Record<string, any>) => ReturnType;
    };
  }
}

export const Frontmatter = Node.create<FrontmatterOptions>({
  name: 'frontmatter',

  group: 'block',

  atom: true,

  draggable: false,

  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      data: {
        default: {},
        parseHTML: element => {
          try {
            const dataAttr = element.getAttribute('data-frontmatter');
            return dataAttr ? JSON.parse(dataAttr) : {};
          } catch {
            return {};
          }
        },
        renderHTML: attributes => {
          return {
            'data-frontmatter': JSON.stringify(attributes.data),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="frontmatter"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-type': 'frontmatter',
    })];
  },

  addNodeView() {
    return VueNodeViewRenderer(FrontmatterComponent);
  },

  addCommands() {
    return {
      setFrontmatter: (data: Record<string, any>) => ({ commands }) => {
        return commands.insertContentAt(0, {
          type: this.name,
          attrs: { data },
        });
      },
      updateFrontmatter: (data: Record<string, any>) => ({ tr, state }) => {
        const { doc } = state;
        let updated = false;

        doc.descendants((node, pos) => {
          if (node.type.name === this.name) {
            tr.setNodeMarkup(pos, undefined, { data });
            updated = true;
            return false;
          }
        });

        return updated;
      },
    };
  },
});
