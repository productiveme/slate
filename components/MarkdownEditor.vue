<template>
  <div class="markdown-editor h-full">
    <FloatingToolbar
      v-if="editor"
      :editor="editor"
      :format-menu-items="formatMenuItems"
      :list-menu-items="listMenuItems"
      :insert-menu-items="insertMenuItems"
    />
    
    <!-- Save Status -->
    <div class="fixed bottom-4 right-4 flex items-center gap-2">
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div 
          v-if="saveStatus" 
          class="text-xs px-3 py-1.5 rounded-md bg-white shadow-sm border border-slate-200/50 text-slate-500 flex items-center gap-2"
        >
          <Icon 
            icon="lucide:check"
            class="w-3.5 h-3.5"
          />
          Saved
        </div>
      </transition>
    </div>
    
    <!-- Editor Content -->
    <div class="bg-white h-full">
      <editor-content 
        v-if="editor" 
        :editor="editor" 
        class="prose prose-slate prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none px-8 py-12" 
      />
      <div v-else class="flex justify-center items-center h-64">
        <div class="flex flex-col items-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-2"></div>
          <p class="text-gray-400">Loading editor...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Highlight from '@tiptap/extension-highlight';
import { Icon } from '@iconify/vue';
import { useStorage } from '../composables/useStorage';
import FloatingToolbar from './FloatingToolbar.vue';
import { useEventListener } from '@vueuse/core';
import { marked } from 'marked';

const { storage } = useStorage();

function markdownToHTML(markdown) {
  if (!markdown) return '';
  return marked(markdown);
}

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  fileId: {
    type: String,
    required: true
  },
  searchQuery: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);
const saveStatus = ref('');
let saveTimeout = null;

// Track if initial content is loaded
const isInitialContentLoaded = ref(false);

// Create the editor
const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      },
      code: {
        // HTMLAttributes: {
        //   class: 'inline-code',
        // },
        // keepMarks: true,
        // excludes: undefined // Allow nesting with other marks
      },
      codeBlock: {
        HTMLAttributes: {
          class: 'code-block',
        },
        exitOnTripleEnter: true,
        exitOnArrowDown: true,
        languageClassPrefix: 'language-',
        transformPastedText: false,
        transformCopiedText: false,
        markdown: true
      }
    }),
    Placeholder.configure({
      placeholder: 'Start writing...'
    }),
    Image,
    Link,
    TaskList,
    TaskItem.configure({
      nested: true
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'editor-table',
      },
    }),
    TableRow,
    TableHeader,
    TableCell,
    Highlight.configure({
      multicolor: false,
      HTMLAttributes: {
        class: 'search-highlight',
      },
    })
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
    // Trigger auto-save
    if (saveTimeout) clearTimeout(saveTimeout);
    // Clear any existing "Saved" message
    saveStatus.value = '';
    saveTimeout = setTimeout(() => {
      saveContent();
    }, 1500);
  }
});

// Define menu items by category
const formatMenuItems = [
  {
    name: 'Bold',
    icon: 'lucide:bold',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleBold().run();
    },
    isActive: () => editor.value?.isActive('bold')
  },
  {
    name: 'Italic',
    icon: 'lucide:italic',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleItalic().run();
    },
    isActive: () => editor.value?.isActive('italic')
  },
  {
    name: 'Strike',
    icon: 'lucide:strikethrough',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleStrike().run();
    },
    isActive: () => editor.value?.isActive('strike')
  },
  {
    name: 'Code',
    icon: 'lucide:code',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleCode().run();
    },
    isActive: () => editor.value?.isActive('code')
  }
];

const listMenuItems = [
  {
    name: 'Bullet List',
    icon: 'lucide:list',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleBulletList().run();
    },
    isActive: () => editor.value?.isActive('bulletList')
  },
  {
    name: 'Ordered List',
    icon: 'lucide:list-ordered',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleOrderedList().run();
    },
    isActive: () => editor.value?.isActive('orderedList')
  },
  {
    name: 'Task List',
    icon: 'lucide:check-square',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleTaskList().run();
    },
    isActive: () => editor.value?.isActive('taskList')
  }
];

