<template>
  <!-- New File Modal -->
  <Modal
    :is-open="showNewFileModal"
    title="Create New File"
    confirm-text="Create"
    @close="showNewFileModal = false"
    @confirm="handleCreateFile"
  >
    <div class="space-y-4">
      <label class="block">
        <span class="text-sm font-medium text-slate-700">File Name</span>
        <input
          type="text"
          v-model="newFileName"
          class="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Untitled"
          @keyup.enter="handleCreateFile"
          ref="newFileInput"
        />
      </label>
    </div>
  </Modal>
  
  <!-- Rename File Modal -->
  <Modal
    :is-open="showRenameModal"
    title="Rename File"
    confirm-text="Rename"
    @close="showRenameModal = false"
    @confirm="handleRenameFile"
  >
    <div class="space-y-4">
      <label class="block">
        <span class="text-sm font-medium text-slate-700">New File Name</span>
        <input
          type="text"
          v-model="newFileName"
          class="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Untitled"
          @keyup.enter="handleRenameFile"
          ref="renameInput"
        />
      </label>
    </div>
  </Modal>
  
  <!-- Delete File Modal -->
  <Modal
    :is-open="showDeleteModal"
    title="Delete File"
    confirm-text="Delete"
    :danger="true"
    @close="showDeleteModal = false"
    @confirm="handleDeleteFile"
  >
    <p class="text-sm text-slate-600">
      Are you sure you want to delete "<span class="font-medium text-slate-900">{{ fileToDelete?.name }}</span>"?
      <br>
      <span class="text-red-600 mt-2 block">This action cannot be undone.</span>
    </p>
  </Modal>

  <div class="flex flex-col h-full">
    <div 
      class="h-12 px-4 border-b border-slate-200/50 flex items-center justify-between bg-white/90"
      :class="{ 'justify-center': isCollapsed }"
    >
      <div class="flex items-center justify-between w-full" :class="{ 'justify-center': isCollapsed }">
        <div v-if="!isCollapsed" class="relative flex-1 min-w-0 mr-2" ref="repoDropdownRef">
          <button
            @click="showRepoDropdown = !showRepoDropdown"
            class="flex items-center gap-1 font-bold text-sm text-slate-700 truncate hover:text-slate-900 transition-colors max-w-full"
            title="Switch repository"
          >
            <span class="truncate">{{ activeRepo?.repo || repoName }}</span>
            <Icon icon="lucide:chevrons-up-down" class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </button>
          <div
            v-if="showRepoDropdown"
            class="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg border border-slate-200 shadow-lg z-50 py-1"
          >
            <div
              v-for="(repo, index) in repos"
              :key="index"
              class="flex items-center justify-between px-3 py-2 hover:bg-slate-50 cursor-pointer group"
              @click.stop="handleSwitchRepo(index)"
            >
              <div class="flex items-center gap-2 min-w-0">
                <Icon
                  :icon="index === activeRepoIndex ? 'lucide:check' : 'lucide:git-branch'"
                  class="w-3.5 h-3.5 flex-shrink-0"
                  :class="index === activeRepoIndex ? 'text-slate-900' : 'text-slate-400'"
                />
                <span class="text-sm text-slate-700 truncate">{{ repo.repo }}</span>
                <span class="text-xs text-slate-400 truncate hidden group-hover:block">{{ repo.owner }}</span>
              </div>
              <button
                @click.stop="handleDisconnectRepo(index)"
                class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition-all flex-shrink-0"
                title="Disconnect repository"
              >
                <Icon icon="lucide:log-out" class="w-3 h-3" />
              </button>
            </div>
            <div class="border-t border-slate-100 mt-1 pt-1">
              <button
                @click.stop="handleAddRepo"
                class="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <Icon icon="lucide:plus" class="w-3.5 h-3.5" />
                Connect another repository
              </button>
            </div>
          </div>
        </div>
        
        <!-- Collapse/Expand Button -->
        <button 
          v-if="!isCollapsed"
          @click="$emit('toggle-sidebar')" 
          class="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-all duration-150"
          title="Collapse sidebar"
        >
          <Icon icon="lucide:panel-left-close" class="w-4 h-4" />
        </button>
      </div>
      
      <!-- Show expand button only when collapsed -->
      <button 
        v-if="isCollapsed"
        @click="$emit('toggle-sidebar')" 
        class="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-all duration-150"
        title="Expand sidebar"
      >
        <Icon icon="lucide:panel-left-open" class="w-4 h-4" />
      </button>
    </div>

    <!-- Breadcrumb navigation -->
    <div
      v-if="!isCollapsed && currentFolderPath"
      class="px-3 py-1.5 border-b border-slate-100 flex items-center gap-1 text-xs text-slate-500 bg-slate-50/60 flex-wrap"
    >
      <button
        @click="$emit('navigate-folder', '')"
        class="hover:text-slate-800 transition-colors"
      >
        root
      </button>
      <template v-for="(segment, i) in breadcrumbs" :key="i">
        <Icon icon="lucide:chevron-right" class="w-3 h-3 text-slate-300 flex-shrink-0" />
        <button
          @click="$emit('navigate-folder', segment.path)"
          class="hover:text-slate-800 transition-colors truncate max-w-[80px]"
          :title="segment.name"
          :class="{ 'font-medium text-slate-700': i === breadcrumbs.length - 1 }"
        >
          {{ segment.name }}
        </button>
      </template>
    </div>
    
    <div class="flex-1 overflow-y-auto py-2 space-y-0.5" :class="{ 'px-1': isCollapsed }">

      <!-- Loading state -->
      <div v-if="isFolderLoading" class="flex items-center justify-center py-8">
        <Icon icon="lucide:loader-2" class="w-5 h-5 text-slate-300 animate-spin" />
      </div>

      <template v-else>
        <!-- Folders -->
        <div
          v-for="folder in folders"
          :key="folder.path"
          @click="$emit('navigate-folder', folder.path)"
          class="rounded-md cursor-pointer flex items-center gap-2.5 transition-all duration-200 hover:bg-slate-100/80 group"
          :class="isCollapsed ? 'justify-center py-2' : 'px-3 py-2 mx-2'"
          :title="isCollapsed ? folder.name : ''"
        >
          <Icon
            icon="lucide:folder"
            class="w-4 h-4 flex-shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors duration-200"
          />
          <span
            v-if="!isCollapsed"
            class="truncate flex-1 text-sm leading-none text-slate-600"
          >
            {{ folder.name }}
          </span>
          <Icon
            v-if="!isCollapsed"
            icon="lucide:chevron-right"
            class="w-3.5 h-3.5 text-slate-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>

        <!-- Files -->
        <div 
          v-for="file in files" 
          :key="file.id"
          @click="$emit('select-file', file)"
          class="rounded-md cursor-pointer flex items-center gap-2.5 transition-all duration-200 hover:bg-slate-100/80 group"
          :class="[
            isCollapsed ? 'justify-center py-2' : 'px-3 py-2 mx-2',
            { 'bg-slate-100 shadow-sm': activeFile?.id === file.id }
          ]"
          :title="isCollapsed ? file.name : ''"
        >
          <Icon 
            icon="lucide:file-text" 
            class="w-4 h-4 flex-shrink-0 transition-colors duration-200" 
            :class="activeFile?.id === file.id ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'" 
          />
          <span 
            v-if="!isCollapsed" 
            class="truncate flex-1 text-sm leading-none" 
            :class="{ 'font-medium text-slate-900': activeFile?.id === file.id }"
          >
            {{ file.name }}
          </span>
          <div 
            v-if="!isCollapsed" 
            class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-0.5 ml-1"
          >
            <button 
              @click.stop="renameFile(file)" 
              class="p-1.5 text-slate-400 hover:text-slate-900 rounded-md transition-all duration-150 hover:bg-slate-200/80"
              title="Rename"
            >
              <Icon icon="lucide:edit" class="w-3.5 h-3.5" />
            </button>
            <button 
              @click.stop="deleteFile(file)" 
              class="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-all duration-150 hover:bg-red-50"
              title="Delete"
            >
              <Icon icon="lucide:trash-2" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        <div v-if="folders.length === 0 && files.length === 0" class="text-center text-gray-400 mt-8 p-4">
          <Icon icon="lucide:file-question" class="w-12 h-12 mx-auto mb-2 text-gray-200" />
          <p v-if="!isCollapsed" class="text-sm">No pages yet</p>
        </div>
      </template>
    </div>
    
    <div class="p-3 border-t border-slate-200/50 bg-white/90" :class="{ 'px-2': isCollapsed }">
      <button 
        @click="createNewFile"
        class="w-full flex items-center justify-center p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-all duration-200 text-sm font-medium shadow-sm hover:shadow active:scale-95"
        :class="{ 'gap-2': !isCollapsed }"
        :title="isCollapsed ? 'New Page' : ''"
      >
        <Icon icon="lucide:file-plus" class="w-4 h-4" />
        <span v-if="!isCollapsed">New Page</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { Icon } from '@iconify/vue';
