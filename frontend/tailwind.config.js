/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#132C2E", // deep teal-ink — primary dark surface / text
          light: "#1E3F41",
        },
        paper: "#F8F4EC", // warm ivory surface
        marigold: {
          DEFAULT: "#E8A93D", // primary accent
          dark: "#C98A22",
        },
        rust: "#B6532E", // secondary accent, used sparingly (status/alerts)
        moss: "#5C7A5E", // success/approved state
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Noto Sans", "Noto Sans Devanagari", "Noto Sans Telugu", "Noto Sans Tamil", "Noto Sans Kannada", "Noto Sans Malayalam", "sans-serif"],
      },
      borderRadius: {
        card: "0.375rem",
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};
