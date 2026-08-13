/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          950: "#07090b",
          900: "#0b0e11",
          850: "#0f1317",
          800: "#13171c",
          700: "#1b2027",
          600: "#262c34",
          500: "#333b45",
        },
        mist: {
          400: "#5b6570",
          300: "#8d97a1",
          200: "#b7bfc7",
          100: "#dde1e5",
          50: "#e6e9ec",
        },
        brass: {
          700: "#8a691f",
          600: "#a67f28",
          500: "#c89b3c",
          400: "#d6ae5b",
          300: "#e4c584",
        },
        steel: {
          600: "#2e5c76",
          500: "#3c7395",
          400: "#4c8dae",
          300: "#7bacc7",
        },
        moss: {
          600: "#3f5e3d",
          500: "#5b8c5a",
          400: "#79a878",
        },
        rust: {
          600: "#8f3a3a",
          500: "#b54b4b",
          400: "#c96b6b",
        },
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
      letterSpacing: {
        widest2: "0.18em",
      },
    },
  },
  plugins: [],
};
