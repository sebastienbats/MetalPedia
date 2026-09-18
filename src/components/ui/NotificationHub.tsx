'use client';

import { useNotificationStore, RARITY_CONFIG } from '@/stores/notificationStore';

export default function NotificationHub() {
  const notifications = useNotificationStore((s) => s.notifications);
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9998] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {notifications.map((notif, index) => {
        const config = RARITY_CONFIG[notif.rarity];
        
        return (
          <div
            key={notif.id}
            className="notification-toast pointer-events-auto"
            style={{
              '--notif-color': config.color,
              '--notif-glow': config.glow,
              animationDelay: `${index * 50}ms`,
            } as React.CSSProperties}
            onClick={() => removeNotification(notif.id)}
            role="status"
          >
            {/* Bande de rareté */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
              style={{ backgroundColor: config.color }}
            />

            <div className="flex items-start gap-3 pl-3">
              {/* Icône */}
              <div
                className="text-3xl shrink-0 notification-icon"
                style={{ filter: `drop-shadow(0 0 8px ${config.glow})` }}
              >
                {notif.icon}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${config.color}20`,
                      color: config.color,
                      border: `1px solid ${config.color}40`,
                    }}
                  >
                    {config.medal} {config.label}
                  </span>
                  {notif.xpGained && (
                    <span className="text-xs font-bold text-yellow-400">
                      +{notif.xpGained} XP
                    </span>
                  )}
                </div>
                <h4 className="font-metal text-sm text-white leading-tight">
                  {notif.title}
                </h4>
                {notif.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                    {notif.description}
                  </p>
                )}
              </div>

              {/* Fermer */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notif.id);
                }}
                className="text-gray-500 hover:text-white transition-colors text-sm shrink-0"
                aria-label="Fermer la notification"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
