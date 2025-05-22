import { defineStore } from "pinia"
import { ref } from "vue"

export const usePaletteStore = defineStore("palette", () => {
	const selectedColor = ref(0)

	return {
		selectedColor
	}
})
