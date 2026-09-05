import { RealGitStatus, GitStatusMode } from '../types';

export const fallbackGitStatus: RealGitStatus = {
  repoName: 'codequest-repo',
  currentBranch: 'main',
  status: 'clean',
  uncommittedChanges: [],
  untrackedFiles: [],
  commitsAhead: 0,
  commitsBehind: 0,
  hasConflict: false,
  conflictingFiles: [],
  currentCommit: {
    hash: '4048db1',
    message: 'feat: Initial commit of CodeQuest RPG world',
    author: 'CodeQuest Hero',
    date: 'just now'
  },
  remoteUrl: 'origin -> /tmp/codequest-remote.git',
  branches: ['main', 'develop', 'feature/quest-magic']
};

export const gitApi = {
  async fetchStatus(): Promise<RealGitStatus> {
    try {
      const res = await fetch('/api/git/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        return {
          repoName: data.repoName,
          currentBranch: data.currentBranch,
          status: data.status,
          uncommittedChanges: data.uncommittedChanges || [],
          untrackedFiles: data.untrackedFiles || [],
          commitsAhead: data.commitsAhead || 0,
          commitsBehind: data.commitsBehind || 0,
          hasConflict: Boolean(data.hasConflict),
          conflictingFiles: data.conflictingFiles || [],
          currentCommit: data.currentCommit || fallbackGitStatus.currentCommit,
          remoteUrl: data.remoteUrl || fallbackGitStatus.remoteUrl,
          branches: data.branches || fallbackGitStatus.branches
        };
      }
      return fallbackGitStatus;
    } catch (err) {
      console.warn('Could not fetch git status from server, using fallback', err);
      return fallbackGitStatus;
    }
  },

  async commit(message: string): Promise<{ success: boolean; message?: string; error?: string; status?: RealGitStatus }> {
    try {
      const res = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Commit failed' };
    }
  },

  async push(branch?: string): Promise<{ success: boolean; message?: string; error?: string; status?: RealGitStatus }> {
    try {
      const res = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Push failed' };
    }
  },

  async pull(branch?: string): Promise<{ success: boolean; message?: string; error?: string; status?: RealGitStatus; hasConflict?: boolean }> {
    try {
      const res = await fetch('/api/git/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Pull failed' };
    }
  },

  async checkout(branch: string, create?: boolean): Promise<{ success: boolean; message?: string; error?: string; status?: RealGitStatus }> {
    try {
      const res = await fetch('/api/git/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch, create })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Checkout failed' };
    }
  },

  async resolveConflict(file: string, strategy: 'ours' | 'theirs' | 'mark-resolved'): Promise<{ success: boolean; message?: string; status?: RealGitStatus }> {
    try {
      const res = await fetch('/api/git/resolve-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file, strategy })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Resolution failed' };
    }
  },

  async simulate(action: 'dirty' | 'untracked' | 'ahead' | 'conflict' | 'clean'): Promise<{ success: boolean; status?: RealGitStatus }> {
    try {
      const res = await fetch('/api/git/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false };
    }
  },

  async executeCommand(command: string, repo?: string): Promise<{ success: boolean; output?: string; error?: string; suggestion?: string; stdout?: string; stderr?: string }> {
    try {
      const response = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, repo })
      });
      const result = await response.json();
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async connectRepo(path?: string): Promise<{ success: boolean; message?: string; repo?: { name: string; path: string; remoteURL: string }; status?: RealGitStatus; error?: string; suggestion?: string }> {
    try {
      const res = await fetch('/api/git/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async fetchRepo(): Promise<{ success: boolean; repo?: { name: string; path: string; remoteURL: string } }> {
    try {
      const res = await fetch('/api/git/repo');
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false };
    }
  }
};

export async function executeGitCommand(command: string, repo?: string): Promise<{ success: boolean; output?: string; error?: string; suggestion?: string; stdout?: string; stderr?: string }> {
  return gitApi.executeCommand(command, repo);
}
