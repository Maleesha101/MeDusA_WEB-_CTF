import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        temple: {
          50: '#f4fff2',
          100: '#dfffd7',
          200: '#befab4',
          300: '#86ee78',
          400: '#48d851',
          500: '#21b93f',
          600: '#168d33',
          700: '#146f2d',
          800: '#145826',
          900: '#0f3d1d'
        }
      },
      boxShadow: {
        glow: '0 0 30px rgba(33, 185, 63, 0.35)'
      },
      backgroundImage: {
        'temple-grid': 'linear-gradient(rgba(33,185,63,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(33,185,63,0.08) 1px, transparent 1px)'
      },
      keyframes: {
        glide: {
          '0%, 100%': { transform: 'translateX(-4%) translateY(0)' },
          '50%': { transform: 'translateX(4%) translateY(-8px)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.95', transform: 'scale(1.03)' }
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-1px, 1px)' },
          '40%': { transform: 'translate(-1px, -1px)' },
          '60%': { transform: 'translate(1px, 1px)' },
          '80%': { transform: 'translate(1px, -1px)' },
          '100%': { transform: 'translate(0)' }
        }
      },
      animation: {
        glide: 'glide 10s ease-in-out infinite',
        pulseGlow: 'pulseGlow 4s ease-in-out infinite',
        glitch: 'glitch 1.6s steps(2, end) infinite'
      }
    }
  },
  plugins: []
};

export default config;
