import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, RefreshCw } from 'lucide-react';
import { GameNotification } from '../types';

interface NotificationToastProps {
  notifications: GameNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) return null;

  return (
    <div
      id="game-notifications-container"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none"
    >
      {notifications.map((n) => (
        <ToastItem key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ notification: GameNotification; onDismiss: (id: string) => void }> = ({
  notification,
  onDismiss
}) => {
  const [progress, setProgress] = useState(100);
  const duration = notification.duration || 4500;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(notification.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [notification.id, duration, onDismiss]);

  const config = {
    success: {
      border: 'border-emerald-800/80',
      bg: 'bg-stone-900/95',
      text: 'text-emerald-200',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
      bar: 'bg-emerald-600',
      glow: '0 4px 15px rgba(0, 0, 0, 0.6)'
    },
    error: {
      border: 'border-rose-800/80',
      bg: 'bg-stone-900/95',
      text: 'text-rose-200',
      icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
      bar: 'bg-rose-700',
      glow: '0 4px 15px rgba(0, 0, 0, 0.6)'
    },
    info: {
      border: 'border-stone-700',
      bg: 'bg-stone-900/95',
      text: 'text-stone-200',
      icon: <Info className="w-4 h-4 text-amber-400 shrink-0" />,
      bar: 'bg-amber-600',
      glow: '0 4px 15px rgba(0, 0, 0, 0.6)'
    }
  }[notification.type];

  return (
    <div
      id={`notification-toast-${notification.id}`}
      className={`pointer-events-auto relative overflow-hidden rounded-lg border-2 ${config.border} ${config.bg} p-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 font-pixelated animate-in slide-in-from-top-2 fade-in`}
      style={{ boxShadow: config.glow }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5">{config.icon}</div>
          <div className="space-y-1 pr-2">
            <p className={`text-xs font-pixelated font-medium leading-tight ${config.text}`}>
              {notification.message}
            </p>
            {notification.suggestion && (
              <p className="text-[10.5px] font-pixelated text-stone-300/90 bg-stone-950/80 p-1.5 rounded border border-stone-800">
                <span className="text-amber-400 font-bold font-pixel text-[9px]">Tip: </span>
                {notification.suggestion}
              </p>
            )}
            {notification.retryAction && (
              <button
                onClick={() => {
                  notification.retryAction?.();
                  onDismiss(notification.id);
                }}
                className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-100 text-[10px] font-pixel rounded border border-stone-600 transition"
              >
                <RefreshCw className="w-3 h-3 text-stone-300" />
                Retry
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-stone-400 hover:text-stone-100 p-0.5 rounded transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress countdown bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/40">
        <div
          className={`h-full ${config.bar} transition-all duration-75`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
