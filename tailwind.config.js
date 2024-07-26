/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'custom-gray': '#b3b3b3' // Customize this color as needed
      }
    }
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities(
        {
          '.scrollbar-gray': {
            '&::-webkit-scrollbar': {
              width: '12px'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#b3b3b3',
              borderRadius: '9999px'
            },
            '&::-webkit-scrollbar-track': {
              background: '#e0e0e0',
              borderRadius: '9999px'
            }
          }
        },
        ['responsive']
      )
    }
  ]
}
