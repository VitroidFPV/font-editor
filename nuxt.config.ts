// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },

	modules: [
		"@nuxt/ui",
		"@nuxt/eslint",
		"@nuxt/fonts",
		"@nuxt/icon",
		"@pinia/nuxt",
		"@morev/vue-transitions/nuxt"
	],

	css: ["~/assets/css/main.css"],

	future: {
		compatibilityVersion: 4
	},

	compatibilityDate: "2024-11-27",

	app: {
		head: {
			link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
			title: "OSD Font Editor"
		}
	}
})
