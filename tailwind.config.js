/** @type {import('tailwindcss').Config} */

// ═══════════════════════════════════════════
// PLUGINS CUSTOM
// ═══════════════════════════════════════════
const plugin = require('tailwindcss/plugin');

// Plugin: Composants Metal (metal-card, metal-button, metal-input)
const metalComponents = plugin(function ({ addComponents, theme }) {
  addComponents({
    // ─────────────────────────────────────────
    // METAL CARD
    // ─────────────────────────────────────────
    '.metal-card': {
      backgroundColor: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border)',
      borderRadius: theme('borderRadius.lg'),
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: 'var(--color-accent)',
        boxShadow: '0 0 20px color-mix(in srgb, var(--color-accent) 40%, transparent)',
        transform: 'translateY(-2px)',
      },
    },

    // ─────────────────────────────────────────
    // METAL BUTTON
    // ─────────────────────────────────────────
    '.metal-button': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme('spacing.2'),
      padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
      color: theme('colors.white'),
      fontWeight: theme('fontWeight.semibold'),
      borderRadius: theme('borderRadius.md'),
      background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-hover))',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      '&:hover': {
        boxShadow: '0 4px 15px color-mix(in srgb, var(--color-accent) 50%, transparent)',
        transform: 'translateY(-1px)',
      },
      '&:active': {
        transform: 'scale(0.95)',
      },
      '&:disabled': {
        opacity: '0.5',
        cursor: 'not-allowed',
        transform: 'none',
      },
    },

    // ─────────────────────────────────────────
    // METAL INPUT
    // ─────────────────────────────────────────
    '.metal-input': {
      width: '100%',
      padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
      backgroundColor: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border)',
      borderRadius: theme('borderRadius.md'),
      color: theme('colors.gray.100'),
      transition: 'all 0.2s ease',
      '&::placeholder': {
        color: theme('colors.gray.500'),
      },
      '&:focus': {
        outline: 'none',
        borderColor: 'var(--color-accent)',
        boxShadow: '0 0 0 2px color-mix(in srgb, var(--color-accent) 30%, transparent)',
      },
    },

    // ─────────────────────────────────────────
    // METAL BADGE (gamification)
    // ─────────────────────────────────────────
    '.metal-badge': {
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme('spacing.1'),
      padding: `${theme('spacing.0.5')} ${theme('spacing.2')}`,
      borderRadius: theme('borderRadius.full'),
      fontSize: theme('fontSize.xs'),
      fontWeight: theme('fontWeight.semibold'),
    },

    // ─────────────────────────────────────────
    // METAL PROGRESS BAR
    // ─────────────────────────────────────────
    '.metal-progress': {
      width: '100%',
      height: theme('spacing.3'),
      backgroundColor: 'var(--color-border)',
      borderRadius: theme('borderRadius.full'),
      overflow: 'hidden',
    },

    '.metal-progress-bar': {
      height: '100%',
      background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))',
      transition: 'width 0.5s ease',
      borderRadius: theme('borderRadius.full'),
    },
  });
});

// Plugin: Utilitaires de rareté (gamification)
const rarityPlugin = plugin(function ({ addUtilities }) {
  addUtilities({
    '.rarity-common': {
      '--rarity-color': '#6b7280',
      color: 'var(--rarity-color)',
      borderColor: 'var(--rarity-color)',
    },
    '.rarity-rare': {
      '--rarity-color': '#3b82f6',
      color: 'var(--rarity-color)',
      borderColor: 'var(--rarity-color)',
    },
    '.rarity-epic': {
      '--rarity-color': '#a855f7',
      color: 'var(--rarity-color)',
      borderColor: 'var(--rarity-color)',
    },
    '.rarity-legendary': {
      '--rarity-color': '#f59e0b',
      color: 'var(--rarity-color)',
      borderColor: 'var(--rarity-color)',
    },
    '.glow-rarity': {
      boxShadow: '0 0 15px color-mix(in srgb, var(--rarity-color) 50%, transparent)',
    },
  });
});

