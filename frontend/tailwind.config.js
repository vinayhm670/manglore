/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          deep: "#102D35",
          dark: "#164B49",
          primary: "#087F70",
          aurora: "#16B8A6",
          mint: "#D8F1E9",
          soft: "#E8F7F2",
        },
        clinical: {
          blue: "#E4EDFA",
          sky: "#EDF4FC",
        },
        surface: {
          ivory: "#F7F8F4",
          card: "#FFFFFF",
          muted: "#F0F2ED",
          border: "#E2E8E5",
        },
        brandtext: {
          primary: "#18332F",
          secondary: "#667B75",
          muted: "#94A39F",
          light: "#F0FDF8",
        },
        health: {
          normal: "#16A36A",
          normalBg: "#E8F8F0",
          watch: "#E6A23C",
          watchBg: "#FEF7EB",
          warning: "#E97835",
          warningBg: "#FDF1E9",
          critical: "#DC4545",
          criticalBg: "#FCEBEB",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Manrope", "sans-serif"],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'aurora-flow': 'aurora 14s ease infinite alternate',
        'ecg-scan': 'ecgScan 2.4s linear infinite',
      },
      keyframes: {
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        ecgScan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}
