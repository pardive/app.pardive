import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        lightBase: '#FFFFFF',
        darkBase: '#00332D',
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },

        // (kept for backward compatibility)
        hover: '#24A77B',

        textLight: '#1A1A1A',
        textDark: '#00332D',
        warning: '#F4A259',
        deepGreen: '#14532D',
        midGreen: '#3CB371',
        softGreen: '#8ACB8A',
        lightMint: '#CBDDD1',
        ghostWhite: '#F8FFFA',

        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },

        // ✅ Centralized UI palette (kept)
        ui: {
          navigationLight: '#ffffff',
          navigationDark: '#272727',
          activeLight: '#ffffff',
          activeDark: '#333333',
          pageLight: '#ffffff',
          pageDark: '#303030',
          appBgLight: '#f3f4f6',
          appBgDark: '#4A4A4A',
          borderLight: '#ffffff',
          borderDark: '#374151',
          textLight: '#ffffff',
          textDark: '#f3f4f6',

          // Existing hover surfaces
          hoverBG: 'var(--hover-bg)',
          hoverBGDark: 'var(--hover-bg-dark)',

          // 🔹 Button design tokens (read from CSS variables)
          buttonPrimaryBg: 'var(--btn-primary-bg)',
          buttonPrimaryHover: 'var(--btn-primary-hover)',
          buttonPrimaryBorder: 'var(--btn-primary-border)',
          buttonPrimaryText: 'var(--btn-primary-text)',

          buttonSecondaryBg: 'var(--btn-secondary-bg)',
          buttonSecondaryHover: 'var(--btn-secondary-hover)',
          buttonSecondaryBorder: 'var(--btn-secondary-border)',
          buttonSecondaryText: 'var(--btn-secondary-text)',

          // Dark-mode mirrors (values flip via .dark vars)
          darkButtonPrimaryBg: 'var(--btn-primary-bg)',
          darkButtonPrimaryHover: 'var(--btn-primary-hover)',
          darkButtonPrimaryBorder: 'var(--btn-primary-border)',
          darkButtonPrimaryText: 'var(--btn-primary-text)',

          darkButtonSecondaryBg: 'var(--btn-secondary-bg)',
          darkButtonSecondaryHover: 'var(--btn-secondary-hover)',
          darkButtonSecondaryBorder: 'var(--btn-secondary-border)',
          darkButtonSecondaryText: 'var(--btn-secondary-text)',
        },
      },
      fontFamily: {
        sans: ['Ubuntu', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: 'var(--radius)',
        xl: '1.5rem',
        '2xl': '2rem',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      borderWidth: {
        pt1: '1pt',
        pt2: '2pt',
      },

      /* 🔥 Animations */
      keyframes: {
        // Help
        helpTwist: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '40%': { transform: 'rotate(14deg) scale(1.06)' },
          '65%': { transform: 'rotate(-10deg) scale(1.03)' },
          '100%': { transform: 'rotate(0deg) scale(1)' },
        },
        helpSwivelPop: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '28%': { transform: 'rotate(16deg) scale(1.08)' },
          '55%': { transform: 'rotate(-10deg) scale(1.03)' },
          '78%': { transform: 'rotate(5deg) scale(1.02)' },
          '100%': { transform: 'rotate(0deg) scale(1)' },
        },
        haloPulse: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '25%': { transform: 'scale(1.05)', opacity: '0.6' },
          '60%': { transform: 'scale(1.15)', opacity: '0.35' },
          '100%': { transform: 'scale(1.0)', opacity: '0' },
        },

        // Bell
        bellSwing: {
          '0%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(15deg)' },
          '40%': { transform: 'rotate(-12deg)' },
          '60%': { transform: 'rotate(8deg)' },
          '80%': { transform: 'rotate(-4deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        dotWave: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        dotPop: {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '60%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },

        // Profile swivel
        profileSwivel: {
          '0%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(12deg)' },
          '50%': { transform: 'rotate(-8deg)' },
          '75%': { transform: 'rotate(4deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
      },
      animation: {
        // Help
        'help-twist': 'helpTwist 420ms ease-out',
        'help-swivel-pop': 'helpSwivelPop 420ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'halo-pulse': 'haloPulse 520ms ease-out',

        // Bell
        'bell-swing': 'bellSwing 700ms ease-in-out',
        'dot-wave': 'dotWave 900ms ease-in-out infinite',
        'dot-pop': 'dotPop 220ms ease-out',

        // Profile
        'profile-swivel': 'profileSwivel 500ms ease-in-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // ⬅️ added
    require('tailwindcss-animate'),
  ],
};

export default config;
