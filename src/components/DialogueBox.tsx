import React, { useEffect, useState, useRef } from 'react';
import { soundFx } from '../utils/audio';

export interface DialogueOption {
  label: string;
  onClick: () => void;
}

export interface DialogueData {
  title: string;
  lines: string[];
  options?: DialogueOption[];
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  secondaryButton?: {
    label: string;
    onClick: () => void;
  };
}

interface DialogueBoxProps {
  dialogue: DialogueData | null;
  onClose: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({ dialogue, onClose }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [currentDialogue, setCurrentDialogue] = useState<DialogueData | null>(null);

  // Typewriter state
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [isTypingComplete, setIsTypingComplete] = useState<boolean>(true);
  const typingTimerRef = useRef<number | null>(null);

  // Manage dialogue display & typewriter animation
  useEffect(() => {
    if (dialogue) {
      setCurrentDialogue(dialogue);
      setIsVisible(true);

      // Start typewriter
      const fullLines = dialogue.lines;
      setDisplayedLines(fullLines.map(() => ''));
      setIsTypingComplete(false);

      let currentLineIdx = 0;
      let currentCharIdx = 0;
      const workingLines = fullLines.map(() => '');

      const typeNextChar = () => {
        if (currentLineIdx >= fullLines.length) {
          setIsTypingComplete(true);
          return;
        }

        const targetLine = fullLines[currentLineIdx];
        if (targetLine === '') {
          // Empty spacing line, skip immediately to next
          currentLineIdx++;
          currentCharIdx = 0;
          typingTimerRef.current = window.setTimeout(typeNextChar, 10);
          return;
        }

        if (currentCharIdx < targetLine.length) {
          workingLines[currentLineIdx] += targetLine[currentCharIdx];
          currentCharIdx++;
          setDisplayedLines([...workingLines]);

          // Play typewriter audio blip on consonants/vowels
          if (currentCharIdx % 3 === 0 && targetLine[currentCharIdx - 1] !== ' ') {
            soundFx.playBlip();
          }

          typingTimerRef.current = window.setTimeout(typeNextChar, 14);
        } else {
          // Move to next line
          currentLineIdx++;
          currentCharIdx = 0;
          typingTimerRef.current = window.setTimeout(typeNextChar, 60);
        }
      };

      typingTimerRef.current = window.setTimeout(typeNextChar, 50);

      return () => {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      };
    } else {
      setIsVisible(false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      const timer = setTimeout(() => {
        setCurrentDialogue(null);
        setDisplayedLines([]);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [dialogue]);

  // Instantly finish typewriter
  const finishTypewriter = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (currentDialogue) {
      setDisplayedLines([...currentDialogue.lines]);
    }
    setIsTypingComplete(true);
  };

  // Click or keypress handler: if still typing -> finish immediately; if done -> dismiss!
  const handleAdvance = () => {
    if (!isTypingComplete) {
      finishTypewriter();
    } else {
      onClose();
    }
  };

  // Keyboard listener: SPACE, E, Enter, Escape
  useEffect(() => {
    if (!dialogue) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Check numeric keys for options
      if (currentDialogue?.options && currentDialogue.options.length > 0) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= currentDialogue.options.length) {
          e.preventDefault();
          e.stopPropagation();
          soundFx.playButton();
          currentDialogue.options[num - 1].onClick();
          return;
        }
      }

      if (e.key === ' ' || e.key.toLowerCase() === 'e' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleAdvance();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [dialogue, isTypingComplete, currentDialogue]);

  if (!currentDialogue) return null;

  return (
    <>
      {/* 20% Opacity Screen Dimming Overlay during Dialogue */}
      <div
        id="dialogue-screen-dim"
        onClick={handleAdvance}
        className={`fixed inset-0 bg-black/20 z-40 pointer-events-auto transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Retro 800px x 150px Monospace Dialogue Box */}
      <div
        id="rpg-dialogue-box"
        onClick={handleAdvance}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto cursor-pointer select-none transition-all duration-200 ${
          isVisible
            ? 'opacity-100 scale-100 ease-out translate-y-0'
            : 'opacity-0 scale-95 ease-in translate-y-2 pointer-events-none'
        }`}
        style={{
          width: 'min(800px, calc(100vw - 32px))',
          height: '150px',
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          border: '2px solid #4dd0e1',
          padding: '15px',
          fontFamily: '"Courier New", Courier, monospace',
          boxShadow: '0 0 25px rgba(77, 208, 225, 0.3), inset 0 0 15px rgba(0, 0, 0, 0.8)'
        }}
      >
        <div className="flex flex-col justify-between h-full w-full">
          {/* Top: NPC Name in Cyan (18px) */}
          <div className="border-b border-stone-700/60 pb-1.5 flex items-center justify-between">
            <h2
              className="font-bold tracking-wide"
              style={{
                fontSize: '18px',
                color: '#4dd0e1',
                textShadow: '0 0 8px rgba(77, 208, 225, 0.5)'
              }}
            >
              {currentDialogue.title}
            </h2>

            <div className="flex items-center gap-2">
              {currentDialogue.secondaryButton && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    currentDialogue.secondaryButton?.onClick();
                  }}
                  className="px-2.5 py-0.5 rounded text-xs bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 transition"
                >
                  {currentDialogue.secondaryButton.label}
                </button>
              )}

              {currentDialogue.actionButton && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    currentDialogue.actionButton?.onClick();
                  }}
                  className="px-2.5 py-0.5 rounded text-xs bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400 text-cyan-200 transition font-bold"
                >
                  {currentDialogue.actionButton.label} &rarr;
                </button>
              )}
            </div>
          </div>

          {/* Middle: Dialogue Body Text in White (14px) */}
          <div
            className="flex-1 py-1 overflow-y-auto flex flex-col justify-center text-white font-mono"
            style={{
              fontSize: '14px',
              lineHeight: '1.4'
            }}
          >
            {displayedLines.map((line, idx) => (
              <p key={idx} className={idx > 0 && line === '' ? 'h-1.5' : ''}>
                {line}
              </p>
            ))}

            {/* Selectable Options if available */}
            {currentDialogue.options && currentDialogue.options.length > 0 && isTypingComplete && (
              <div className="flex flex-wrap gap-2 mt-2 pt-1 border-t border-stone-800">
                {currentDialogue.options.map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFx.playButton();
                      opt.onClick();
                    }}
                    className="px-2.5 py-1 rounded text-xs bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-400 text-cyan-200 transition font-mono flex items-center gap-1.5"
                  >
                    <span className="text-amber-400 font-bold">[{oIdx + 1}]</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom: Continuation prompt in Green (#81c784) */}
          <div className="border-t border-stone-800 pt-1.5 flex items-center justify-between">
            <span
              className="text-stone-400 text-xs flex items-center gap-1.5"
              style={{ color: '#81c784' }}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-[#81c784] animate-ping opacity-75" />
              {!isTypingComplete ? '[Click / SPACE to skip]' : '[SPACE or E to continue]'}
            </span>
            <span className="text-[11px] text-stone-500 hidden sm:inline">
              Click anywhere to advance
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
