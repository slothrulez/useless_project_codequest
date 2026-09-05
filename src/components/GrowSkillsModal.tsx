import React from 'react';
import { X, TrendingUp, Award, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { PlayerStats } from '../types';
import { soundFx } from '../utils/audio';

interface GrowSkillsModalProps {
  stats: PlayerStats;
  onClose: () => void;
}

export const GrowSkillsModal: React.FC<GrowSkillsModalProps> = ({ stats, onClose }) => {
  const levels = [
    { lvl: 1, title: 'Novice Scripter', xpRequired: 0, desc: 'Familiar with git init and git status' },
    { lvl: 2, title: 'Branch Pioneer', xpRequired: 100, desc: 'Can branch, checkout, and stage files with grace' },
    { lvl: 3, title: 'Merge Alchemist', xpRequired: 250, desc: 'Resolves merge conflicts and fast-forwards with ease' },
    { lvl: 4, title: 'Rebase Sorcerer', xpRequired: 500, desc: 'Rewrites history and squashes atomic commits' },
    { lvl: 5, title: 'Git Grandmaster', xpRequired: 1000, desc: 'Master of reflogs, bisects, and distributed pipelines' }
  ];

  const currentLevelInfo = levels.find((l) => l.lvl === stats.level) || levels[0];
  const nextLevelInfo = levels.find((l) => l.lvl === stats.level + 1);

  return (
    <div
      id="grow-skills-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        id="grow-skills-box"
        className="relative w-full max-w-xl bg-stone-900 border-4 border-purple-800/90 rounded-xl shadow-2xl p-4 sm:p-6 text-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 40px rgba(168, 85, 247, 0.25), inset 0 0 20px rgba(0,0,0,0.8)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-950/80 border-2 border-purple-500 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-pixel text-purple-300">DEVELOPER REPUTATION & STATS</h2>
              <p className="text-[10px] font-retro text-stone-400">Track your Git mastery and quest progress</p>
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

        {/* Current Rank Card */}
        <div className="bg-stone-950/90 border border-purple-900/60 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] font-pixel text-purple-400">CURRENT TITLE</div>
              <div className="text-sm font-retro font-bold text-amber-300 mt-0.5">
                Level {stats.level}: {currentLevelInfo.title}
              </div>
              <p className="text-[11px] font-mono text-stone-400 mt-1">{currentLevelInfo.desc}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-pixel text-purple-400">{stats.xp}</div>
              <div className="text-[9px] font-pixel text-stone-500">TOTAL XP</div>
            </div>
          </div>

          {/* XP Progress bar */}
          {nextLevelInfo && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] font-mono text-stone-400 mb-1">
                <span>Progress to Level {stats.level + 1}</span>
                <span>
                  {stats.xp} / {nextLevelInfo.xpRequired} XP
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                <div
                  className="bg-gradient-to-r from-purple-500 to-amber-400 h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (stats.xp / nextLevelInfo.xpRequired) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Achievements Section */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-pixel text-amber-400 mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>ACHIEVEMENTS ({stats.achievements.filter((a) => a.unlocked).length}/{stats.achievements.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {stats.achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-2.5 rounded-lg border text-xs font-mono flex items-start gap-2.5 ${
                  ach.unlocked
                    ? 'bg-purple-950/40 border-purple-700/60 text-purple-100'
                    : 'bg-stone-950/60 border-stone-800 text-stone-500'
                }`}
              >
                <div className="mt-0.5">
                  {ach.unlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-stone-600" />
                  )}
                </div>
                <div>
                  <div className={`font-pixel text-[9px] ${ach.unlocked ? 'text-amber-300' : 'text-stone-500'}`}>
                    {ach.title}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-0.5 leading-tight">{ach.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
