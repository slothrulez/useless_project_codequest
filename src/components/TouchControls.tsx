import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Hand } from 'lucide-react';
import { Direction } from '../types';

interface TouchControlsProps {
  onStartMove: (dir: Direction) => void;
  onStopMove: () => void;
  onInteract: () => void;
  canInteract: boolean;
  interactLabel?: string;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onStartMove,
  onStopMove,
  onInteract,
  canInteract,
  interactLabel
}) => {
  return (
    <div
      id="touch-controls-container"
      className="md:hidden fixed bottom-4 right-4 z-40 flex items-end gap-3 pointer-events-auto select-none"
    >
      {/* Interact Button */}
      {canInteract && (
        <button
          onClick={onInteract}
          className="w-14 h-14 rounded-full bg-stone-900 active:bg-stone-800 border-2 border-amber-600 text-amber-300 font-pixel text-[9px] flex flex-col items-center justify-center shadow-xl font-pixelated"
        >
          <Hand className="w-5 h-5 mb-0.5 text-amber-400" />
          <span>[E]</span>
        </button>
      )}

      {/* D-Pad */}
      <div className="relative w-32 h-32 bg-stone-950/90 border-2 border-stone-800 rounded-full backdrop-blur-md shadow-2xl p-1">
        {/* Up */}
        <button
          onTouchStart={() => onStartMove('up')}
          onTouchEnd={onStopMove}
          onMouseDown={() => onStartMove('up')}
          onMouseUp={onStopMove}
          className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-stone-900 active:bg-stone-800 rounded-t-lg border border-stone-700 flex items-center justify-center text-amber-400"
        >
          <ArrowUp className="w-5 h-5" />
        </button>

        {/* Down */}
        <button
          onTouchStart={() => onStartMove('down')}
          onTouchEnd={onStopMove}
          onMouseDown={() => onStartMove('down')}
          onMouseUp={onStopMove}
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-stone-900 active:bg-stone-800 rounded-b-lg border border-stone-700 flex items-center justify-center text-amber-400"
        >
          <ArrowDown className="w-5 h-5" />
        </button>

        {/* Left */}
        <button
          onTouchStart={() => onStartMove('left')}
          onTouchEnd={onStopMove}
          onMouseDown={() => onStartMove('left')}
          onMouseUp={onStopMove}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-stone-900 active:bg-stone-800 rounded-l-lg border border-stone-700 flex items-center justify-center text-amber-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Right */}
        <button
          onTouchStart={() => onStartMove('right')}
          onTouchEnd={onStopMove}
          onMouseDown={() => onStartMove('right')}
          onMouseUp={onStopMove}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-stone-900 active:bg-stone-800 rounded-r-lg border border-stone-700 flex items-center justify-center text-amber-400"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Center dot */}
        <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-stone-900 border border-stone-800 pointer-events-none" />
      </div>
    </div>
  );
};
