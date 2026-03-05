import { defineEventHandler, getQuery } from '#imports';
import { getGitHubFileContent } from '~/server/utils/github';
import { getGitHubConfigFromRequest } from '~/server/utils/jwt';

export default defineEventHandler(async (event) => {
  const githubConfig = getGitHubConfigFromRequest(event);
  
  if (!githubConfig) {
    throw createError({
      statusCode: 401,
      message: 'GitHub configuration not found'
    });
  }

  const query = getQuery(event);
  const path = query.path as string;

  if (!path) {
    throw createError({
      statusCode: 400,
      message: 'File path is required'
    });
  }

  try {
    const content = await getGitHubFileContent({
      token: githubConfig.token,
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      branch: githubConfig.branch
    }, path);

    return {
      success: true,
      content,
      path
    };
  } catch (error) {
    console.error('Error getting GitHub file content:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to get file content from GitHub'
    });
  }
});
