export default defineAppConfig({
	// https://ui.nuxt.com/getting-started/theme#design-system
	ui: {
		colors: {
			primary: "rose",
			neutral: "zinc"
		},
		button: {
			slots: {
				base: "cursor-pointer"
			}
		}
	}
})
