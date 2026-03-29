/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        success: '#22c55e',
        warning: '#fbbf24',
        error: '#ef4444',
      },
      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [],
};
