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
        // PopMate ブランドカラー
        primary: {
          DEFAULT: '#0066CC',
          light: '#3399FF',
          dark: '#004C99',
        },
        secondary: {
          DEFAULT: '#FF6600',
          light: '#FF8533',
          dark: '#CC5200',
        },
        background: '#F5F5F5',
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
