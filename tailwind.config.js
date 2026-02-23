/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#36d4e2",     /* Cyan */
                "secondary": "#6366f1",   /* Indigo */
                "accent": "#f43f5e",      /* Coral */
                "background-light": "#f6f8f8",
            },
            fontFamily: {
                "display": ["Plus Jakarta Sans", "sans-serif"]
            },
            borderRadius: {
                "xl": "1rem",
                "2xl": "1.5rem",
            },
            animation: {
                'mesh': 'mesh 15s ease infinite',
            },
            keyframes: {
                mesh: {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                }
            }
        },
    },
    plugins: [],
}
