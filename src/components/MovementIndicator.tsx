import React from 'react';
import { Direction } from '../types';

interface MovementIndicatorProps {
  isMoving: boolean;
  activeDirection: Direction | null;
  activeKeys: { up: boolean; down: boolean; left: boolean; right: boolean };
}

export const MovementIndicator: React.FC<MovementIndicatorProps> = ({
  isMoving,
  activeKeys
}) => {
  return (
    <div
      id="movement-indicator-panel"
      className={`fixed bottom-4 right-4 z-30 pointer-events-none select-none transition-opacity duration-200 ${
        isMoving ? 'opacity-90' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        borderRadius: '6px',
        padding: '6px 8px',
        border: '1px solid rgba(77, 208, 225, 0.3)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div className="flex flex-col items-center gap-1">
        {/* UP Key */}
        <div
          className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] font-bold border transition-colors ${
            activeKeys.up
              ? 'bg-cyan-500/40 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(77,208,225,0.7)]'
              : 'bg-stone-900/80 border-stone-700 text-stone-400'
          }`}
        >
          ▲
        </div>

        {/* LEFT / DOWN / RIGHT Keys */}
        <div className="flex items-center gap-1">
          <div
            className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] font-bold border transition-colors ${
              activeKeys.left
                ? 'bg-cyan-500/40 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(77,208,225,0.7)]'
                : 'bg-stone-900/80 border-stone-700 text-stone-400'
            }`}
          >
            ◀
          </div>
          <div
            className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] font-bold border transition-colors ${
              activeKeys.down
                ? 'bg-cyan-500/40 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(77,208,225,0.7)]'
                : 'bg-stone-900/80 border-stone-700 text-stone-400'
            }`}
          >
            ▼
          </div>
          <div
            className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] font-bold border transition-colors ${
              activeKeys.right
                ? 'bg-cyan-500/40 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(77,208,225,0.7)]'
                : 'bg-stone-900/80 border-stone-700 text-stone-400'
            }`}
          >
            ▶
          </div>
        </div>
      </div>
    </div>
  );
};
