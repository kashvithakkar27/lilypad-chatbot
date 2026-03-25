/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Exact Lilypad dark-mode surface hierarchy */
        surface: {
          primary: '#1a1a1a',
          secondary: '#272727',
          tertiary: '#363636',
          quaternary: '#484848',
        },

        /* On-surface (text) */
        onSurface: {
          primary: '#fafafa',
          secondary: '#f6f6f6',
          tertiary: '#b8b8b8',
          quaternary: '#969696',
        },

        /* Accent — Lilypad cyan */
        highlight: '#00ffff',
        'highlight-2': '#b0ffff',
        shadow: '#006b6b',

        /* Nav */
        nav: {
          bar: '#141414',
          outline: '#484848',
        },

        /* Outline */
        outline: '#484848',

        /* Button tokens */
        btn: {
          fill: '#272727',
          element: '#fafafa',
          outline: '#00ffff',
          hoverFill: '#b0ffff',
          hoverElement: '#1a1a1a',
          activeFill: '#00ffff',
          activeElement: '#1a1a1a',
          disableFill: '#484848',
          disableElement: '#969696',
        },
      },

      fontFamily: {
        raleway: ['Raleway', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },

      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },

      boxShadow: {
        'custom-hover': '0px 4px 24px 2px rgba(0, 107, 107, 0.3)',
        'inset-custom': 'inset 0px 0px 4px 0px #00000066',
        'glow-sm': '0 0 12px rgba(0, 255, 255, 0.15)',
        'glow-md': '0 0 24px rgba(0, 255, 255, 0.10)',
        'float': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
