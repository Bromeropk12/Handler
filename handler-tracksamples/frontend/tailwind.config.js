/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        handler: {
          primary: '#1976d2',
          secondary: '#42a5f5',
          accent: '#ff9800',
          danger: '#d32f2f',
          warning: '#ffa000',
          success: '#388e3c',
          dark: '#1a1a2e',
          light: '#f5f5f5'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}