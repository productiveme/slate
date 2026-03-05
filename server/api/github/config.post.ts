import { defineEventHandler, readBody } from '#imports';
import { getGitHubConfigStoreFromRequest, setGitHubConfigStore } from '~/server/utils/jwt';
import type { GitHubConfig, GitHubConfigStore } from '~/server/utils/jwt';

interface GitHubConfigRequest {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<GitHubConfigRequest>(event);

    if (!body.token || !body.owner || !body.repo || !body.branch) {
      throw createError({
        statusCode: 400,
        message: 'All fields are required: token, owner, repo, branch'
      });
    }

    const newConfig: GitHubConfig = {
      token: body.token,
      owner: body.owner,
      repo: body.repo,
      branch: body.branch
    };

    const existingStore = getGitHubConfigStoreFromRequest(event);
    let store: GitHubConfigStore;

    if (existingStore) {
      const existingIndex = existingStore.configs.findIndex(
        c => c.owner === newConfig.owner && c.repo === newConfig.repo
      );
      if (existingIndex !== -1) {
        existingStore.configs[existingIndex] = newConfig;
        existingStore.activeIndex = existingIndex;
      } else {
        existingStore.configs.push(newConfig);
        existingStore.activeIndex = existingStore.configs.length - 1;
      }
      store = existingStore;
    } else {
      store = { configs: [newConfig], activeIndex: 0 };
    }

    setGitHubConfigStore(event, store);

    return {
      success: true,
      message: 'GitHub configuration saved successfully'
    };
  } catch (error) {
    console.error('Error saving GitHub config:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to save GitHub configuration'
    });
  }
});
