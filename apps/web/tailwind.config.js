/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wgsn: {
          nav: "#1a1a1a",
          subnav: "#f0f0f0",
          green: "#2E7D32",
          "green-bright": "#34A853",
          callout: "#e8f5e9",
          "callout-border": "#81c784",
          muted: "#757575",
          line: "#bdbdbd",
          inputbg: "#fafafa",
          blue: "#1e88e5",
          lavender: "#c5cae9",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        report: ["Georgia", "Times New Roman", "serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.06)",
        modal: "0 8px 32px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
