import React, { useState, useEffect } from 'react';

interface EnteringTransitionProps {
  onComplete: () => void;
  username?: string;
  repoName?: string;
}

export const EnteringTransition: React.FC<EnteringTransitionProps> = ({
  onComplete,
  username,
  repoName
}) => {
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    // Step 1: Connecting to your realm... (0ms)
    const t1 = setTimeout(() => setStep(1), 300);
    // Step 2: Reading your repository... (1100ms)
    const t2 = setTimeout(() => setStep(2), 1200);
    // Step 3: Building your world... (2100ms)
    const t3 = setTimeout(() => setStep(3), 2100);
    // Transition finish (3000ms)
    const t4 = setTimeout(() => {
      onComplete();
    }, 3100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div
      id="codequest-transition"
      className="fixed inset-0 z-50 bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 select-none font-mono"
    >
      {/* Outer RPG Frame */}
      <div className="w-full max-w-lg border-2 border-amber-800/80 bg-stone-900/90 p-8 shadow-[0_0_40px_rgba(0,0,0,0.9)] flex flex-col items-center text-center gap-6">
        {/* Header */}
        <div className="text-amber-400 font-['Press_Start_2P'] text-sm sm:text-base tracking-wider drop-shadow">
          ⚔️ ENTERING CODEQUEST ⚔️
        </div>

        {username && (
          <div className="text-[11px] text-amber-200/80 font-mono tracking-wider">
            HERO: <span className="text-amber-400 font-bold uppercase">{username}</span>
            {repoName && (
              <span className="text-stone-400 ml-2">
                | REALM: <span className="text-stone-200 font-bold">{repoName}</span>
              </span>
            )}
          </div>
        )}

        {/* Steps */}
        <div className="flex flex-col gap-3.5 w-full text-left font-['Press_Start_2P'] text-[10px] sm:text-xs pt-2">
          {/* Step 1 */}
          <div
            className={`transition-all duration-300 flex items-center gap-3 ${
              step >= 1 ? 'opacity-100 text-amber-300 translate-x-0' : 'opacity-20 text-stone-600 -translate-x-2'
            }`}
          >
            <span>{step >= 1 ? '⚔' : '·'}</span>
            <span>&quot;Connecting to your realm...&quot;</span>
          </div>

          {/* Step 2 */}
          <div
            className={`transition-all duration-300 flex items-center gap-3 ${
              step >= 2 ? 'opacity-100 text-amber-300 translate-x-0' : 'opacity-20 text-stone-600 -translate-x-2'
            }`}
          >
            <span>{step >= 2 ? '⚔' : '·'}</span>
            <span>&quot;Reading your repository...&quot;</span>
          </div>

          {/* Step 3 */}
          <div
            className={`transition-all duration-300 flex items-center gap-3 ${
              step >= 3 ? 'opacity-100 text-emerald-400 translate-x-0 font-bold' : 'opacity-20 text-stone-600 -translate-x-2'
            }`}
          >
            <span>{step >= 3 ? '✓' : '·'}</span>
            <span>&quot;Building your world...&quot;</span>
          </div>
        </div>

        {/* Loading Pixel Bar */}
        <div className="w-full bg-stone-950 border border-stone-800 h-3 mt-2 overflow-hidden p-0.5">
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{
              width: step === 0 ? '5%' : step === 1 ? '35%' : step === 2 ? '70%' : '100%'
            }}
          />
        </div>
      </div>
    </div>
  );
};
