/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        gray1: '#1E1E1E',
        gray2: '#202020',
        gray3: '#303030',
        gray4: '#414141',
        gray5: '#A0A0A0',

        rgba1: 'rgba(255,255,255,0.03)',
        rgba2: 'rgba(255,255,255,0.07)',
        rgba3: 'rgba(255,255,255,0.15)',
      },
      transitionTimingFunction: {
        ease: 'cubic-bezier(.18,.18,.08,.99)',
      }
    },
  },
  plugins: [],
}

