<template>
  <node-view-wrapper class="frontmatter-block">
    <div class="frontmatter-container">
      <div class="frontmatter-header">
        <div class="frontmatter-title">
          <Icon icon="lucide:file-text" class="w-4 h-4" />
          <span>Frontmatter</span>
        </div>
        <button 
          @click="toggleExpanded" 
          class="expand-button"
          type="button"
        >
          <Icon 
            :icon="isExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" 
            class="w-4 h-4" 
          />
        </button>
      </div>
      
      <div v-show="isExpanded" class="frontmatter-content">
        <div v-if="isEditing" class="frontmatter-editor">
          <textarea
            v-model="editableYAML"
            class="yaml-textarea"
            placeholder="key: value"
            spellcheck="false"
          />
          <div class="editor-actions">
            <button @click="saveChanges" class="save-button" type="button">
              <Icon icon="lucide:check" class="w-3.5 h-3.5" />
              Save
            </button>
            <button @click="cancelEditing" class="cancel-button" type="button">
              <Icon icon="lucide:x" class="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
        
        <div v-else class="frontmatter-display">
          <div 
            v-for="(value, key) in node.attrs.data" 
            :key="key"
            class="frontmatter-field"
          >
            <div class="field-key">{{ key }}:</div>
            <div class="field-value">{{ formatValue(value) }}</div>
          </div>
          
          <button 
            @click="startEditing" 
            class="edit-button"
            type="button"
          >
            <Icon icon="lucide:pencil" class="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </div>
    </div>
  </node-view-wrapper>
</template>

<script setup>
import { NodeViewWrapper } from '@tiptap/vue-3';
import { Icon } from '@iconify/vue';
import { ref, computed } from 'vue';
import yaml from 'js-yaml';

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  updateAttributes: {
    type: Function,
    required: true
  },
  deleteNode: {
    type: Function,
    required: true
  },
  editor: {
    type: Object,
    required: true
  }
});

const isExpanded = ref(true);
const isEditing = ref(false);
const editableYAML = ref('');

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
}

function startEditing() {
  try {
    editableYAML.value = yaml.dump(props.node.attrs.data, {
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });
  } catch (error) {
    console.error('Error converting to YAML:', error);
    editableYAML.value = JSON.stringify(props.node.attrs.data, null, 2);
  }
  isEditing.value = true;
}

function saveChanges() {
  try {
    const trimmed = editableYAML.value.trim();
    
    if (!trimmed) {
      props.updateAttributes({
        data: {}
      });
      isEditing.value = false;
      
      nextTick(() => {
        props.editor.commands.focus();
      });
      return;
    }
    
    const parsed = yaml.load(trimmed);
    props.updateAttributes({
      data: parsed || {}
    });
    isEditing.value = false;
    
    nextTick(() => {
      props.editor.commands.focus();
    });
  } catch (error) {
    console.error('Error parsing YAML:', error);
    alert('Invalid YAML format. Please check your syntax.');
  }
}

function cancelEditing() {
  isEditing.value = false;
  editableYAML.value = '';
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return `[${value.join(', ')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}
</script>

<style scoped>
.frontmatter-block {
  margin: 0 0 1.5rem 0;
}

.frontmatter-container {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}

.frontmatter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  user-select: none;
}

.frontmatter-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.expand-button {
  padding: 4px;
  border-radius: 4px;
  color: #64748b;
  transition: all 0.15s ease;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-button:hover {
  background: #e2e8f0;
  color: #475569;
}

.frontmatter-content {
  padding: 14px;
}

.frontmatter-display {
  position: relative;
}

.frontmatter-field {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  padding: 6px 0;
  align-items: baseline;
}

.field-key {
  color: #0ea5e9;
  font-weight: 600;
  white-space: nowrap;
}

.field-value {
  color: #334155;
  word-break: break-word;
}

.edit-button {
  margin-top: 12px;
  padding: 6px 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.edit-button:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
}

.frontmatter-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.yaml-textarea {
  width: 100%;
  min-height: 150px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #334155;
  resize: vertical;
  line-height: 1.6;
}

.yaml-textarea:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.save-button,
.cancel-button {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.save-button {
  background: #0ea5e9;
  border-color: #0ea5e9;
  color: #ffffff;
}

.save-button:hover {
  background: #0284c7;
  border-color: #0284c7;
}

.cancel-button {
  background: #ffffff;
  border-color: #e2e8f0;
  color: #64748b;
}

.cancel-button:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
}
</style>