// Plugin: Effets visuels metal
const metalEffects = plugin(function ({ addUtilities }) {
  addUtilities({
    '.text-glow-blood': {
      textShadow: '0 0 10px rgba(139, 0, 0, 0.8), 0 0 20px rgba(214, 48, 49, 0.4)',
    },
    '.text-glow-fire': {
      textShadow: '0 0 10px rgba(214, 48, 49, 0.8), 0 0 20px rgba(179, 57, 57, 0.4)',
    },
    '.bg-metal-gradient': {
      backgroundImage: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
    },
    '.bg-blood-gradient': {
      backgroundImage: 'linear-gradient(135deg, #8b0000 0%, #d63031 100%)',
    },
    '.bg-radial-glow': {
      backgroundImage: 'radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--color-primary) 20%, transparent) 0%, transparent 70%)',
    },
    '.backdrop-metal': {
      backdropFilter: 'blur(12px)',
      backgroundColor: 'color-mix(in srgb, var(--color-bg) 85%, transparent)',
    },
  });
});

// ═══════════════════════════════════════════
// CONFIGURATION PRINCIPALE
// ═══════════════════════════════════════════
module.exports = {
  // ─────────────────────────────────────────
  // FICHIERS SCANNÉS
  // ─────────────────────────────────────────
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // ─────────────────────────────────────────
  // MODE SOMBRE (géré par data-theme)
  // ─────────────────────────────────────────
  darkMode: ['selector', '[data-theme="dark"]'],

  theme: {
    extend: {
      // ═══════════════════════════════════════
      // COULEURS
      // ═══════════════════════════════════════
      colors: {
        // Palette metal statique
        metal: {
          black: '#0a0a0a',
          dark: '#1a1a1a',
          gray: '#2a2a2a',
          blood: '#8b0000',
          fire: '#b33939',
          rust: '#d63031',
          gold: '#c9a227',
          bone: '#e7e5e4',
          ash: '#78716c',
        },

        // Variables dynamiques (thèmes multiples)
        theme: {
          bg: 'var(--color-bg)',
          'bg-secondary': 'var(--color-bg-secondary)',
          text: 'var(--color-text)',
          border: 'var(--color-border)',
          primary: 'var(--color-primary)',
          'primary-hover': 'var(--color-primary-hover)',
          accent: 'var(--color-accent)',
        },

        // Raretés gamification
        rarity: {
          common: '#6b7280',
          rare: '#3b82f6',
          epic: '#a855f7',
          legendary: '#f59e0b',
        },

        // Difficultés de quêtes
        difficulty: {
          novice: '#22c55e',
          apprentice: '#3b82f6',
          master: '#a855f7',
          legendary: '#f59e0b',
        },
      },

      // ═══════════════════════════════════════
      // POLICES (via next/font)
      // ═══════════════════════════════════════
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-cinzel)', 'Georgia', 'serif'],
        metal: ['var(--font-metal-mania)', 'cursive'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },

      // ═══════════════════════════════════════
      // ANIMATIONS
      // ═══════════════════════════════════════
      animation: {
        'flame': 'flame 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shake': 'shake 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'spin-slow': 'spin 10s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'level-up': 'levelUp 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'xp-gain': 'xpGain 0.4s ease-out',
      },

      keyframes: {
        flame: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(214, 48, 49, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(214, 48, 49, 0.8), 0 0 40px rgba(139, 0, 0, 0.4)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        levelUp: {
          '0%': { opacity: '0', transform: 'scale(0.5) rotate(-10deg)' },
          '50%': { transform: 'scale(1.1) rotate(5deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0)' },
        },
        xpGain: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-30px) scale(1.2)', opacity: '0' },
        },
      },

      // ═══════════════════════════════════════
      // OMBRES
      // ═══════════════════════════════════════
      boxShadow: {
        'metal-sm': '0 1px 3px rgba(0, 0, 0, 0.5)',
        'metal-md': '0 4px 10px rgba(0, 0, 0, 0.5)',
        'metal-lg': '0 10px 25px rgba(0, 0, 0, 0.6)',
        'metal-xl': '0 20px 50px rgba(0, 0, 0, 0.7)',
        'glow-blood': '0 0 20px rgba(139, 0, 0, 0.5)',
        'glow-fire': '0 0 20px rgba(214, 48, 49, 0.5)',
        'glow-legendary': '0 0 30px rgba(245, 158, 11, 0.6), 0 0 60px rgba(245, 158, 11, 0.3)',
        'glow-epic': '0 0 25px rgba(168, 85, 247, 0.6), 0 0 50px rgba(168, 85, 247, 0.3)',
        'glow-rare': '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.25)',
        'glow-accent': '0 0 15px color-mix(in srgb, var(--color-accent) 50%, transparent)',
      },

      // ═══════════════════════════════════════
      // IMAGES DE FOND
      // ═══════════════════════════════════════
      backgroundImage: {
        'metal-texture': "url('/textures/metal.jpg')",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-metal': 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)',
        'hero-blood': 'linear-gradient(180deg, rgba(139, 0, 0, 0.2) 0%, transparent 100%)',
      },

      // ═══════════════════════════════════════
      // SPACING (pour XPBar fixe)
      // ═══════════════════════════════════════
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '28': '7rem',
        'xp-bar': '80px',
        'header': '80px',
      },

      // ═══════════════════════════════════════
      // Z-INDEX (superposition des modals)
      // ═══════════════════════════════════════
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        'command-palette': '100',
        'modal': '150',
        'offline-indicator': '50',
        'xp-bar': '40',
        'level-up': '200',
        'tooltip': '1000',
      },

      // ═══════════════════════════════════════
      // BREAKPOINTS RESPONSIVE
      // ═══════════════════════════════════════
      screens: {
        'xs': '475px',
        '3xl': '1792px',
      },

      // ═══════════════════════════════════════
      // BORDER RADIUS
      // ═══════════════════════════════════════
      borderRadius: {
        '4xl': '2rem',
        'metal': '0.375rem',
      },

      // ═══════════════════════════════════════
      // MAX WIDTH
      // ═══════════════════════════════════════
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },

      // ═══════════════════════════════════════
      // OPACITY
      // ═══════════════════════════════════════
      opacity: {
        '85': '0.85',
        '95': '0.95',
      },

      // ═══════════════════════════════════════
      // BACKDROP FILTER
      // ═══════════════════════════════════════
      backdropBlur: {
        xs: '2px',
      },

      // ═══════════════════════════════════════
      // TRANSITIONS
      // ═══════════════════════════════════════
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
      },

      // ═══════════════════════════════════════
      // CONTAINERS
      // ═══════════════════════════════════════
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
          xl: '2.5rem',
        },
      },
    },
  },

  // ─────────────────────────────────────────
  // SAFELIST (classes dynamiques)
  // ─────────────────────────────────────────
  safelist: [
    // Raretés des badges (gamification)
    'rarity-common', 'rarity-rare', 'rarity-epic', 'rarity-legendary',
    'glow-rarity',
    // Couleurs dynamiques des rangs
    { pattern: /^text-(gray|red|blue|purple|amber|white)/ },
    { pattern: /^bg-(gray|red|blue|purple|amber|white)-\d+/ },
    { pattern: /^border-(gray|red|blue|purple|amber|white)-\d+/ },
    // Animations
    'animate-flame', 'animate-pulse-slow', 'animate-glow',
    'animate-shake', 'animate-slide-up', 'animate-slide-down',
    'animate-fade-in', 'animate-spin-slow', 'animate-bounce-subtle',
    'animate-level-up', 'animate-xp-gain',
  ],

  // ─────────────────────────────────────────
  // PLUGINS
  // ─────────────────────────────────────────
  plugins: [
    // Plugins officiels Tailwind
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),

    // Plugins custom MetalPedia
    metalComponents,
    rarityPlugin,
    metalEffects,
  ],

  // ─────────────────────────────────────────
  // CORE PLUGINS (optimisations)
  // ─────────────────────────────────────────
  corePlugins: {
    // Désactiver si non utilisé (performance)
    preflight: true,
  },

  // ─────────────────────────────────────────
  // IMPORTANT (pour override Tailwind dans les composants)
  // ─────────────────────────────────────────
  important: false,

  // ─────────────────────────────────────────
  // SEPARATORS CUSTOM
  // ─────────────────────────────────────────
  separator: ':',

  // ─────────────────────────────────────────
  // FUTURE (compatibilité Tailwind v4)
  // ─────────────────────────────────────────
  future: {
    hoverOnlyWhenSupported: true,
  },
};
