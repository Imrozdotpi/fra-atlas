/** @type {import('tailwindcss').Config} */
let animatePlugin = null;
try {
  // try to require the optional plugin; if it's not installed we continue without failing
  // (this prevents Tailwind from crashing when the plugin is missing)
  // If you want the plugin features, run: npm install -D tailwindcss-animate
  // and this will be picked up automatically.
  animatePlugin = require("tailwindcss-animate");
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn(
    "tailwindcss-animate not found. Continuing without it. To enable animations install: npm install -D tailwindcss-animate"
  );
}

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/v0ui/**/*.{js,ts,jsx,tsx}", // include v0 UI components
  ],
  theme: {
    extend: {
      colors: {
        govGreen: "#0f7b40", // deep government green
        govAccent: "#2aa26b", // accent green
        ctaBlue: "#0f6fff", // CTA blue
        neutralBg: "#f7fafc", // light neutral background
        govText: "#111827", // dark text
      },
      // required by v0 UI (shadcn components, animations)
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: animatePlugin ? [animatePlugin] : [],
};
