import jwt from 'jsonwebtoken';
import type { H3Event } from 'h3';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface GitHubConfigStore {
  configs: GitHubConfig[];
  activeIndex: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'slate-default-secret-change-in-production';
const JWT_EXPIRY = '365d';
const COOKIE_NAME = 'github_config';

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 365,
    path: '/'
  };
}

export function signGitHubConfigs(store: GitHubConfigStore): string {
  return jwt.sign(store, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyGitHubConfigs(token: string): GitHubConfigStore | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
    const { exp, iat, nbf, jti, iss, aud, sub, ...payload } = decoded;
    if (payload.configs && Array.isArray(payload.configs)) {
      return payload as unknown as GitHubConfigStore;
    }
    if (payload.token && payload.owner && payload.repo && payload.branch) {
      return {
        configs: [{
          token: payload.token as string,
          owner: payload.owner as string,
          repo: payload.repo as string,
          branch: payload.branch as string
        }],
        activeIndex: 0
      };
    }
    return null;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function getGitHubConfigStoreFromRequest(event: H3Event): GitHubConfigStore | null {
  const token = getCookie(event, COOKIE_NAME);
  if (!token) return null;
  return verifyGitHubConfigs(token);
}

export function getGitHubConfigFromRequest(event: H3Event): GitHubConfig | null {
  const store = getGitHubConfigStoreFromRequest(event);
  if (!store || store.configs.length === 0) return null;
  const index = Math.min(store.activeIndex, store.configs.length - 1);
  return store.configs[index];
}

export function setGitHubConfigStore(event: H3Event, store: GitHubConfigStore): void {
  const token = signGitHubConfigs(store);
  setCookie(event, COOKIE_NAME, token, cookieOptions());
}

export function clearGitHubConfigCookie(event: H3Event): void {
  deleteCookie(event, COOKIE_NAME);
}
