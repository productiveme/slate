import { defineEventHandler, readBody } from '#imports';
import { getGitHubConfigStoreFromRequest, setGitHubConfigStore } from '~/server/utils/jwt';

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

    store.activeIndex = body.index;
    setGitHubConfigStore(event, store);

    const activeConfig = store.configs[body.index];
    return {
      success: true,
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
      activeIndex: body.index
    };
  } catch (error) {
    console.error('Error switching GitHub config:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to switch repository. Please try again or reconnect your GitHub account.'
    });
  }
});
