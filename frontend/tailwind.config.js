/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}", // For Next.js App Router
        "./pages/**/*.{js,ts,jsx,tsx,mdx}", // For Next.js Pages Router
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}", // Common for Vite/React
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}