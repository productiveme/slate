import { defineEventHandler, readBody } from '#imports';
import { getGitHubConfigStoreFromRequest, setGitHubConfigStore, clearGitHubConfigCookie } from '~/server/utils/jwt';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ index: number }>(event);

    const store = getGitHubConfigStoreFromRequest(event);
    if (!store || store.configs.length === 0) {
      throw createError({ statusCode: 401, message: 'Not authenticated. Please connect a GitHub repository first.' });
    }

    if (body.index < 0 || body.index >= store.configs.length) {
      throw createError({ statusCode: 400, message: 'Invalid repository index' });
    }

    store.configs.splice(body.index, 1);

    if (store.configs.length === 0) {
      clearGitHubConfigCookie(event);
      return { success: true, configured: false };
    }

    if (store.activeIndex >= store.configs.length) {
      store.activeIndex = store.configs.length - 1;
    } else if (store.activeIndex > body.index) {
      store.activeIndex--;
    }

    setGitHubConfigStore(event, store);

    const activeConfig = store.configs[store.activeIndex];
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
      activeIndex: store.activeIndex
    };
  } catch (error) {
    console.error('Error disconnecting GitHub config:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to disconnect repository. Please try again.'
    });
  }
});
