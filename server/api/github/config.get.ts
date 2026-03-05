import { defineEventHandler } from '#imports';
import { getGitHubConfigStoreFromRequest } from '~/server/utils/jwt';

export default defineEventHandler(async (event) => {
  try {
    const store = getGitHubConfigStoreFromRequest(event);

    if (!store || store.configs.length === 0) {
      return {
        success: false,
        configured: false,
        message: 'No GitHub configuration found'
      };
    }

    const activeIndex = Math.min(store.activeIndex, store.configs.length - 1);
    const activeConfig = store.configs[activeIndex];

    return {
      success: true,
      configured: true,
      config: {
        owner: activeConfig.owner,
        repo: activeConfig.repo,
        branch: activeConfig.branch
      },
      repos: store.configs.map(c => ({
        owner: c.owner,
        repo: c.repo,
        branch: c.branch
      })),
      activeIndex
    };
  } catch (error) {
    console.error('Error verifying GitHub config:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to verify GitHub configuration'
    });
  }
});
