import { defineEventHandler, getQuery } from '#imports';
import { listGitHubFolder } from '~/server/utils/github';
import { getGitHubConfigFromRequest } from '~/server/utils/jwt';

export default defineEventHandler(async (event) => {
  const config = getGitHubConfigFromRequest(event);

  if (!config) {
    throw createError({
      statusCode: 401,
      message: 'GitHub configuration not found. Please configure your GitHub integration.'
    });
  }

  const { path = '' } = getQuery(event);

  try {
    const result = await listGitHubFolder(config, String(path));

    return {
      success: true,
      path: String(path),
      folders: result.folders,
      files: result.files
    };
  } catch (error) {
    console.error('Error listing GitHub folder:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to list folder from GitHub'
    });
  }
});
