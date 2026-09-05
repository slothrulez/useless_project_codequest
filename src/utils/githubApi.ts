import { GitHubUser, GitHubRepoSummary, GitHubFullRepoData } from '../types';

const TOKEN_KEY = 'codequest_github_token';
const AUTH_PROVIDER_KEY = 'codequest_auth_provider';
const USER_PROFILE_KEY = 'codequest_user_profile';

export const githubStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  },
  getProvider(): 'github' | 'google' {
    return (localStorage.getItem(AUTH_PROVIDER_KEY) as 'github' | 'google') || 'github';
  },
  setProvider(provider: 'github' | 'google') {
    localStorage.setItem(AUTH_PROVIDER_KEY, provider);
    sessionStorage.setItem(AUTH_PROVIDER_KEY, provider);
  },
  getUser(): GitHubUser | null {
    try {
      const data = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser(user: GitHubUser) {
    const json = JSON.stringify(user);
    localStorage.setItem(USER_PROFILE_KEY, json);
    sessionStorage.setItem(USER_PROFILE_KEY, json);
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_PROVIDER_KEY);
    sessionStorage.removeItem(AUTH_PROVIDER_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    sessionStorage.removeItem(USER_PROFILE_KEY);
  }
};

export const googleApi = {
  async getAuthUrl(): Promise<{ url: string; configured: boolean; redirectUri: string }> {
    const res = await fetch('/api/auth/google/url');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async directSignIn(email: string, name?: string, picture?: string): Promise<{ success: boolean; user: GitHubUser; token: string }> {
    const res = await fetch('/api/google/direct-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, picture })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
};

export const githubApi = {
  async getAuthUrl(): Promise<{ url: string; configured: boolean; redirectUri: string; hasEnvToken: boolean }> {
    const res = await fetch('/api/auth/github/url');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async verifyToken(token?: string): Promise<{ success: boolean; user?: GitHubUser; error?: string }> {
    const activeToken = token || githubStorage.getToken() || '';
    const res = await fetch('/api/github/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {})
      },
      body: JSON.stringify({ token: activeToken })
    });
    return res.json();
  },

  async fetchUserRepos(token?: string): Promise<{ success: boolean; repos?: GitHubRepoSummary[]; error?: string }> {
    const activeToken = token || githubStorage.getToken() || '';
    const res = await fetch('/api/github/repos', {
      headers: {
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {})
      }
    });
    return res.json();
  },

  async fetchFullRepoData(
    owner: string,
    repo: string,
    branch?: string,
    token?: string
  ): Promise<{ success: boolean; data?: GitHubFullRepoData; error?: string }> {
    const activeToken = token || githubStorage.getToken() || '';
    const res = await fetch('/api/github/repo-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {})
      },
      body: JSON.stringify({
        token: activeToken,
        owner,
        repo,
        branch
      })
    });
    return res.json();
  }
};

