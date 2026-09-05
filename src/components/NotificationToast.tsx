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
      border: 'border-emerald-500/80',
      bg: 'bg-emerald-950/90',
      text: 'text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      bar: 'bg-emerald-400',
      glow: '0 0 20px rgba(16, 185, 129, 0.3)'
    },
    error: {
      border: 'border-rose-500/90',
      bg: 'bg-rose-950/95',
      text: 'text-rose-100',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      bar: 'bg-rose-500',
      glow: '0 0 25px rgba(244, 63, 94, 0.4)'
    },
    info: {
      border: 'border-cyan-500/80',
      bg: 'bg-cyan-950/90',
      text: 'text-cyan-100',
      icon: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
      bar: 'bg-cyan-400',
      glow: '0 0 20px rgba(6, 182, 212, 0.3)'
    }
  }[notification.type];

  return (
    <div
      id={`notification-toast-${notification.id}`}
      className={`pointer-events-auto relative overflow-hidden rounded-lg border-2 ${config.border} ${config.bg} p-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-2 fade-in`}
      style={{ boxShadow: config.glow }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5">{config.icon}</div>
          <div className="space-y-1 pr-2">
            <p className={`text-xs font-mono font-medium leading-tight ${config.text}`}>
              {notification.message}
            </p>
            {notification.suggestion && (
              <p className="text-[11px] font-mono text-stone-300/90 bg-stone-900/60 p-1.5 rounded border border-stone-800">
                <span className="text-amber-400 font-bold">Tip: </span>
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
                <RefreshCw className="w-3 h-3" />
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
