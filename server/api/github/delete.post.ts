import { defineEventHandler, readBody } from '#imports';
import { deleteGitHubFile } from '~/server/utils/github';
import { getGitHubConfigFromRequest } from '~/server/utils/jwt';

interface DeleteRequest {
  path: string;
  message: string;
  sha: string;
}

export default defineEventHandler(async (event) => {
  const githubConfig = getGitHubConfigFromRequest(event);
  
  if (!githubConfig) {
    throw createError({
      statusCode: 401,
      message: 'GitHub configuration not found'
    });
  }

  const body: DeleteRequest = await readBody(event);

  if (!body.path || !body.sha) {
    throw createError({
      statusCode: 400,
      message: 'File path and SHA are required'
    });
  }

  try {
    await deleteGitHubFile(
      {
        token: githubConfig.token,
        owner: githubConfig.owner,
        repo: githubConfig.repo,
        branch: githubConfig.branch
      },
      body.path,
      body.message || 'Delete from Slate',
      body.sha
    );

    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting from GitHub:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to delete from GitHub'
    });
  }
});
