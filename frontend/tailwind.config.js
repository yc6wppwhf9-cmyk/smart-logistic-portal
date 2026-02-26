/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f4f8ec',
                    100: '#e5f0d5',
                    200: '#cddeb0',
                    300: '#b0c885',
                    400: '#94b35e',
                    500: '#8DC63F',
                    600: '#6D9A2D',
                    700: '#537a22',
                    800: '#42611e',
                    900: '#38521c',
                    950: '#1d2f0a',
                },
                slate: {
                    900: '#111111',
                    950: '#000000',
                }
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
