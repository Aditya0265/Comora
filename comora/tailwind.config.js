/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        comora: {
          orange: '#FF6B35',
          navy: '#1F3A5E',
          cream: '#F5F1E8',
          charcoal: '#2C2C2C',
          grey: '#666666',
          beige: '#E0D5C7',
          success: '#2ECC71',
        },
        category: {
          literature: '#A86F6F',
          philosophy: '#7B68BE',
          film: '#6A5ACD',
          tech: '#4A90E2',
          music: '#E67E22',
          science: '#27AE60',
          career: '#E74C3C',
          food: '#D4A574',
          gaming: '#9B59B6',
          social: '#16A085',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'sans-serif'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        sm: '0 2px 8px rgba(0, 0, 0, 0.08)',
        md: '0 4px 16px rgba(0, 0, 0, 0.12)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.16)',
        xl: '0 20px 50px rgba(0, 0, 0, 0.20)',
      },
      letterSpacing: {
        tighter: '-0.02em',
        label: '0.05em',
      },
      lineHeight: {
        relaxed: '1.6',
      },
    },
  },
  plugins: [],
}
