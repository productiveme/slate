import jwt from 'jsonwebtoken';
import type { H3Event } from 'h3';

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'slate-default-secret-change-in-production';
const JWT_EXPIRY = '365d';

export function signGitHubConfig(config: GitHubConfig): string {
  return jwt.sign(config, JWT_SECRET, {
    expiresIn: JWT_EXPIRY
  });
}

export function verifyGitHubConfig(token: string): GitHubConfig | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as GitHubConfig;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function getGitHubConfigFromRequest(event: H3Event): GitHubConfig | null {
  const token = getCookie(event, 'github_config');
  
  if (!token) {
    return null;
  }
  
  return verifyGitHubConfig(token);
}
