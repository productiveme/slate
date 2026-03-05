<template>
  <div class="flex h-screen bg-white">
    <!-- GitHub Config Modal -->
    <GitHubConfigModal
      :is-open="showGitHubConfigModal"
      @close="showGitHubConfigModal = false"
      @saved="handleGitHubConfigSaved"
    />

    <!-- Export Modal -->
    <Modal
      :is-open="showExportModal"
      title="Export Document"
      @close="showExportModal = false"
    >
      <p class="text-sm text-slate-600 mb-2">
        Choose your preferred export format:
      </p>
      <div class="space-y-2">
        <button
          @click="exportMarkdown"
          class="w-full flex items-center gap-3 p-3 rounded-md border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all duration-200 group text-left"
        >
          <Icon 
            icon="lucide:file-text" 
            class="w-5 h-5 text-slate-400 group-hover:text-slate-600" 
          />
          <div>
            <div class="font-medium text-slate-900">Markdown</div>
            <div class="text-xs text-slate-500">Export as a .md file</div>
          </div>
        </button>
        
        <ClientOnly>
          <button
            @click="exportPDF"
            class="w-full flex items-center gap-3 p-3 rounded-md border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all duration-200 group text-left"
            :disabled="isExporting"
          >
            <Icon 
              :icon="isExporting ? 'lucide:loader-2' : 'lucide:file'" 
              class="w-5 h-5 text-slate-400 group-hover:text-slate-600"
              :class="{ 'animate-spin': isExporting }" 
            />
            <div>
              <div class="font-medium text-slate-900">PDF</div>
              <div class="text-xs text-slate-500">
                {{ isExporting ? 'Generating PDF...' : 'Export as a PDF document' }}
              </div>
            </div>
          </button>
        </ClientOnly>
      </div>
      <template #actions>
        <button
          type="button"
          class="inline-flex justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200 active:scale-95"
          @click="showExportModal = false"
        >
          Cancel
        </button>
        <button
          type="button"
          class="inline-flex justify-center rounded-md px-4 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-all duration-200 active:scale-95"
          @click="showExportModal = false"
        >
          Export
        </button>
      </template>
    </Modal>
    

    
    <!-- Sidebar -->
    <div 
      class="h-full bg-white/80 backdrop-blur border-r border-slate-200/50 shadow-sm transition-all duration-300 ease-in-out z-10 flex flex-col"
      :class="isSidebarOpen ? 'w-64' : 'w-14'"
    >
      <Sidebar 
        :files="filteredFiles" 
        :activeFile="activeFile" 
        @select-file="selectFile" 
        @create-file="createFile" 
        :is-collapsed="!isSidebarOpen"
        @toggle-sidebar="toggleSidebar"
        @delete-file="deleteFile"
        @rename-file="handleFileRename"
        :repo-name="githubRepoName"
        :repos="githubRepos"
        :active-repo-index="githubActiveRepoIndex"
        @switch-repo="handleSwitchRepo"
        @add-repo="handleAddRepo"
        @disconnect-repo="handleDisconnectRepo"
      />
    </div>
    
    <!-- Main Editor Area -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <!-- Top Bar -->
      <div class="flex items-center justify-between px-4 h-12 bg-white/80 backdrop-blur border-b border-slate-200/50 shadow-sm">
        <div class="flex items-center flex-1">
          <h1 class="text-sm font-medium text-gray-800">{{ activeFile?.name || 'Untitled' }}</h1>
          <span class="ml-3 text-xs text-gray-400" v-if="activeFile">
            Last updated {{ formatDate(activeFile.updatedAt) }}
          </span>
        </div>

        <div class="flex items-center gap-4">
          <div class="relative">
            <input
              v-model="searchQuery"
              @input="handleSearch"
              type="text"
              placeholder="Search..."
              class="pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent w-64"
            />
            <Icon 
              icon="lucide:search" 
              class="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100"
            >
              <Icon icon="lucide:x" class="w-3 h-3 text-gray-400" />
            </button>
          </div>
          <div class="h-4 w-px bg-gray-200"></div>
          <button 
            @click="syncFromGitHub"
            class="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all duration-150 active:scale-95 text-sm"
            :disabled="isSyncing"
            :title="lastSyncTime ? `Last synced ${formatDate(lastSyncTime.toISOString())}` : 'Sync from GitHub'"
          >
            <Icon 
              :icon="isSyncing ? 'lucide:loader-2' : 'lucide:refresh-cw'" 
              class="w-4 h-4"
              :class="{ 'animate-spin': isSyncing }" 
            />
            <span v-if="lastSyncTime" class="text-xs text-gray-400">
              {{ formatDate(lastSyncTime.toISOString()) }}
            </span>
          </button>
          <div class="h-4 w-px bg-gray-200"></div>
          <button 
            @click="editorRef?.saveContent()"
            class="p-1.5 rounded-md hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all duration-150 active:scale-95"
            title="Save (⌘S)"
          >
            <Icon icon="lucide:save" class="w-4 h-4" />
          </button>
          <div class="h-4 w-px bg-gray-200 mx-2"></div>
          <button 
            @click="showExportModal = true"
            class="p-1.5 rounded-md hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all duration-150 active:scale-95"
            title="Export page"
          >
            <Icon icon="lucide:file-down" class="w-4 h-4" />
          </button>
          <a :href="githubRepoUrl || 'https://github.com/thetronjohnson/slate/'" target="_blank" class="p-1.5 rounded-md hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all duration-150 active:scale-95" title="View on GitHub">
            <Icon icon="lucide:github" class="w-4 h-4" />
          </a>
          <a href="https://productive.me" target="_blank" class="p-1.5 rounded-md hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all duration-150 active:scale-95" title="Visit Website">
            <Icon icon="lucide:globe" class="w-4 h-4" />
          </a>
        </div>
      </div>
      
      <!-- Editor -->
      <div class="flex-1 overflow-auto p-0 bg-white/50" ref="editorContainer">
        <div class="max-w-3xl mx-auto px-8 py-12 bg-white h-full">
          <MarkdownEditor 
            v-if="activeFile" 
            ref="editorRef"
            v-model="activeFile.content" 
            @update:modelValue="updateFileContent"
            :fileId="activeFile.id"
            :searchQuery="searchQuery"
          />
          <div v-else class="flex flex-col items-center justify-center h-full mt-12 text-gray-400">
            <div class="max-w-md text-center">
              <Icon icon="lucide:book-open" class="w-20 h-20 mb-6 text-gray-200 mx-auto" />
              <h2 class="text-xl font-semibold text-gray-600 mb-2">Welcome to Your Slate Workspace</h2>
              <p class="text-gray-500 mb-8">Create your first page or choose from our templates to get started quickly.</p>
              
              <div class="space-y-3">
                <button 
                  @click="createFile('Untitled')" 
                  class="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md active:scale-98 group"
                >
                  <Icon icon="lucide:file-plus" class="w-5 h-5 group-hover:scale-110 transition-transform" />
                  New Blank Page
                </button>
                
                <div class="flex gap-3">
                  <button 
                    v-for="template in templates" 
                    :key="template.name"
                    @click="createFile(template.name, template.content)" 
                    class="flex-1 px-4 py-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <Icon :icon="template.icon" class="w-5 h-5 mb-2 text-gray-400 group-hover:text-gray-600 mx-auto" />
                    <div class="text-sm font-medium text-gray-700">{{ template.name }}</div>
                    <div class="text-xs text-gray-500">{{ template.description }}</div>
                  </button>
                </div>
              </div>
              
              <div class="mt-8 pt-8 border-t border-gray-100">
                <p class="text-sm text-gray-400">
                  Need help? Check out our 
                  <a href="#" class="text-blue-600 hover:text-blue-700 hover:underline">quick start guide</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { Icon } from '@iconify/vue';
