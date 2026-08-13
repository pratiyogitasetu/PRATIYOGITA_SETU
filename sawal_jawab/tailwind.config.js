/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'green-primary': '#BAFF39',
        'green-secondary': '#FF921C',
        'green-light': '#FFFFFF',
        'green-dark': '#6E6E6E',
        'chat-gray': '#f3f4f6',
        'chat-white': '#ffffff',
        'yellow-green': '#BAFF39',
        'dim-grey': '#6E6E6E',
        'brand-orange': '#FF921C',
      },
    },
  },
  plugins: [],
}
