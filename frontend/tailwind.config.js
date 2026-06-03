/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf2f8",
          100: "#fce7f3",
          500: "#db2777",
          600: "#be185d",
          700: "#9d174d",
        },
      },
    },
  },
  plugins: [],
};
