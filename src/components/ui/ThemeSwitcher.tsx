'use client';

import { useUIStore, Theme } from '@/stores/uiStore';

const THEMES: { id: Theme; icon: string; name: string }[] = [
  { id: 'forge', icon: '⚒️', name: 'Forge' },
  { id: 'cathedral', icon: '🏰', name: 'Cathédrale' },
  { id: 'hellfire', icon: '🔥', name: 'Hellfire' },
  { id: 'frost', icon: '❄️', name: 'Frost' },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useUIStore();

  return (
    <div className="flex gap-1 bg-metal-dark border border-metal-gray rounded-full p-1">
      {THEMES.map((th) => (
        <button
          key={th.id}
          onClick={() => setTheme(th.id)}
          title={th.name}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            theme === th.id ? 'bg-metal-gray scale-110 shadow-lg' : 'hover:bg-metal-gray/50'
          }`}
        >
          <span className="text-lg">{th.icon}</span>
        </button>
      ))}
    </div>
  );
}
