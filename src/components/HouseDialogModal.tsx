import React, { useState } from 'react';
import { X, Home, FileCode, FileText, Package, EyeOff, BookOpen, Cloud, Sparkles, Check, Play, Star, GitFork, AlertCircle } from 'lucide-react';
import { GameLocation, GitHubFullRepoData } from '../types';
import { soundFx } from '../utils/audio';

interface HouseDialogModalProps {
  location: GameLocation;
  onClose: () => void;
  onTriggerEvent?: (type: string) => void;
  realRepoData?: GitHubFullRepoData | null;
}

export const HouseDialogModal: React.FC<HouseDialogModalProps> = ({
  location,
  onClose,
  onTriggerEvent,
  realRepoData
}) => {
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const getIcon = () => {
    switch (location.id) {
      case 'house_green':
        return <FileCode className="w-5 h-5 text-emerald-400" />;
      case 'house_red':
        return <FileText className="w-5 h-5 text-rose-400" />;
      case 'house_brown':
        return <Package className="w-5 h-5 text-amber-500" />;
      case 'house_dark':
        return <EyeOff className="w-5 h-5 text-slate-400" />;
      case 'docs':
        return <BookOpen className="w-5 h-5 text-cyan-400" />;
      case 'remote_origin':
        return <Cloud className="w-5 h-5 text-sky-400" />;
      default:
        return <Home className="w-5 h-5 text-amber-400" />;
    }
  };

  const tree = realRepoData?.tree || [];
  const repo = realRepoData?.repo;

  // Filter real files for each house
  const srcFiles = tree.filter((f) => f.path.startsWith('src/') || f.path.startsWith('lib/') || f.path.startsWith('app/') || f.path.endsWith('.ts') || f.path.endsWith('.js') || f.path.endsWith('.py') || f.path.endsWith('.rs') || f.path.endsWith('.go')).slice(0, 8);

  const handleAction = () => {
    soundFx.playInteract();
    if (realRepoData) {
      switch (location.id) {
        case 'house_green':
          setActionMessage(`Scanned ${srcFiles.length} source file(s) in ${repo?.name}! Codebase active on ${realRepoData.activeBranch}.`);
          break;
        case 'house_red':
          setActionMessage(realRepoData.readme ? `README verified (${realRepoData.readme.length} characters of real repository documentation).` : 'No README file detected in repository.');
          break;
        case 'house_brown':
          const langList = Object.keys(realRepoData.languages).join(', ') || repo?.language || 'Code';
          setActionMessage(`Languages detected: ${langList}.`);
          break;
        case 'house_dark':
          setActionMessage(`.gitignore and configs scanned in ${repo?.full_name}.`);
          break;
        case 'docs':
          setActionMessage(`Repository stats: ★ ${repo?.stargazers_count || 0} stars, ⑂ ${repo?.forks_count || 0} forks, ⚠ ${repo?.open_issues_count || 0} open issues.`);
          break;
        case 'remote_origin':
          setActionMessage(`Connected to GitHub: ${repo?.html_url || 'https://github.com'}`);
          break;
        default:
          setActionMessage('Inspection complete!');
      }
    } else {
      setActionMessage('Inspection complete!');
    }
    onTriggerEvent?.(location.id);
  };

  return (
    <div
      id="house-dialog-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        id="house-dialog-box"
        className="relative w-full max-w-lg bg-stone-900 border-4 border-stone-800 rounded-xl shadow-2xl p-5 text-stone-200 overflow-hidden font-pixelated"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderTopColor: location.roofColor || '#d97706',
          boxShadow: '0 0 30px rgba(0,0,0,0.8)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center border shadow-inner"
              style={{
                backgroundColor: (location.roofColor || '#78350f') + '33',
                borderColor: location.roofColor || '#78350f'
              }}
            >
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-pixel text-amber-200">{location.name}</h2>
              </div>
              <p className="text-[10px] font-pixelated text-stone-400">
                {repo?.full_name ? `${repo.full_name} | ${location.subtitle || 'Dwelling'}` : (location.subtitle || 'Village Dwelling')}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playButton();
              onClose();
            }}
            className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 border border-stone-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real README content preview */}
        {location.id === 'house_red' && realRepoData?.readme ? (
          <div className="bg-stone-950 border border-stone-800 rounded p-4 mb-4 max-h-48 overflow-y-auto font-mono text-[11px] text-stone-300 whitespace-pre-wrap">
            <div className="text-[9px] font-pixel text-rose-400 mb-2">📄 REAL README.MD CONTENT:</div>
            {realRepoData.readme.slice(0, 1000)}
            {realRepoData.readme.length > 1000 && '...'}
          </div>
        ) : location.id === 'docs' && repo ? (
          <div className="bg-stone-950 border border-stone-800 rounded p-4 mb-4 font-mono text-[11px]">
            <div className="text-[9px] font-pixel text-cyan-400 mb-2">📊 REAL GITHUB REPOSITORY METRICS:</div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1 pb-2 border-b border-stone-800">
              <div className="bg-stone-900 p-2 rounded border border-stone-800">
                <div className="text-amber-400 font-bold flex items-center justify-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> {repo.stargazers_count}
                </div>
                <div className="text-[9px] text-stone-400">Stars</div>
              </div>
              <div className="bg-stone-900 p-2 rounded border border-stone-800">
                <div className="text-sky-400 font-bold flex items-center justify-center gap-1">
                  <GitFork className="w-3.5 h-3.5" /> {repo.forks_count}
                </div>
                <div className="text-[9px] text-stone-400">Forks</div>
              </div>
              <div className="bg-stone-900 p-2 rounded border border-stone-800">
                <div className="text-rose-400 font-bold flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {repo.open_issues_count}
                </div>
                <div className="text-[9px] text-stone-400">Issues</div>
              </div>
            </div>
            <div className="text-[10px] text-stone-400 mt-2">
              Primary Language: <span className="text-stone-200 font-bold">{repo.language || 'Multi-language'}</span> | Default Branch: <span className="text-stone-200 font-bold">{repo.default_branch}</span>
            </div>
          </div>
        ) : location.id === 'house_green' && srcFiles.length > 0 ? (
          <div className="bg-stone-950 border border-stone-800 rounded p-3 mb-4 font-mono text-[11px] text-stone-300">
            <div className="text-[9px] font-pixel text-emerald-400 mb-2">📁 REAL SOURCE FILES ({srcFiles.length}):</div>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {srcFiles.map((sf, idx) => (
                <div key={idx} className="flex items-center gap-2 text-stone-300 text-[10px]">
                  <span className="text-emerald-500">▶</span>
                  <span className="truncate">{sf.path}</span>
                  {sf.size && <span className="text-[9px] text-stone-500 ml-auto">{(sf.size / 1024).toFixed(1)} KB</span>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Dialogue Body */
          <div className="bg-stone-950 border border-stone-800 rounded p-4 mb-4">
            <div className="text-[9px] font-pixel text-amber-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>FACILITY INFO:</span>
            </div>

            <div className="space-y-2">
              {location.dialogue.map((line, idx) => (
                <p key={idx} className="text-xs font-pixelated text-stone-300 leading-relaxed">
                  &ldquo;{line}&rdquo;
                </p>
              ))}
            </div>

            {location.promptQuote && (
              <div className="mt-3 pt-2 border-t border-stone-800 text-[10.5px] font-pixelated text-amber-300/80 italic">
                {location.promptQuote}
              </div>
            )}
          </div>
        )}

        {/* Action result banner */}
        {actionMessage && (
          <div className="mb-4 p-2.5 bg-stone-950 border border-emerald-800 rounded text-xs font-pixelated text-emerald-300 flex items-start gap-2">
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Interactive action button */}
        <div className="flex gap-2 font-pixelated">
          <button
            onClick={handleAction}
            className="flex-1 py-2 px-3 rounded bg-stone-800 hover:bg-stone-700 border border-amber-600 text-amber-200 font-pixel text-[9px] transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
          >
            <Play className="w-3 h-3 text-amber-400 fill-current" />
            <span>Inspect {location.fileRepresentation || 'Facility'}</span>
          </button>

          <button
            onClick={() => {
              soundFx.playButton();
              onClose();
            }}
            className="py-2 px-4 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-pixel text-[9px] border border-stone-700 transition cursor-pointer"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};