import Modal from '../components/Modal.vue';
import GitHubConfigModal from '../components/GitHubConfigModal.vue';
import TurndownService from 'turndown';
import { useStorage } from '../composables/useStorage';
import { useEventListener } from '@vueuse/core';
import posthog from 'posthog-js';

// Local Storage Keys
const SETTINGS = {
  SIDEBAR_STATE: 'sidebarState'
};

// Initialize turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  bulletListMarker: '-',
  strongDelimiter: '**'
});

const isMac = computed(() => {
  return typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
});

const templates = [
  {
    name: 'Meeting Notes',
    icon: 'lucide:clipboard-list',
    description: 'Structured template for meetings',
    content: `<h1>Meeting Notes</h1>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<h2>Agenda</h2>
<ul>
  <li>Topic 1</li>
  <li>Topic 2</li>
</ul>
<h2>Action Items</h2>
<ul>
  <li>[ ] Task 1</li>
  <li>[ ] Task 2</li>
</ul>`
  },
  {
    name: 'Project Plan',
    icon: 'lucide:layout-template',
    description: 'Project planning template',
    content: `<h1>Project Overview</h1>
<h2>Objectives</h2>
<ul>
  <li>Objective 1</li>
  <li>Objective 2</li>
</ul>
<h2>Timeline</h2>
<ul>
  <li>Phase 1</li>
  <li>Phase 2</li>
</ul>`
  }
];

