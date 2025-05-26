import { defineStore } from "pinia"
import { ref } from "vue"
export const useOptionsStore = defineStore("options", () => {
	const showGrid = ref(true)
	const showTooltip = ref(true)
	const showBackground = ref(true)

	return {
		showGrid,
		showTooltip,
		showBackground
	}
})
