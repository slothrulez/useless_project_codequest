import React from 'react';
import { X, Compass, MapPin, Navigation } from 'lucide-react';
import { LOCATIONS } from '../data/mapData';
import { GameLocation } from '../types';
import { soundFx } from '../utils/audio';

interface ExploreModalProps {
  onClose: () => void;
  onTeleport: (loc: GameLocation) => void;
}

export const ExploreModal: React.FC<ExploreModalProps> = ({ onClose, onTeleport }) => {
  return (
    <div
      id="explore-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        id="explore-modal-box"
        className="relative w-full max-w-xl bg-stone-900 border-4 border-amber-800/90 rounded-xl shadow-2xl p-4 sm:p-6 text-stone-200 overflow-hidden font-pixelated"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(0,0,0,0.8)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stone-950 border border-amber-700/80 flex items-center justify-center text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-pixel text-amber-300">EXPLORE CODEQUEST REALM</h2>
              <p className="text-[10px] font-pixelated text-stone-400">Points of Interest & Fast Travel Waypoints</p>
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

        {/* POI List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          <p className="text-xs font-pixelated text-stone-400 mb-2">
            Select a landmark to fast-travel your Gorillaz character directly to it:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {LOCATIONS.map((loc) => (
              <div
                key={loc.id}
                className="p-3 bg-stone-950/80 hover:bg-stone-800/80 border border-stone-800 hover:border-amber-700/80 rounded-lg transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-pixel text-[9px] text-amber-300 truncate max-w-[170px]">{loc.name}</span>
                    <MapPin className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400 transition" />
                  </div>
                  <p className="text-[10px] font-pixelated text-stone-400 mt-1 line-clamp-2">{loc.subtitle || loc.promptQuote}</p>
                </div>

                <button
                  onClick={() => {
                    soundFx.playInteract();
                    onTeleport(loc);
                    onClose();
                  }}
                  className="mt-2 w-full py-1.5 px-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-200 font-pixel text-[8px] rounded border border-stone-700 transition flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3 h-3 text-amber-400" />
                  <span>Fast Travel</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
