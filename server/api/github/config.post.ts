import { defineEventHandler, readBody, setCookie } from '#imports';
import { signGitHubConfig } from '~/server/utils/jwt';

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

    const jwt = signGitHubConfig({
      token: body.token,
      owner: body.owner,
      repo: body.repo,
      branch: body.branch
    });

    setCookie(event, 'github_config', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/'
    });

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
