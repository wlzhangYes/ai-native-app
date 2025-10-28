/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Anthropic Brand Colors
        'anthropic-dark': '#141413',
        'anthropic-light': '#faf9f5',
        'anthropic-mid-gray': '#b0aea5',
        'anthropic-light-gray': '#e8e6dc',
        'anthropic-orange': '#d97757',
        'anthropic-blue': '#6a9bcc',
        'anthropic-green': '#788c5d',
      },
      fontFamily: {
        'poppins': ['Poppins', 'Arial', 'sans-serif'],
        'lora': ['Lora', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
