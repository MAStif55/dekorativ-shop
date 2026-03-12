import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                ivory: '#FFFFF0',       // Warm, light base background
                primary: {
                    light: '#F5E6CC',   // Soft warm light gold
                    DEFAULT: '#C5A059',  // Matte gold
                    dark: '#A08044',     // Darker gold/bronze
                },
                turquoise: {
                    light: '#E0F7FA',   // Very light cyan/turquoise for gradients
                    DEFAULT: '#4DD0E1',  // Main turquoise accent
                    dark: '#00BCD4',     // Darker turquoise for hover states
                },
                slate: {
                    light: '#94A3B8',
                    DEFAULT: '#334155',
                    dark: '#2C3338',     // Changed from #0F172A to deep graphite
                },
            },
            fontFamily: {
                heading: ['var(--font-lora)', 'serif'],
                body: ['var(--font-inter)', 'sans-serif'],
                ornamental: ['var(--font-lora)', 'serif'],
                elegant: ['var(--font-lora)', 'serif'],
            },
        },
    },
    plugins: [],
};

export default config;