const insertMenuItems = [
  {
    name: 'Heading 1',
    icon: 'lucide:heading-1',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleHeading({ level: 1 }).run();
    },
    isActive: () => editor.value?.isActive('heading', { level: 1 })
  },
  {
    name: 'Heading 2',
    icon: 'lucide:heading-2',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleHeading({ level: 2 }).run();
    },
    isActive: () => editor.value?.isActive('heading', { level: 2 })
  },
  {
    name: 'Heading 3',
    icon: 'lucide:heading-3',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleHeading({ level: 3 }).run();
    },
    isActive: () => editor.value?.isActive('heading', { level: 3 })
  },
  {
    name: 'Blockquote',
    icon: 'lucide:quote',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleBlockquote().run();
    },
    isActive: () => editor.value?.isActive('blockquote')
  },
  {
    name: 'Code Block',
    icon: 'lucide:file-code',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleCodeBlock().run();
    },
    isActive: () => editor.value?.isActive('codeBlock')
  },
  {
    name: 'Table',
    icon: 'lucide:table',
    action: () => {
      if (editor.value) editor.value.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
    isActive: () => editor.value?.isActive('table')
  }
];

// Combine all menu items for use in other functions
const menuItems = computed(() => [
  ...formatMenuItems,
  ...listMenuItems,
  ...insertMenuItems
]);

// Watch for changes in the modelValue prop
watch(() => props.modelValue, (newValue) => {
  // Only update if the editor exists and the content is different
  if (editor.value && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue);
  }
}, { immediate: true });

// Clean up the editor on component unmount
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
});

// Expose the editor and menu items to the parent component
defineExpose({
  editor,
  formatMenuItems,
  listMenuItems,
  insertMenuItems,
  saveContent
});

onMounted(async () => {
  try {
    const savedContent = await storage.getDocument(props.fileId);
    if (savedContent && editor.value && !isInitialContentLoaded.value) {
      editor.value.commands.setContent(markdownToHTML(savedContent));
      isInitialContentLoaded.value = true;
    }
  } catch (error) {
    console.error('Error loading content:', error);
  }
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      saveContent();
    }
  });

  useEventListener(document, 'keydown', selectAllContent);
});

// Watch for fileId changes to load content
watch(() => props.fileId, async (newId, oldId) => {
  // Only load content if it's a different file
  if (newId && newId !== oldId) {
    try {
      const content = await storage.getDocument(newId);
      if (content && editor.value) {
        editor.value.commands.setContent(markdownToHTML(content));
        
        await nextTick();
        
        clearHighlights();
        
        if (props.searchQuery && props.searchQuery.trim()) {
          highlightSearchResults(props.searchQuery);
        }
      }
    } catch (error) {
      console.error('Error loading content for new file:', error);
    }
  }
}, { immediate: true });

watch(() => props.searchQuery, (query) => {
  if (!editor.value) return;
  
  clearHighlights();
  
  if (query && query.trim()) {
    nextTick(() => {
      highlightSearchResults(query);
    });
  }
});

// Save content to IndexedDB
async function saveContent() {
  if (!editor.value || !props.fileId) return;
  
  try {
    const content = editor.value.getHTML();
    await storage.saveDocument(props.fileId, content);
    
    saveStatus.value = 'saved';
    
    setTimeout(() => {
      if (saveStatus.value === 'saved') {
        saveStatus.value = '';
      }
    }, 2000);
  } catch (error) {
    console.error('Error saving content:', error);
    saveStatus.value = 'error';
  }
}

// Add method to select all editor content
function selectAllContent(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
    e.preventDefault();
    if (editor.value) {
      editor.value.commands.selectAll();
    }
  }
}

function highlightSearchResults(query) {
  if (!editor.value || !query) return;
  
  const { state, view } = editor.value;
  const { doc } = state;
  const searchTerm = query.toLowerCase();
  const tr = state.tr;
  
  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const text = node.text.toLowerCase();
      let index = 0;
      
      while ((index = text.indexOf(searchTerm, index)) !== -1) {
        const from = pos + index;
        const to = from + searchTerm.length;
        
        tr.addMark(
          from,
          to,
          state.schema.marks.highlight.create()
        );
        
        index += searchTerm.length;
      }
    }
  });
  
  if (tr.docChanged) {
    view.dispatch(tr);
  }
}

function clearHighlights() {
  if (!editor.value) return;
  
  const { state, view } = editor.value;
  const tr = state.tr;
  
  tr.removeMark(0, state.doc.content.size, state.schema.marks.highlight);
  view.dispatch(tr);
}
</script>

