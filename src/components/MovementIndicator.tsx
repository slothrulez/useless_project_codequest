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
      className={`fixed bottom-4 right-4 z-30 pointer-events-none select-none transition-opacity duration-200 font-pixelated ${
        isMoving ? 'opacity-90' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        backgroundColor: 'rgba(20, 18, 16, 0.85)',
        borderRadius: '6px',
        padding: '6px 8px',
        border: '1px solid rgba(180, 83, 9, 0.4)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div className="flex flex-col items-center gap-1 font-pixel text-[9px]">
        {/* UP Key */}
        <div
          className={`w-6 h-6 rounded flex items-center justify-center font-bold border transition-colors ${
            activeKeys.up
              ? 'bg-amber-800/80 border-amber-500 text-amber-100'
              : 'bg-stone-900/80 border-stone-700 text-stone-500'
          }`}
        >
          ▲
        </div>

        {/* LEFT / DOWN / RIGHT Keys */}
        <div className="flex items-center gap-1">
          <div
            className={`w-6 h-6 rounded flex items-center justify-center font-bold border transition-colors ${
              activeKeys.left
                ? 'bg-amber-800/80 border-amber-500 text-amber-100'
                : 'bg-stone-900/80 border-stone-700 text-stone-500'
            }`}
          >
            ◀
          </div>
          <div
            className={`w-6 h-6 rounded flex items-center justify-center font-bold border transition-colors ${
              activeKeys.down
                ? 'bg-amber-800/80 border-amber-500 text-amber-100'
                : 'bg-stone-900/80 border-stone-700 text-stone-500'
            }`}
          >
            ▼
          </div>
          <div
            className={`w-6 h-6 rounded flex items-center justify-center font-bold border transition-colors ${
              activeKeys.right
                ? 'bg-amber-800/80 border-amber-500 text-amber-100'
                : 'bg-stone-900/80 border-stone-700 text-stone-500'
            }`}
          >
            ▶
          </div>
        </div>
      </div>
    </div>
  );
};
