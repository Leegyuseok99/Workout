/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        stack: {
          "0%": {
            opacity: "0",
            transform: "translateY(-12px)",
          },
          "15%": {
            opacity: "1",
            transform: "translateY(0)",
          },
          "60%": {
            opacity: "1",
            transform: "translateY(0)",
          },
          "75%": {
            opacity: "0",
            transform: "translateY(0)",
          },
          "100%": {
            opacity: "0",
            transform: "translateY(-12px)",
          },
        },
      },
      animation: {
        stack: "stack 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