<style>
.ProseMirror {
  min-height: calc(100vh - 48px); /* 48px is the height of the top bar */
  outline: none;
  padding: 0;
  @apply font-editor;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

/* Improve the appearance of the editor content - Notion style */
.ProseMirror h1 {
  @apply text-3xl font-bold mb-4 text-gray-900 pb-1;
  letter-spacing: -0.01em;
  @apply font-editor;
}

.ProseMirror h2 {
  @apply text-2xl font-bold mb-3 text-gray-800 mt-6;
  letter-spacing: -0.01em;
  @apply font-editor;
}

.ProseMirror h3 {
  @apply text-xl font-bold mb-2 text-gray-800 mt-5;
  letter-spacing: -0.01em;
  @apply font-editor;
}

.ProseMirror p {
  @apply mb-4 leading-relaxed text-gray-700;
  @apply font-editor;
  font-size: 1.05rem;
  line-height: 1.7;
}

.ProseMirror ul {
  @apply list-disc pl-5 mb-4 text-gray-700 space-y-1;
  @apply font-editor;
}

.ProseMirror ol {
  @apply list-decimal pl-5 mb-4 text-gray-700 space-y-1;
  @apply font-editor;
}

/* Fix list item alignment */
.ProseMirror ul li,
.ProseMirror ol li {
  @apply relative;
}

.ProseMirror ul li::marker,
.ProseMirror ol li::marker {
  @apply text-gray-400;
}

/* Ensure proper alignment for multi-line list items */
.ProseMirror ul li p,
.ProseMirror ol li p {
  @apply m-0 inline align-top;
}

/* Task List Styling */
.ProseMirror ul[data-type="taskList"] {
  @apply list-none p-0 mb-4 space-y-2;
}

.ProseMirror ul[data-type="taskList"] li {
  @apply flex items-start gap-3;
  margin-left: 0;
}

.ProseMirror ul[data-type="taskList"] li > label {
  @apply mt-[3px] flex-shrink-0;
  margin: 0;
}

.ProseMirror ul[data-type="taskList"] li > div {
  @apply flex-grow min-w-0;
  margin-top: 0;
}

.ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
  @apply h-[18px] w-[18px] rounded border-gray-300 text-gray-900 focus:ring-gray-500 cursor-pointer;
  margin: 0;
}

.ProseMirror ul[data-type="taskList"] li > div p {
  @apply m-0 leading-normal;
  padding-top: 1px;
}

.ProseMirror blockquote {
  @apply border-l-4 border-amber-200 pl-4 my-4 py-2 bg-amber-50/50 text-amber-800 rounded-r not-italic;
  @apply font-editor;
}

.ProseMirror blockquote p {
  @apply tracking-tight text-amber-800/90 m-0 leading-relaxed not-italic;
  font-size: 1rem;
}

.ProseMirror pre {
  @apply bg-slate-50/70 p-4 my-4 overflow-x-auto text-sm text-slate-800 border-l-4 border-l-slate-200 border-y border-r border-slate-200/50 rounded-r;
  font-family: 'JetBrains Mono', monospace;
}

.ProseMirror code {
  @apply bg-slate-50/70 px-1.5 py-0.5 rounded text-[13px] text-slate-700 border border-slate-200/50;
  font-family: 'JetBrains Mono', monospace;
}

.ProseMirror pre code {
  @apply bg-transparent border-none p-0 text-slate-700;
  font-size: 13px;
  line-height: 1.6;
}

.ProseMirror pre::before {
  content: 'Code';
  @apply block text-xs font-medium text-slate-400 mb-2 font-sans;
}

.ProseMirror img {
  @apply max-w-full h-auto my-4 rounded-md;
}

.ProseMirror a {
  @apply text-blue-600 hover:underline;
}

.ProseMirror hr {
  @apply my-6 border-t border-gray-100;
}

.ProseMirror table {
  @apply border-collapse w-full my-4;
  border: 1px solid #e2e8f0;
}

.ProseMirror th {
  @apply bg-slate-50 font-semibold text-left p-3 border border-slate-200;
}

.ProseMirror td {
  @apply p-3 border border-slate-200;
}

.ProseMirror .selectedCell {
  @apply bg-blue-50;
}

.ProseMirror .column-resize-handle {
  @apply absolute top-0 right-[-2px] bottom-0 w-1 bg-blue-400 pointer-events-none;
}

.ProseMirror .resize-cursor {
  cursor: col-resize;
}

.ProseMirror mark.search-highlight {
  @apply bg-yellow-200 rounded-sm;
  padding: 2px 0;
}
</style> 