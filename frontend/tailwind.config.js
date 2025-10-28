/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Important: Set corePlugins to disable preflight to avoid conflicts with Ant Design
  corePlugins: {
    preflight: false,
  },
}
