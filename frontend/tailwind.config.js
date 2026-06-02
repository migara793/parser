/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f7fee7",
          100: "#ecfccb",
          500: "#84cc16",
          600: "#65a30d",
          700: "#4d7c0f",
        },
      },
    },
  },
  plugins: [],
};