const files = ref([]);
const activeFile = ref(null);
const editorRef = ref(null);
const isSidebarOpen = ref(true);
const showExportModal = ref(false);
const isExporting = ref(false);
const editorContainer = ref(null);
const isSyncing = ref(false);
const lastSyncTime = ref(null);
const showGitHubConfigModal = ref(false);
const githubConfigured = ref(false);
const githubRepoUrl = ref('');
const githubRepoName = ref('Slate');
const githubRepos = ref([]);
const githubActiveRepoIndex = ref(0);
const searchQuery = ref('');
let searchDebounceTimer = null;

const { storage, initStorage } = useStorage();

const filteredFiles = computed(() => {
  if (!searchQuery.value.trim()) {
    return files.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return files.value.filter(file => {
    const nameMatch = file.name.toLowerCase().includes(query);
    const contentMatch = file.content?.toLowerCase().includes(query);
    return nameMatch || contentMatch;
  });
});

onMounted(async () => {
  await initStorage();
  
  useEventListener(document, 'keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
      if (
        e.target.tagName !== 'INPUT' && 
        e.target.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
      }
    }
  });
  
  try {
    const configResponse = await $fetch('/api/github/config');
    githubConfigured.value = configResponse.configured;
    
    if (configResponse.configured && configResponse.config) {
      githubRepoUrl.value = `https://github.com/${configResponse.config.owner}/${configResponse.config.repo}`;
      githubRepoName.value = configResponse.config.repo;
      githubRepos.value = configResponse.repos || [configResponse.config];
      githubActiveRepoIndex.value = configResponse.activeIndex ?? 0;
    }
    
    if (!githubConfigured.value) {
      showGitHubConfigModal.value = true;
    }
    
    const sidebarState = await storage.getSetting(SETTINGS.SIDEBAR_STATE);
    if (sidebarState !== null) {
      isSidebarOpen.value = sidebarState;
    }
    
    if (githubConfigured.value) {
      await syncFromGitHub();
    }
    
    const savedFiles = await storage.getFiles();
    files.value = savedFiles;
    
    for (const file of files.value) {
      const content = await storage.getDocument(file.id);
      if (content) {
        file.content = content;
      }
    }
    
    if (files.value.length > 0) {
      activeFile.value = files.value[0];
    } else {
      await createFile('Getting Started', `
        <h1>Welcome to Slate</h1>
        <p>This is your first document. Here are some things you can do:</p>
        <ul>
          <li>Write your content in markdown</li>
          <li>Use the formatting tools above to style your text</li>
          <li>Create new documents using the sidebar</li>
          <li>Export your documents as Markdown or PDF</li>
          <li>Your documents are automatically saved and synced to GitHub</li>
        </ul>
      `.trim());
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
});

async function selectFile(file) {
  if (!file.content) {
    const content = await storage.getDocument(file.id);
    if (content) {
      file.content = content;
    }
  }
  activeFile.value = file;
  saveFiles();
}

async function createFile(name, content = '') {
  const file = {
    id: crypto.randomUUID(),
    name,
    path: `${name.toLowerCase().replace(/\s+/g, '-')}.md`,
    sha: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await storage.saveDocument(file.id, content || '<h1>Untitled</h1>');

  files.value.push(file);
  activeFile.value = file;
  saveFiles();
  posthog.capture('file_created', {
    file_id: file.id,
  });
}

function updateFileContent(newContent) {
  if (activeFile.value) {
    activeFile.value = {
      ...activeFile.value,
      content: newContent
    };
    activeFile.value.updatedAt = new Date().toISOString();
    saveFiles();
    
    if (activeFile.value.path) {
      storage.commitToGitHub(activeFile.value.id, activeFile.value.path, newContent).catch(error => {
        console.error('Error committing to GitHub:', error);
      });
    }
  }
}

function saveFiles() {
  storage.saveFiles(files.value).catch(error => {
    console.error('Error saving files:', error);
  });
}

async function exportMarkdown() {
  if (!activeFile.value) return;
  
  try {
    // Convert HTML to Markdown
    const markdown = turndownService.turndown(activeFile.value.content);
    
    // Create and download the file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeFile.value.name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showExportModal.value = false;
  } catch (error) {
    console.error('Error exporting markdown:', error);
    alert('Failed to export markdown. Please try again.');
  }
}

async function exportPDF() {
  if (!activeFile.value) return;
  
  try {
    isExporting.value = true;
    
    // Import both libraries
    const [{ jsPDF }, { default: html2pdf }] = await Promise.all([
      import('jspdf'),
      import('html2pdf.js')
    ]);
    
    // Create a new div for PDF generation
    const element = document.createElement('div');
    element.innerHTML = activeFile.value.content;
    element.className = 'pdf-export prose prose-slate max-w-none mx-auto px-8 py-12';
    document.body.appendChild(element);
    
    const options = {
      margin: [15, 15],
      filename: `${activeFile.value.name}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        putOnlyUsedFonts: true,
        floatPrecision: 16
      },
      enableLinks: true,
      pagebreak: { mode: 'avoid-all' }
    };
    
    const pdf = new jsPDF(options.jsPDF);
    
    await html2pdf()
      .from(element)
      .set(options)
      .toPdf()
      .get('pdf')
      .then((pdf) => {
        pdf.setProperties({
          title: activeFile.value.name,
          subject: 'Exported from Slate',
          creator: 'Slate Editor',
          author: 'Slate User'
        });
        return pdf;
      })
      .save();
    
    document.body.removeChild(element);
    showExportModal.value = false;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Failed to export PDF. Please try again.');
  } finally {
    isExporting.value = false;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
  storage.saveSetting(SETTINGS.SIDEBAR_STATE, isSidebarOpen.value).catch(error => {
    console.error('Error saving sidebar state:', error);
  });
}

function deleteFile(file) {
  // Remove from files array
  files.value = files.value.filter(f => f.id !== file.id);
  
  // If the deleted file was active, select another file or clear active file
  if (activeFile.value?.id === file.id) {
    activeFile.value = files.value[0] || null;
  }
  
  // Save updated files list
  saveFiles();
  posthog.capture('file_deleted', {
    file_id: file.id,
  });
}

function handleFileRename(file) {
  const index = files.value.findIndex(f => f.id === file.id);
  if (index !== -1) {
    const currentContent = files.value[index].content;
    files.value[index] = {
      ...files.value[index],
      name: file.name,
      updatedAt: file.updatedAt,
      content: currentContent
    };
    
    if (activeFile.value?.id === file.id) {
      activeFile.value = {
        ...files.value[index],
        content: currentContent
      };
    }
    
    saveFiles();
  }
}

async function syncFromGitHub() {
  isSyncing.value = true;
  try {
    await storage.syncFromGitHub();
    lastSyncTime.value = new Date();
  } catch (error) {
    console.error('Error syncing from GitHub:', error);
    if (error?.statusCode === 401) {
      showGitHubConfigModal.value = true;
    }
  } finally {
    isSyncing.value = false;
  }
}

async function handleGitHubConfigSaved() {
  showGitHubConfigModal.value = false;
  githubConfigured.value = true;
  
  const configResponse = await $fetch('/api/github/config');
  if (configResponse.configured && configResponse.config) {
    githubRepoUrl.value = `https://github.com/${configResponse.config.owner}/${configResponse.config.repo}`;
    githubRepoName.value = configResponse.config.repo;
    githubRepos.value = configResponse.repos || [configResponse.config];
    githubActiveRepoIndex.value = configResponse.activeIndex ?? 0;
  }
  
  await syncFromGitHub();
}

async function handleSwitchRepo(index) {
  try {
    const response = await $fetch('/api/github/switch', {
      method: 'POST',
      body: { index }
    });
    if (response.success && response.config) {
      githubRepoUrl.value = `https://github.com/${response.config.owner}/${response.config.repo}`;
      githubRepoName.value = response.config.repo;
      githubRepos.value = response.repos || [];
      githubActiveRepoIndex.value = response.activeIndex ?? index;
      await syncFromGitHub();
    }
  } catch (error) {
    console.error('Error switching repository:', error);
  }
}

function handleAddRepo() {
  showGitHubConfigModal.value = true;
}

async function handleDisconnectRepo(index) {
  try {
    const response = await $fetch('/api/github/disconnect', {
      method: 'POST',
      body: { index }
    });
    if (!response.configured) {
      githubConfigured.value = false;
      githubRepoUrl.value = '';
      githubRepoName.value = 'Slate';
      githubRepos.value = [];
      githubActiveRepoIndex.value = 0;
      showGitHubConfigModal.value = true;
    } else if (response.config) {
      githubRepoUrl.value = `https://github.com/${response.config.owner}/${response.config.repo}`;
      githubRepoName.value = response.config.repo;
      githubRepos.value = response.repos || [];
      githubActiveRepoIndex.value = response.activeIndex ?? 0;
      await syncFromGitHub();
    }
  } catch (error) {
    console.error('Error disconnecting repository:', error);
  }
}

function handleSearch() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  
  searchDebounceTimer = setTimeout(() => {
    posthog.capture('search_performed', {
      query: searchQuery.value,
    });
  }, 300);
}

function clearSearch() {
  searchQuery.value = '';
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
}
</script>

<style>
/* Scrollbar Styles */
.flex-1.overflow-auto {
  scrollbar-gutter: stable;
}

.flex-1.overflow-auto::-webkit-scrollbar {
  width: 10px;
}

.flex-1.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.flex-1.overflow-auto::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 20px;
  border: 3px solid #fff;
}

.flex-1.overflow-auto::-webkit-scrollbar-thumb:hover {
  background-color: #cbd5e1;
}

/* PDF Export Styles */
.pdf-export {
  background: white;
  color: #1a1a1a;
  font-family: 'Lato', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.pdf-export h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1a1a1a;
  letter-spacing: -0.01em;
}

.pdf-export h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #1a1a1a;
}

.pdf-export h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.pdf-export p {
  margin-bottom: 1rem;
  line-height: 1.7;
  color: #374151;
}

.pdf-export ul, .pdf-export ol {
  margin-bottom: 1rem;
  padding-left: 1.25rem;
}

.pdf-export li {
  margin-bottom: 0.25rem;
  color: #374151;
}

.pdf-export pre {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.375rem;
  margin: 1rem 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: #334155;
  white-space: pre-wrap;
}

.pdf-export code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  background: #f8fafc;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  color: #334155;
}

.pdf-export blockquote {
  border-left: 4px solid #fde68a;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #92400e;
  background: #fef3c7;
  padding: 0.5rem 1rem;
  border-radius: 0 0.375rem 0.375rem 0;
}

.pdf-export img {
  max-width: 100%;
  height: auto;
  margin: 1rem 0;
  border-radius: 0.375rem;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-down {
  animation: fadeInDown 0.2s ease-out;
}
</style> 