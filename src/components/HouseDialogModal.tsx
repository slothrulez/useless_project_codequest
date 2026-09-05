import React, { useState } from 'react';
import { X, Home, FileCode, FileText, Package, EyeOff, BookOpen, Cloud, Sparkles, Check, Play } from 'lucide-react';
import { GameLocation } from '../types';
import { soundFx } from '../utils/audio';

interface HouseDialogModalProps {
  location: GameLocation;
  onClose: () => void;
  onTriggerEvent?: (type: string) => void;
}

export const HouseDialogModal: React.FC<HouseDialogModalProps> = ({
  location,
  onClose,
  onTriggerEvent
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

  const handleAction = () => {
    soundFx.playInteract();
    switch (location.id) {
      case 'house_green':
        setActionMessage('Compiled src/ files! All components are syntactically sound and ready for production.');
        break;
      case 'house_red':
        setActionMessage('README.md previewed! Added badge: [build: passing] [git: master]');
        break;
      case 'house_brown':
        setActionMessage('npm test executed! 14 test suites passed (0 failures).');
        break;
      case 'house_dark':
        setActionMessage('.gitignore scanned: 1,420 node_modules and .env files safely shielded!');
        break;
      case 'docs':
        setActionMessage('Docs consulted! Absorbed +30 Knowledge XP on git rebase workflows.');
        break;
      case 'remote_origin':
        setActionMessage('Origin pinged! Latency: 24ms. Upstream sync in harmonious agreement.');
        break;
      default:
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
        className="relative w-full max-w-md bg-stone-900 border-4 border-stone-700 rounded-xl shadow-2xl p-5 text-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderTopColor: location.roofColor || '#d97706',
          boxShadow: `0 0 35px ${location.roofColor ? location.roofColor + '33' : 'rgba(217, 119, 6, 0.2)'}`
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
              <p className="text-[10px] font-retro text-stone-400">{location.subtitle || 'Village Dwelling'}</p>
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

        {/* Dialogue Body */}
        <div className="bg-stone-950/90 border border-stone-800 rounded p-4 mb-4">
          <div className="text-[9px] font-pixel text-amber-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            <span>FILE RESIDENT:</span>
          </div>

          <div className="space-y-2">
            {location.dialogue.map((line, idx) => (
              <p key={idx} className="text-xs font-retro text-stone-300 leading-relaxed">
                &ldquo;{line}&rdquo;
              </p>
            ))}
          </div>

          {location.promptQuote && (
            <div className="mt-3 pt-2 border-t border-stone-800/80 text-[11px] font-mono text-amber-300/80 italic">
              {location.promptQuote}
            </div>
          )}
        </div>

        {/* Action result banner */}
        {actionMessage && (
          <div className="mb-4 p-2.5 bg-emerald-950/60 border border-emerald-600/70 rounded text-xs font-mono text-emerald-300 flex items-start gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Interactive action button */}
        <div className="flex gap-2">
          <button
            onClick={handleAction}
            className="flex-1 py-2 px-3 rounded font-pixel text-[9px] transition flex items-center justify-center gap-1.5 shadow"
            style={{
              backgroundColor: location.roofColor || '#d97706',
              color: '#0c0a09'
            }}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Inspect {location.fileRepresentation || 'Facility'}</span>
          </button>

          <button
            onClick={() => {
              soundFx.playButton();
              onClose();
            }}
            className="py-2 px-4 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-pixel text-[9px] border border-stone-700 transition"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};
