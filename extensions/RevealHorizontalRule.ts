import { Node, mergeAttributes } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

export interface RevealHorizontalRuleOptions {
  HTMLAttributes: Record<string, any>;
}

export const RevealHorizontalRule = Node.create<RevealHorizontalRuleOptions>({
  name: 'horizontalRule',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  parseHTML() {
    return [
      { 
        tag: 'hr',
        getAttrs: (node) => {
          const slideType = (node as HTMLElement).getAttribute('data-slide-type');
          return slideType ? { slideType } : {};
        }
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const slideType = node.attrs.slideType;
    const attrs = mergeAttributes(
      this.options.HTMLAttributes,
      HTMLAttributes,
      slideType ? { 'data-slide-type': slideType } : {}
    );
    return ['hr', attrs];
  },

  addCommands() {
    return {
      setHorizontalRule: (attributes) => ({ chain, state }) => {
        const { $from } = state.selection;
        const index = $from.index();

        if (!$from.parent.canReplaceWith(index, index, this.type)) {
          return false;
        }

        return chain()
          .insertContent({ type: this.name, attrs: attributes })
          .command(({ tr, dispatch }) => {
            if (dispatch) {
              const { parent, pos } = tr.selection.$from;
              const posAfter = pos + 1;
              const nodeAfter = tr.doc.nodeAt(posAfter);

              if (nodeAfter && nodeAfter.isTextblock && nodeAfter.content.size === 0) {
                tr.setSelection(TextSelection.create(tr.doc, posAfter));
              } else {
                const node = parent.type.contentMatch.defaultType?.create();

                if (node) {
                  tr.insert(posAfter, node);
                  tr.setSelection(TextSelection.create(tr.doc, posAfter + 1));
                }
              }

              tr.scrollIntoView();
            }

            return true;
          })
          .run();
      },
    };
  },

  addAttributes() {
    return {
      slideType: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-slide-type'),
        renderHTML: (attributes) => {
          if (!attributes.slideType) {
            return {};
          }
          return {
            'data-slide-type': attributes.slideType,
          };
        },
      },
    };
  },
});
