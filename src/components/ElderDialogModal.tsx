import React, { useState } from 'react';
import { X, Sparkles, Wand2, Scroll, ShieldCheck, AlertTriangle } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface ElderDialogModalProps {
  isClean: boolean;
  dirtyCount: number;
  onClose: () => void;
  onOpenCommit: () => void;
  onAddWisdomXP: () => void;
}

export const ElderDialogModal: React.FC<ElderDialogModalProps> = ({
  isClean,
  dirtyCount,
  onClose,
  onOpenCommit,
  onAddWisdomXP
}) => {
  const [activeTab, setActiveTab] = useState<'wisdom' | 'quest' | 'oracle'>('wisdom');
  const [oracleAnswer, setOracleAnswer] = useState<string | null>(null);
  const [claimedWisdom, setClaimedWisdom] = useState(false);

  const gitTips = [
    {
      q: 'How to undo a commit without losing your work?',
      a: 'Use "git reset --soft HEAD~1". Your changes remain safely in your staging area ready to be adjusted!'
    },
    {
      q: 'How to discard changes in a single file?',
      a: 'Use "git restore <file>" or "git checkout -- <file>". The working tree will revert to the last committed state.'
    },
    {
      q: 'What is the true power of git stash?',
      a: 'Stashing shelters your unfinished craft into a pocket dimension ("git stash"), letting you switch branches freely and recover them later with "git stash pop"!'
    },
    {
      q: 'How to combine messy commits into one clean entry?',
      a: 'Summon interactive rebase: "git rebase -i HEAD~3" and mark subsequent commits as "squash" or "fixup"!'
    }
  ];

  return (
    <div
      id="elder-dialog-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        id="elder-dialog-box"
        className="relative w-full max-w-lg bg-stone-900 border-4 border-amber-800/90 rounded-lg shadow-2xl p-4 sm:p-6 text-stone-200 overflow-hidden font-pixelated"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(0,0,0,0.8)'
        }}
      >
        {/* Stone frame headers & close button */}
        <div className="flex items-center justify-between border-b-2 border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stone-950 border border-amber-700/80 flex items-center justify-center text-amber-300">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-pixel text-amber-300">THE ELDER</h2>
              <p className="text-[10px] font-pixelated text-stone-400">Keeper of the Ancient Repository</p>
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

        {/* The Elder's Signature Dialogue Box */}
        <div className="bg-stone-950 border border-amber-900/60 rounded p-4 mb-4 relative">
          <div className="text-[10px] font-pixel text-amber-400 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ELDER'S PROCLAMATION:</span>
          </div>
          <blockquote className="text-xs sm:text-sm font-pixel text-amber-200 tracking-wide leading-relaxed pl-2 border-l-2 border-amber-600">
            &ldquo;Seek issues. Move forward. Solve wisdom.&rdquo;
          </blockquote>

          {/* Dynamic reaction to Git status */}
          <div className="mt-3 pt-3 border-t border-stone-800 text-xs font-pixelated">
            {isClean ? (
              <div className="flex items-start gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  &ldquo;The branch flows clear like mountain water. The commits are sound. Go forth and seek wisdom in the code.&rdquo;
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <p className="text-rose-300 font-pixel text-[9px] mb-1">
                    &ldquo;Ah, traveler... your working tree is restless! You have {dirtyCount} uncommitted changes.&rdquo;
                  </p>
                  <p className="text-stone-400 text-[10.5px]">
                    Stage your deeds with reverence before entering the Git Shrine, lest merge conflicts plague your path.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCommit();
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 border border-amber-600 text-amber-200 font-pixel text-[8px] rounded font-bold transition"
                  >
                    Forge Commit Now &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-stone-800 mb-3 gap-1 text-[9px] font-pixel">
          <button
            onClick={() => {
              setActiveTab('wisdom');
              soundFx.playButton();
            }}
            className={`px-3 py-1.5 rounded-t transition ${
              activeTab === 'wisdom'
                ? 'bg-stone-950 text-amber-300 border-t-2 border-amber-600'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Teachings
          </button>
          <button
            onClick={() => {
              setActiveTab('oracle');
              soundFx.playButton();
            }}
            className={`px-3 py-1.5 rounded-t transition ${
              activeTab === 'oracle'
                ? 'bg-stone-950 text-amber-300 border-t-2 border-amber-600'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Git Oracle
          </button>
          <button
            onClick={() => {
              setActiveTab('quest');
              soundFx.playButton();
            }}
            className={`px-3 py-1.5 rounded-t transition ${
              activeTab === 'quest'
                ? 'bg-stone-950 text-amber-300 border-t-2 border-amber-600'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Quests
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'wisdom' && (
          <div className="space-y-2 text-xs font-pixelated text-stone-300 max-h-48 overflow-y-auto pr-1">
            <div className="p-2.5 bg-stone-950 rounded border border-stone-800">
              <div className="font-pixel text-[9px] text-amber-400 mb-1">THE THREE REALMS:</div>
              <p className="text-stone-300 text-[11px] leading-relaxed">
                1. <strong>Working Tree:</strong> The mortal realm where you edit and forge code.
                <br />
                2. <strong>Staging Index:</strong> The altar where prepared files await consecration.
                <br />
                3. <strong>Git Repository:</strong> The eternal granite hall where immutable history is immortalized.
              </p>
            </div>

            {!claimedWisdom ? (
              <button
                onClick={() => {
                  soundFx.playElder();
                  setClaimedWisdom(true);
                  onAddWisdomXP();
                }}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 border border-amber-600 text-amber-200 font-pixel text-[9px] rounded font-bold transition flex items-center justify-center gap-1.5 shadow"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Receive Elder Blessing (+50 XP)
              </button>
            ) : (
              <div className="text-center text-[10px] font-pixel text-emerald-400 py-1">
                ✓ You have received the Elder's blessing today.
              </div>
            )}
          </div>
        )}

        {activeTab === 'oracle' && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs font-pixelated">
            <p className="text-[10.5px] font-pixelated text-stone-400 mb-2">Select a trial of wisdom to consult the Oracle:</p>
            <div className="space-y-1.5">
              {gitTips.map((tip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    soundFx.playInteract();
                    setOracleAnswer(tip.a);
                  }}
                  className="w-full text-left p-2 rounded bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-200 transition text-[11px] font-pixelated flex items-center justify-between"
                >
                  <span>{tip.q}</span>
                  <span className="text-amber-400 text-[9px] font-pixel shrink-0 ml-2">&gt;</span>
                </button>
              ))}
            </div>
            {oracleAnswer && (
              <div className="mt-3 p-3 bg-stone-950 border border-amber-700/80 rounded text-amber-200 text-xs font-pixelated">
                <div className="font-pixel text-[9px] text-amber-400 mb-1">ORACLE SPEAKS:</div>
                <p>{oracleAnswer}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'quest' && (
          <div className="space-y-2 text-xs font-pixelated max-h-48 overflow-y-auto pr-1">
            <div className="p-2.5 bg-stone-950 rounded border border-stone-800 flex items-start justify-between">
              <div>
                <div className="font-pixel text-[9px] text-amber-300">QUEST 1: THE CLEAN TREE</div>
                <p className="text-[10.5px] text-stone-400 mt-1">Commit all pending alterations to achieve a pure clean working tree status.</p>
              </div>
              <span className={`px-2 py-0.5 text-[8px] font-pixel rounded ${isClean ? 'bg-stone-900 border border-emerald-800 text-emerald-300' : 'bg-stone-900 border border-stone-700 text-stone-400'}`}>
                {isClean ? 'COMPLETED' : 'IN PROGRESS'}
              </span>
            </div>
            <div className="p-2.5 bg-stone-950 rounded border border-stone-800 flex items-start justify-between">
              <div>
                <div className="font-pixel text-[9px] text-amber-300">QUEST 2: EXPLORE THE COTTAGES</div>
                <p className="text-[10.5px] text-stone-400 mt-1">Visit src/, README.md, package.json, and .gitignore to learn their duties.</p>
              </div>
              <span className="px-2 py-0.5 text-[8px] font-pixel rounded bg-stone-900 border border-amber-800 text-amber-300">
                ACTIVE
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
