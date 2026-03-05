import { defineEventHandler, readBody } from '#imports';
import { commitGitHubFile } from '~/server/utils/github';
import { getGitHubConfigFromRequest } from '~/server/utils/jwt';

interface CommitRequest {
  path: string;
  content: string;
  message: string;
  sha?: string;
}

export default defineEventHandler(async (event) => {
  const githubConfig = getGitHubConfigFromRequest(event);
  
  if (!githubConfig) {
    throw createError({
      statusCode: 401,
      message: 'GitHub configuration not found'
    });
  }

  const body: CommitRequest = await readBody(event);

  if (!body.path || !body.content) {
    throw createError({
      statusCode: 400,
      message: 'File path and content are required'
    });
  }

  try {
    const result = await commitGitHubFile(
      {
        token: githubConfig.token,
        owner: githubConfig.owner,
        repo: githubConfig.repo,
        branch: githubConfig.branch
      },
      body.path,
      body.content,
      body.message || 'Update from Slate',
      body.sha
    );

    return {
      success: true,
      sha: result.content.sha,
      commit: result.commit.sha
    };
  } catch (error) {
    console.error('Error committing to GitHub:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to commit to GitHub'
    });
  }
});
