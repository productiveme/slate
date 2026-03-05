<template>
  <Modal
    :is-open="isOpen"
    title="Configure GitHub Integration"
    confirm-text="Save Configuration"
    @close="$emit('close')"
    @confirm="handleSave"
  >
    <div class="space-y-4">
      <p class="text-sm text-slate-600 mb-4">
        Connect your GitHub repository to sync your markdown files.
      </p>
      
      <label class="block">
        <span class="text-sm font-medium text-slate-700">GitHub Token</span>
        <input
          type="password"
          v-model="config.token"
          class="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="ghp_xxxxxxxxxxxx"
        />
        <span class="text-xs text-slate-500 mt-1 block">
          Personal access token with repo access
        </span>
      </label>
      
      <label class="block">
        <span class="text-sm font-medium text-slate-700">Repository Owner</span>
        <input
          type="text"
          v-model="config.owner"
          class="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="username or organization"
        />
      </label>
      
      <label class="block">
        <span class="text-sm font-medium text-slate-700">Repository Name</span>
        <input
          type="text"
          v-model="config.repo"
          class="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="repository-name"
        />
      </label>
      
      <label class="block">
        <span class="text-sm font-medium text-slate-700">Branch</span>
        <input
          type="text"
          v-model="config.branch"
          class="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="main"
        />
      </label>
      
      <div v-if="errorMessage" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
        {{ errorMessage }}
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue';
import Modal from './Modal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close', 'saved']);

const config = ref({
  token: '',
  owner: '',
  repo: '',
  branch: 'main'
});

const errorMessage = ref('');

async function handleSave() {
  errorMessage.value = '';
  
  if (!config.value.token || !config.value.owner || !config.value.repo || !config.value.branch) {
    errorMessage.value = 'All fields are required';
    return;
  }
  
  try {
    const response = await $fetch('/api/github/config', {
      method: 'POST',
      body: config.value
    });
    
    if (response.success) {
      emit('saved', config.value);
      emit('close');
    } else {
      errorMessage.value = response.error || 'Failed to save configuration';
    }
  } catch (error) {
    console.error('Error saving GitHub config:', error);
    errorMessage.value = error.message || 'Failed to save configuration';
  }
}
</script>
