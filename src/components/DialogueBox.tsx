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

      {/* Retro 800px x 150px Pixelated Dialogue Box */}
      <div
        id="rpg-dialogue-box"
        onClick={handleAdvance}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto cursor-pointer select-none transition-all duration-200 font-pixelated ${
          isVisible
            ? 'opacity-100 scale-100 ease-out translate-y-0'
            : 'opacity-0 scale-95 ease-in translate-y-2 pointer-events-none'
        }`}
        style={{
          width: 'min(800px, calc(100vw - 32px))',
          height: '155px',
          backgroundColor: 'rgba(24, 22, 20, 0.96)',
          border: '2px solid rgba(180, 83, 9, 0.85)',
          padding: '14px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), inset 0 0 15px rgba(0, 0, 0, 0.7)'
        }}
      >
        <div className="flex flex-col justify-between h-full w-full font-pixelated">
          {/* Top: NPC Name in Amber (16px) */}
          <div className="border-b border-stone-800 pb-1.5 flex items-center justify-between">
            <h2
              className="font-bold tracking-wide font-pixel text-xs sm:text-sm text-amber-300"
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
                  className="px-2.5 py-1 rounded text-[10px] bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 transition"
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
                  className="px-2.5 py-1 rounded text-[10px] bg-stone-800 hover:bg-stone-700 border border-amber-600 text-amber-200 transition font-bold"
                >
                  {currentDialogue.actionButton.label} &rarr;
                </button>
              )}
            </div>
          </div>

          {/* Middle: Dialogue Body Text (13-14px) */}
          <div
            className="flex-1 py-1.5 overflow-y-auto flex flex-col justify-center text-stone-100 text-xs sm:text-sm font-pixelated"
            style={{
              lineHeight: '1.45'
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
                    className="px-2.5 py-1 rounded text-xs bg-stone-900 hover:bg-stone-800 border border-amber-800/60 hover:border-amber-600 text-amber-200 transition flex items-center gap-1.5"
                  >
                    <span className="text-amber-400 font-bold font-pixel text-[9px]">[{oIdx + 1}]</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom: Continuation prompt in warm amber/green */}
          <div className="border-t border-stone-800 pt-1.5 flex items-center justify-between text-[10px]">
            <span
              className="text-amber-300/90 flex items-center gap-1.5"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 opacity-80" />
              {!isTypingComplete ? '[Click / SPACE to skip]' : '[SPACE or E to continue]'}
            </span>
            <span className="text-stone-500 hidden sm:inline text-[9px]">
              Click anywhere to advance
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
