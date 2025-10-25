/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		fontFamily: {
			"noto-regurar": ["NotoSansJP_400Regular", "NotoSansJP_700Bold", "sans-serif"],
			"noto-bold": ["NotoSansJP_700Bold", "sans-serif"],
		},
		extend: {},
	},
	plugins: [],
};
