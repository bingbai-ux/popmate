import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PopMate ブランドカラー（ガイドライン準拠）
        primary: {
          DEFAULT: '#2563EB',
          light: '#3B82F6',
          dark: '#1E40AF',
        },
        background: {
          dark: '#0A1628',
          light: '#FFFFFF',
          muted: '#EFF6FF',
        },
        border: {
          DEFAULT: '#E5E7EB',
          primary: '#2563EB',
          dark: '#0A1628',
        },
        text: {
          dark: '#0A1628',
          light: '#FFFFFF',
          muted: '#6B7280',
        },
        disabled: '#BDBDBD',
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #2563EB, #1E40AF)',
        'gradient-header': 'linear-gradient(to right, #2563EB, #1D4ED8)',
        'gradient-card': 'linear-gradient(to bottom, #3B82F6, #2563EB)',
      },
    },
  },
  plugins: [],
};

export default config;
