import { defineEventHandler } from '#imports';
import { listGitHubFiles } from '~/server/utils/github';
import { getGitHubConfigFromRequest } from '~/server/utils/jwt';

export default defineEventHandler(async (event) => {
  const config = getGitHubConfigFromRequest(event);

  if (!config) {
    throw createError({
      statusCode: 401,
      message: 'GitHub configuration not found. Please configure your GitHub integration.'
    });
  }

  try {
    const files = await listGitHubFiles(config);

    return {
      success: true,
      files: files.map(file => ({
        id: file.sha,
        name: file.name,
        path: file.path,
        sha: file.sha
      }))
    };
  } catch (error) {
    console.error('Error listing GitHub files:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to list files from GitHub'
    });
  }
});
