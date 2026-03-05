import { defineEventHandler } from '#imports';
import { getGitHubConfigFromRequest } from '~/server/utils/jwt';

export default defineEventHandler(async (event) => {
  try {
    const config = getGitHubConfigFromRequest(event);

    if (!config) {
      return {
        success: false,
        configured: false,
        message: 'No GitHub configuration found'
      };
    }

    return {
      success: true,
      configured: true,
      config: {
        owner: config.owner,
        repo: config.repo,
        branch: config.branch
      }
    };
  } catch (error) {
    console.error('Error verifying GitHub config:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to verify GitHub configuration'
    });
  }
});
