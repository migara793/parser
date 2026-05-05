/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          500: "#3b6cf6",
          600: "#2c54d4",
          700: "#1f3da3",
        },
      },
    },
  },
  plugins: [],
};
