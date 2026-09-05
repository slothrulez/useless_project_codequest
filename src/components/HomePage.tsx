import React, { useState, useEffect } from 'react';
import { githubApi, googleApi, githubStorage } from '../utils/githubApi';
import { GitHubUser } from '../types';
import { Globe, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';

interface HomePageProps {
  onAuthenticated: (user: GitHubUser, token: string) => void;
  onError: (error: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onAuthenticated, onError }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeModal, setActiveModal] = useState<'github_token' | 'google_auth' | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [googleEmail, setGoogleEmail] = useState('anirudhksixten@gmail.com');
  const [googleName, setGoogleName] = useState('Anirudh');
  const [authStatusMessage, setAuthStatusMessage] = useState<string | null>(null);

  // Listen for OAuth messages from popup (GitHub & Google)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Security check on origin
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && origin !== window.location.origin) {
        return;
      }

      // 1. GitHub OAuth Success
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const token = event.data.token;
        if (token) {
          githubStorage.setProvider('github');
          githubStorage.setToken(token);
          setAuthStatusMessage('Verifying GitHub credentials...');
          try {
            const verifyRes = await githubApi.verifyToken(token);
            if (verifyRes.success && verifyRes.user) {
              githubStorage.setUser(verifyRes.user);
              onAuthenticated(verifyRes.user, token);
            } else {
              setIsConnecting(false);
              onError(verifyRes.error || 'GitHub verification failed');
            }
          } catch (err: any) {
            setIsConnecting(false);
            onError(err.message || 'Error communicating with GitHub');
          }
        }
      }

      // 2. Google OAuth Success
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const token = event.data.token || 'google_auth_token';
        const user = event.data.user;
        if (user) {
          githubStorage.setProvider('google');
          githubStorage.setToken(token);
          githubStorage.setUser(user);
          setAuthStatusMessage('Welcome to CodeQuest!');
          setTimeout(() => {
            onAuthenticated(user, token);
          }, 300);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAuthenticated, onError]);

  // Connect via GitHub OAuth or Token
  const handleConnectGitHub = async () => {
    setIsConnecting(true);
    setAuthStatusMessage('Connecting to GitHub...');

    try {
      const config = await githubApi.getAuthUrl();

      // If OAuth App is configured, open provider authorization popup
      if (config.configured && config.url) {
        const authWindow = window.open(
          config.url,
          'github_oauth_popup',
          'width=600,height=750,menubar=no,toolbar=no,location=no,status=no'
        );

        if (!authWindow) {
          setIsConnecting(false);
          setActiveModal('github_token');
          return;
        }

        // Poll if popup closed without completing
        const checkTimer = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkTimer);
            setIsConnecting(false);
          }
        }, 1000);
      } else {
        // If OAuth credentials not yet in .env, check if server has environment token or show token input
        const verifyRes = await githubApi.verifyToken();
        if (verifyRes.success && verifyRes.user) {
          githubStorage.setProvider('github');
          githubStorage.setToken(githubStorage.getToken() || '');
          githubStorage.setUser(verifyRes.user);
          onAuthenticated(verifyRes.user, githubStorage.getToken() || '');
        } else {
          setIsConnecting(false);
          setActiveModal('github_token');
        }
      }
    } catch (err: any) {
      setIsConnecting(false);
      setActiveModal('github_token');
    }
  };

  // Connect via Google OAuth or Direct Google Sign-In
  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setAuthStatusMessage('Connecting with Google...');

    try {
      const config = await googleApi.getAuthUrl();

      if (config.configured && config.url) {
        const authWindow = window.open(
          config.url,
          'google_oauth_popup',
          'width=600,height=750,menubar=no,toolbar=no,location=no,status=no'
        );

        if (!authWindow) {
          setIsConnecting(false);
          setActiveModal('google_auth');
          return;
        }

        const checkTimer = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkTimer);
            setIsConnecting(false);
          }
        }, 1000);
      } else {
        // If Google Client ID not in .env, open fast Google Account Sign-In
        setIsConnecting(false);
        setActiveModal('google_auth');
      }
    } catch (err: any) {
      setIsConnecting(false);
      setActiveModal('google_auth');
    }
  };

  // Submit Manual GitHub Token
  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsConnecting(true);
    setAuthStatusMessage('Authenticating GitHub account...');
    try {
      const verifyRes = await githubApi.verifyToken(tokenInput.trim());
      if (verifyRes.success && verifyRes.user) {
        githubStorage.setProvider('github');
        githubStorage.setToken(tokenInput.trim());
        githubStorage.setUser(verifyRes.user);
        setActiveModal(null);
        onAuthenticated(verifyRes.user, tokenInput.trim());
      } else {
        setIsConnecting(false);
        onError(verifyRes.error || 'Invalid GitHub token. Please verify your Personal Access Token.');
      }
    } catch (err: any) {
      setIsConnecting(false);
      onError(err.message || 'Authentication failed');
    }
  };

  // Submit Google Direct Account Sign-In
  const handleGoogleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = googleEmail.trim() || 'anirudhksixten@gmail.com';
    const name = googleName.trim() || email.split('@')[0];

    setIsConnecting(true);
    setAuthStatusMessage('Signing in with Google Account...');
    try {
      const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
      const res = await googleApi.directSignIn(email, name, avatarUrl);
      if (res.success && res.user) {
        githubStorage.setProvider('google');
        githubStorage.setToken(res.token);
        githubStorage.setUser(res.user);
        setActiveModal(null);
        onAuthenticated(res.user, res.token);
      } else {
        setIsConnecting(false);
        onError('Google sign-in failed');
      }
    } catch (err: any) {
      setIsConnecting(false);
      onError(err.message || 'Google authentication error');
    }
  };

  return (
    <div
      id="codequest-home"
      className="relative w-screen h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 select-none overflow-hidden"
    >
      {/* Background Pixel Grid Texture */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #292524 1px, transparent 1px),
            linear-gradient(to bottom, #292524 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Main Home Page Frame */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-lg w-full text-center">
        {/* Title */}
        <h1
          id="home-title"
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-widest text-amber-400 font-['Press_Start_2P'] drop-shadow-[0_4px_16px_rgba(245,158,11,0.35)] mb-4"
        >
          CODEQUEST
        </h1>

        {/* Subtitle */}
        <p
          id="home-subtitle"
          className="text-stone-400 text-xs sm:text-sm md:text-base tracking-[0.25em] uppercase font-['Press_Start_2P'] mb-10"
        >
          YOUR CODE. YOUR WORLD.
        </p>

        {/* Primary Action Buttons */}
        {!activeModal ? (
          <div className="flex flex-col items-center gap-3.5 w-full max-w-sm">
            {/* Connect to GitHub */}
            <button
              id="home-connect-btn"
              onClick={handleConnectGitHub}
              disabled={isConnecting}
              className="w-full py-3.5 px-6 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-stone-950 font-['Press_Start_2P'] text-xs tracking-wider border-2 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0.5 flex items-center justify-center gap-3"
            >
              <span>⚔️</span>
              <span>{isConnecting ? (authStatusMessage || 'CONNECTING...') : '[ CONNECT TO GITHUB ]'}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 w-full my-1">
              <div className="flex-1 h-[1px] bg-stone-800" />
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">OR</span>
              <div className="flex-1 h-[1px] bg-stone-800" />
            </div>

            {/* Continue with Google */}
            <button
              id="home-google-btn"
              onClick={handleConnectGoogle}
              disabled={isConnecting}
              className="w-full py-3.5 px-6 bg-stone-100 hover:bg-white active:bg-stone-200 disabled:opacity-50 text-stone-900 font-['Press_Start_2P'] text-xs tracking-wider border-2 border-stone-300 shadow-[0_0_16px_rgba(255,255,255,0.2)] transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0.5 flex items-center justify-center gap-3"
            >
              {/* Retro Google Icon Badge */}
              <span className="font-sans font-black text-sm flex items-center">
                <span className="text-blue-600">G</span>
                <span className="text-red-600">o</span>
                <span className="text-amber-500">o</span>
                <span className="text-blue-600">g</span>
                <span className="text-emerald-600">l</span>
                <span className="text-red-600">e</span>
              </span>
              <span>[ CONTINUE WITH GOOGLE ]</span>
            </button>

            <div className="mt-4 text-[10px] text-stone-500 font-mono tracking-wide">
              Level up your developer quests with real Git repositories
            </div>
          </div>
        ) : activeModal === 'github_token' ? (
          /* Token Prompt Overlay for GitHub Personal Access Token */
          <form
            onSubmit={handleManualTokenSubmit}
            className="w-full max-w-md bg-stone-900 border-2 border-amber-800/80 p-6 flex flex-col gap-4 text-left shadow-2xl"
          >
            <div className="text-amber-300 font-['Press_Start_2P'] text-xs uppercase tracking-wider text-center">
              ⚔️ GITHUB AUTHENTICATION
            </div>
            <p className="text-stone-400 text-[11px] leading-relaxed font-mono text-center">
              Provide your GitHub Personal Access Token or OAuth to enter your real repository realm.
            </p>

            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700 text-stone-200 font-mono text-xs focus:border-amber-400 focus:outline-none"
              autoFocus
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isConnecting || !tokenInput.trim()}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-['Press_Start_2P'] text-[10px] tracking-wider transition disabled:opacity-50 cursor-pointer"
              >
                {isConnecting ? 'VERIFYING...' : '[ AUTHENTICATE ]'}
              </button>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-xs transition cursor-pointer"
              >
                Back
              </button>
            </div>
          </form>
        ) : (
          /* Google Sign-In Prompt Overlay */
          <form
            onSubmit={handleGoogleDirectSubmit}
            className="w-full max-w-md bg-stone-900 border-2 border-stone-700 p-6 flex flex-col gap-4 text-left shadow-2xl"
          >
            <div className="flex items-center justify-center gap-2 text-stone-200 font-['Press_Start_2P'] text-xs uppercase tracking-wider text-center">
              <span className="text-blue-500">G</span>
              <span className="text-red-500">O</span>
              <span className="text-amber-500">O</span>
              <span className="text-blue-500">G</span>
              <span className="text-emerald-500">L</span>
              <span className="text-red-500">E</span>
              <span>AUTHENTICATION</span>
            </div>

            <p className="text-stone-400 text-[11px] leading-relaxed font-mono text-center">
              Sign in with your Google account to create your personal CodeQuest RPG character and explore the repository world.
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-mono text-stone-400 uppercase">Google Email</label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  className="w-full mt-1 px-3 py-2 bg-stone-950 border border-stone-700 text-stone-200 font-mono text-xs focus:border-amber-400 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-stone-400 uppercase">Hero / Explorer Name</label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="Hero Name"
                  className="w-full mt-1 px-3 py-2 bg-stone-950 border border-stone-700 text-stone-200 font-mono text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick 1-Click Action */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isConnecting}
                className="w-full py-3 bg-stone-100 hover:bg-white text-stone-900 font-['Press_Start_2P'] text-[10px] tracking-wider transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 border border-stone-400"
              >
                <span>⚡</span>
                <span>{isConnecting ? 'SIGNING IN...' : '[ CONTINUE AS GOOGLE HERO ]'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-xs transition cursor-pointer text-center"
              >
                Back to Login Options
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

