interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: string;
}

interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  content: string;
  encoding: string;
}

interface GitHubCommitResponse {
  content: {
    sha: string;
    path: string;
  };
  commit: {
    sha: string;
    message: string;
  };
}

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: string;
  sha?: string;
}

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export async function listGitHubFiles(config: GitHubConfig): Promise<GitHubFile[]> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/git/trees/${config.branch}?recursive=1`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Slate-App'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  return data.tree
    .filter((item: GitHubTreeItem) => item.type === 'blob' && item.path.endsWith('.md'))
    .map((item: GitHubTreeItem) => ({
      name: item.path.split('/').pop() || item.path,
      path: item.path,
      sha: item.sha || '',
      size: 0,
      type: item.type
    }));
}

export async function getGitHubFileContent(config: GitHubConfig, path: string): Promise<string> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Slate-App'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data: GitHubFileContent = await response.json();
  
  if (data.encoding === 'base64') {
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }
  
  return data.content;
}

export async function commitGitHubFile(
  config: GitHubConfig,
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<GitHubCommitResponse> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;
  
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch: config.branch
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Slate-App'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`GitHub API error: ${response.status} ${errorData.message || response.statusText}`);
  }

  return await response.json();
}

export async function deleteGitHubFile(
  config: GitHubConfig,
  path: string,
  message: string,
  sha: string
): Promise<void> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Slate-App'
    },
    body: JSON.stringify({
      message,
      sha,
      branch: config.branch
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`GitHub API error: ${response.status} ${errorData.message || response.statusText}`);
  }
}
