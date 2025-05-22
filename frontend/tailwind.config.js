/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: {
      center: true,
      flex: true,
      justifyCenter: true,
      padding: "2rem",
    },
    screens: {
      sm: "640px", // Small screens (default: >= 640px)
      md: "768px", // Medium screens (default: >= 768px)
      lg: "1024px", // Large screens (default: >= 1024px)
      xl: "1280px", // Extra large screens (default: >= 1280px)
      "2xl": "1536px", // 2X large screens (default: >= 1536px)
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["night"],
  },
};
