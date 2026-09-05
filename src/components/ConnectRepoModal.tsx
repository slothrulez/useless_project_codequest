import React, { useState, useMemo } from 'react';
import {
  FolderGit2,
  X,
  Check,
  Loader2,
  HardDrive,
  Terminal,
  Sparkles,
  AlertCircle,
  Search,
  RefreshCw,
  Star,
  GitFork,
  Lock,
  Globe,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { gitApi } from '../utils/gitApi';
import { GitHubRepoSummary, GitHubUser } from '../types';

interface ConnectRepoModalProps {
  currentPath: string;
  currentRepoName: string;
  remoteUrl: string;
  userRepos: GitHubRepoSummary[];
  activeGitHubRepo: GitHubRepoSummary | null;
  githubUser: GitHubUser | null;
  onSelectGitHubRepo: (repo: GitHubRepoSummary) => Promise<void>;
  onLoadCustomRepo: (owner: string, repo: string) => Promise<void>;
  onRefreshUserRepos: () => Promise<void>;
  onConnectedLocal: (repoInfo: { name: string; path: string; remoteURL: string }) => void;
  onClose: () => void;
}

type TabType = 'my_repos' | 'custom_repo' | 'local_git';

export const ConnectRepoModal: React.FC<ConnectRepoModalProps> = ({
  currentPath,
  currentRepoName,
  remoteUrl,
  userRepos,
  activeGitHubRepo,
  githubUser,
  onSelectGitHubRepo,
  onLoadCustomRepo,
  onRefreshUserRepos,
  onConnectedLocal,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(userRepos.length > 0 ? 'my_repos' : 'custom_repo');
  const [searchQuery, setSearchQuery] = useState('');
  const [customRepoInput, setCustomRepoInput] = useState('');
  const [repoPath, setRepoPath] = useState(currentPath || '/Users/developer/Projects/my-project');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter user repositories based on search
  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) return userRepos;
    const q = searchQuery.toLowerCase();
    return userRepos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.full_name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.language && r.language.toLowerCase().includes(q))
    );
  }, [userRepos, searchQuery]);

  // Handle selecting an existing authenticated repo
  const handleSelectRepo = async (repo: GitHubRepoSummary) => {
    setIsLoading(true);
    setErrorMsg(null);
    setLoadingText(`Loading repository world for ${repo.full_name}...`);
    soundFx.playInteract();

    try {
      await onSelectGitHubRepo(repo);
      soundFx.playPushSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch repository.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle loading any custom/public GitHub repo (e.g., owner/repo or url)
  const handleLoadCustomRepo = async (input?: string) => {
    const raw = (input || customRepoInput).trim();
    if (!raw) return;

    setIsLoading(true);
    setErrorMsg(null);

    // Extract owner and repo from input
    // Supports: "owner/repo", "https://github.com/owner/repo", "github.com/owner/repo"
    let owner = '';
    let repo = '';

    const cleanInput = raw
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/^github\.com\//i, '')
      .replace(/\/$/, '')
      .replace(/\.git$/, '');

    const parts = cleanInput.split('/');
    if (parts.length >= 2) {
      owner = parts[0];
      repo = parts[1];
    } else if (githubUser?.login) {
      owner = githubUser.login;
      repo = parts[0];
    } else {
      setIsLoading(false);
      setErrorMsg('Please specify in the format: owner/repository (e.g. facebook/react)');
      return;
    }

    setLoadingText(`Fetching GitHub data for ${owner}/${repo}...`);
    soundFx.playInteract();

    try {
      await onLoadCustomRepo(owner, repo);
      soundFx.playPushSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || `Could not load repository: ${owner}/${repo}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Refreshing GitHub Repositories
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorMsg(null);
    soundFx.playButton();
    try {
      await onRefreshUserRepos();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to refresh repositories list.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle Local Workspace Git connection
  const handleConnectLocal = async (targetPath: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    soundFx.playInteract();
    setLoadingText('Querying local Git repository status...');

    try {
      const res = await gitApi.connectRepo(targetPath);
      if (res.success && res.repo) {
        soundFx.playPushSuccess();
        onConnectedLocal(res.repo);
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to connect to local repository.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Local connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const samplePresets = [
    { name: 'facebook/react', desc: 'The library for web and native UIs', lang: 'JavaScript' },
    { name: 'torvalds/linux', desc: 'Linux kernel source tree', lang: 'C' },
    { name: 'tailwindlabs/tailwindcss', desc: 'A utility-first CSS framework', lang: 'TypeScript' },
    { name: 'microsoft/vscode', desc: 'Visual Studio Code editor', lang: 'TypeScript' },
    { name: 'shadcn-ui/ui', desc: 'Beautifully designed components', lang: 'TypeScript' }
  ];

  return (
    <div
      id="connect-repo-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="connect-repo-modal"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-stone-900 border-4 border-amber-700/90 rounded-2xl shadow-2xl text-stone-200 overflow-hidden font-pixelated"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 35px rgba(0, 0, 0, 0.9), inset 0 0 30px rgba(0,0,0,0.85)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 p-4 sm:p-5 bg-stone-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stone-900 border border-amber-600/80 flex items-center justify-center text-amber-400 shadow-inner">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-pixel text-amber-300">SWITCH REPOSITORY WORLD</h2>
              <p className="text-[10.5px] text-stone-400">
                {githubUser ? `Authenticated as @${githubUser.login}` : 'Select or explore any GitHub repository'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playButton();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 border border-stone-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Repo Banner */}
        <div className="px-4 py-2.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[9px] font-pixel text-stone-500 uppercase shrink-0">CURRENT REALM:</span>
            <span className="font-bold text-amber-300 truncate">{currentRepoName || 'Default World'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-pixel text-emerald-400 shrink-0">
            <Check className="w-3.5 h-3.5" />
            <span>ACTIVE</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-stone-800 bg-stone-900/90 px-4 pt-3 gap-2 shrink-0">
          <button
            onClick={() => {
              setActiveTab('my_repos');
              soundFx.playButton();
            }}
            className={`px-3.5 py-2 text-xs font-pixel text-[9.5px] rounded-t-lg border-t border-x transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'my_repos'
                ? 'bg-stone-950 border-stone-700 text-amber-300 border-b-2 border-b-transparent'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>My GitHub Repos ({userRepos.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('custom_repo');
              soundFx.playButton();
            }}
            className={`px-3.5 py-2 text-xs font-pixel text-[9.5px] rounded-t-lg border-t border-x transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'custom_repo'
                ? 'bg-stone-950 border-stone-700 text-amber-300 border-b-2 border-b-transparent'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Explore Any Repo</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('local_git');
              soundFx.playButton();
            }}
            className={`px-3.5 py-2 text-xs font-pixel text-[9.5px] rounded-t-lg border-t border-x transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'local_git'
                ? 'bg-stone-950 border-stone-700 text-amber-300 border-b-2 border-b-transparent'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Local / Workspace</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-stone-950 border border-rose-800 text-xs text-rose-200 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: My GitHub Repositories */}
        {activeTab === 'my_repos' && (
          <div className="p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Search and Refresh Bar */}
            <div className="flex gap-2 mb-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter your repositories by name, language, topic..."
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-stone-500 hover:text-stone-300 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-xs rounded-lg transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                title="Refresh GitHub repositories list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {/* Repositories Scroll List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredRepos.length > 0 ? (
                filteredRepos.map((repo) => {
                  const isActive =
                    activeGitHubRepo?.id === repo.id ||
                    currentRepoName.toLowerCase() === repo.name.toLowerCase() ||
                    currentRepoName.toLowerCase() === repo.full_name.toLowerCase();

                  return (
                    <div
                      key={repo.id}
                      className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-amber-950/20 border-amber-600/80 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                          : 'bg-stone-950/80 border-stone-800 hover:border-stone-700 hover:bg-stone-950'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-amber-200 text-xs sm:text-sm truncate">
                            {repo.name}
                          </span>
                          {repo.private ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 text-[9px] border border-stone-700 font-pixel">
                              <Lock className="w-2.5 h-2.5" /> PRIVATE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-800/60 text-stone-400 text-[9px] border border-stone-700 font-pixel">
                              <Globe className="w-2.5 h-2.5" /> PUBLIC
                            </span>
                          )}
                          {repo.language && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[9.5px] border border-amber-500/30">
                              {repo.language}
                            </span>
                          )}
                        </div>

                        {repo.description && (
                          <p className="text-[11px] text-stone-400 mt-1 line-clamp-1">
                            {repo.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[10px] text-stone-500 mt-1.5">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400/80" /> {repo.stargazers_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="w-3 h-3 text-stone-400" /> {repo.forks_count}
                          </span>
                          <span>Branch: <strong className="text-stone-400">{repo.default_branch}</strong></span>
                        </div>
                      </div>

                      {/* Select / Switch Button */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-lg border border-stone-700 transition"
                          title="Open on GitHub"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {isActive ? (
                          <span className="px-3.5 py-1.5 bg-amber-950/60 border border-amber-600 text-amber-300 font-pixel text-[9px] rounded-lg flex items-center gap-1">
                            <Check className="w-3 h-3" /> CURRENT
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectRepo(repo)}
                            disabled={isLoading}
                            className="px-3.5 py-1.5 bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-200 font-pixel text-[9px] font-bold rounded-lg border border-stone-700 hover:border-amber-400 transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Switch Realm</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-stone-500 text-xs">
                  {userRepos.length === 0 ? (
                    <div className="space-y-3">
                      <p>No repositories found on this GitHub account yet.</p>
                      <button
                        onClick={() => setActiveTab('custom_repo')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-pixel text-[9px] rounded-lg transition"
                      >
                        Explore Any Public Repository →
                      </button>
                    </div>
                  ) : (
                    <p>No repositories matched "{searchQuery}"</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Load Any GitHub Repository */}
        {activeTab === 'custom_repo' && (
          <div className="p-4 flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-pixel text-amber-300 uppercase">
                ENTER REPOSITORY IDENTIFIER OR URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRepoInput}
                  onChange={(e) => setCustomRepoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLoadCustomRepo();
                  }}
                  placeholder="e.g. facebook/react or torvalds/linux or https://github.com/..."
                  disabled={isLoading}
                  className="flex-1 bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-lg px-3 py-2.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => handleLoadCustomRepo()}
                  disabled={isLoading || !customRepoInput.trim()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-stone-950 font-pixel text-[9.5px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-md shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>LOAD REALM</span>
                </button>
              </div>
              <p className="text-[10.5px] text-stone-400">
                CodeQuest will instantly fetch the repository's real file tree, commit history, branches, issues, and README.
              </p>
            </div>

            {/* Popular Repositories Presets */}
            <div className="space-y-2 pt-2 border-t border-stone-800">
              <span className="text-[10px] font-pixel text-stone-400 uppercase flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>POPULAR OPEN-SOURCE REALMS TO EXPLORE:</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {samplePresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setCustomRepoInput(preset.name);
                      handleLoadCustomRepo(preset.name);
                    }}
                    disabled={isLoading}
                    className="p-2.5 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/80 text-left transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-amber-200 text-xs group-hover:text-amber-300 truncate">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-stone-400 truncate">
                        {preset.desc}
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-stone-900 rounded text-amber-400 border border-stone-700 shrink-0">
                      {preset.lang}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Local / Workspace Git */}
        {activeTab === 'local_git' && (
          <div className="p-4 flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4">
            <div className="space-y-3">
              <label className="block text-[10px] font-pixel text-stone-400 uppercase">
                LOCAL REPOSITORY DIRECTORY PATH:
              </label>
              <div className="relative">
                <Terminal className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  value={repoPath}
                  onChange={(e) => setRepoPath(e.target.value)}
                  placeholder="/Users/anirudh/Projects/my-project"
                  disabled={isLoading}
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleConnectLocal(process.cwd())}
                  disabled={isLoading}
                  className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-lg border border-stone-700 transition cursor-pointer"
                >
                  Use CodeQuest Workspace
                </button>
                <button
                  onClick={() => handleConnectLocal(repoPath)}
                  disabled={isLoading || !repoPath.trim()}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-amber-600 text-amber-200 font-pixel text-[9px] font-bold rounded-lg transition flex items-center gap-1.5 shadow-md cursor-pointer ml-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Connect Local</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-3" />
            <p className="font-pixel text-xs text-amber-300 text-center animate-pulse">
              {loadingText || 'TRANSFORMING CODEBASE INTO RPG REALM...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