import Modal from './Modal.vue';
import { useStorage } from '../composables/useStorage';

const props = defineProps({
  files: {
    type: Array,
    default: () => []
  },
  folders: {
    type: Array,
    default: () => []
  },
  activeFile: {
    type: Object,
    default: null
  },
  isCollapsed: {
    type: Boolean,
    default: false
  },
  repoName: {
    type: String,
    default: 'Slate'
  },
  repos: {
    type: Array,
    default: () => []
  },
  activeRepoIndex: {
    type: Number,
    default: 0
  },
  currentFolderPath: {
    type: String,
    default: ''
  },
  isFolderLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'select-file',
  'create-file',
  'toggle-sidebar',
  'delete-file',
  'rename-file',
  'switch-repo',
  'add-repo',
  'disconnect-repo',
  'navigate-folder'
]);

const activeRepo = computed(() => props.repos[props.activeRepoIndex] || null);

const breadcrumbs = computed(() => {
  if (!props.currentFolderPath) return [];
  const parts = props.currentFolderPath.split('/');
  return parts.map((part, i) => ({
    name: part,
    path: parts.slice(0, i + 1).join('/')
  }));
});

const showRepoDropdown = ref(false);
const repoDropdownRef = ref(null);

function handleClickOutside(event) {
  if (repoDropdownRef.value && !repoDropdownRef.value.contains(event.target)) {
    showRepoDropdown.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

function handleSwitchRepo(index) {
  showRepoDropdown.value = false;
  if (index !== props.activeRepoIndex) {
    emit('switch-repo', index);
  }
}

function handleAddRepo() {
  showRepoDropdown.value = false;
  emit('add-repo');
}

function handleDisconnectRepo(index) {
  showRepoDropdown.value = false;
  emit('disconnect-repo', index);
}

// Modal states
const showNewFileModal = ref(false);
const showRenameModal = ref(false);
const showDeleteModal = ref(false);
const newFileName = ref('');
const fileToDelete = ref(null);
const fileToRename = ref(null);
const newFileInput = ref(null);
const renameInput = ref(null);

const { storage } = useStorage();

function createNewFile() {
  showNewFileModal.value = true;
  newFileName.value = '';
  nextTick(() => {
    newFileInput.value?.focus();
  });
}

function renameFile(file) {
  fileToRename.value = file;
  newFileName.value = file.name;
  showRenameModal.value = true;
  nextTick(() => {
    renameInput.value?.focus();
  });
}

function deleteFile(file) {
  fileToDelete.value = file;
  showDeleteModal.value = true;
}

function handleCreateFile() {
  if (newFileName.value.trim()) {
    emit('create-file', newFileName.value.trim());
    showNewFileModal.value = false;
  }
}

function handleRenameFile() {
  if (newFileName.value.trim() && fileToRename.value) {
    const updatedFile = {
      ...fileToRename.value,
      name: newFileName.value.trim(),
      updatedAt: new Date().toISOString()
    };
    storage.saveFiles(props.files).catch(error => {
      console.error('Error saving renamed file:', error);
    });
    emit('rename-file', updatedFile);
    showRenameModal.value = false;
    fileToRename.value = null;
  }
}

async function handleDeleteFile() {
  if (fileToDelete.value) {
    await storage.deleteDocument(fileToDelete.value.id);
    emit('delete-file', fileToDelete.value);
    showDeleteModal.value = false;
    fileToDelete.value = null;
  }
}
</script>
