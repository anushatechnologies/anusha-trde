/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}', './animations/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#F8FAFC',
        ink: '#0F172A',
        mute: '#64748B',
        brand: {
          50: '#EEF2FF',
          500: '#1E40FF',
          600: '#4F46E5',
          700: '#6A5CFF',
        },
        success: '#22C55E',
        danger: '#EF4444',
      },
      borderRadius: {
        card: '20px',
        premium: '28px',
      },
      boxShadow: {
        glow: '0px 16px 40px rgba(79, 70, 229, 0.20)',
      },
      fontFamily: {
        inter: ['Inter_400Regular'],
        interSemi: ['Inter_600SemiBold'],
        interBold: ['Inter_700Bold'],
        poppinsSemi: ['Poppins_600SemiBold'],
        poppinsBold: ['Poppins_700Bold'],
      },
    },
  },
  plugins: [],
};
