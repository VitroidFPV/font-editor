<script setup lang="ts">
import { useFontStore } from "../../stores/fontStore"
import { computed } from "vue"

const fontStore = useFontStore()

// Get the character from the store's selected index
const character = computed(() => {
	return fontStore.selectedCharacter
})

// Helper function to determine cell color based on pixel value
function getCellStyle(pixelValue: number | undefined) {
	if (pixelValue === undefined) return "bg-transparent"

	// 00 (0) = black, 10 (2) = white, 11 (3) = gray, 01 (1) = transparent
	switch (pixelValue) {
		case 0: // Black
			return "bg-black hover:bg-neutral-900"
		case 1: // Transparent
			return "bg-transparent"
		case 2: // White
			return "bg-white hover:bg-neutral-200"
		case 3: // Gray
			return "bg-neutral-400 hover:bg-neutral-500"
		default:
			return "bg-transparent"
	}
}

// Safe way to get a pixel value
function getPixelValue(x: number, y: number): number | undefined {
	return character.value?.pixels?.[y]?.[x]
}

// Format an integer as hex with uppercase letters
function toHex(value: number): string {
	return value.toString(16).toUpperCase()
}

const props = defineProps({
	showTooltip: {
		type: Boolean,
		default: true
	},
	showGrid: {
		type: Boolean,
		default: true
	},
	showBackground: {
		type: Boolean,
		default: false
	}
})

const showTooltip = computed(() => props.showTooltip)
const showGrid = computed(() => props.showGrid)
const showBackground = computed(() => props.showBackground)
</script>

<template>
	<div :class="`grid-container ${showBackground ? 'bg-neutral-900' : ''}`">
		<!-- Grid rows with cells -->
		<template v-for="y in 18" :key="'row-' + y">
			<!-- Grid cells -->
			<UTooltip
				v-for="x in 12"
				:key="'cell-' + x + '-' + y"
				:text="'Position: ' + (x - 1) + ',' + (y - 1)"
				:disabled="!showTooltip"
			>
				<div
					:class="`grid-cell border ${showGrid ? 'border-neutral-800' : 'border-transparent'} cursor-pointer flex items-center justify-center text-xs 
					text-neutral-400 ${getCellStyle(getPixelValue(x - 1, y - 1))}`"
				></div>
			</UTooltip>
		</template>
	</div>
</template>

<style scoped>
.grid-container {
	display: grid;
	grid-template-columns: repeat(12, 1fr);
	grid-template-rows: repeat(18, 1fr);
	width: fit-content;
}

.grid-cell {
	aspect-ratio: 1/1;
	width: 32px;
}
</style>
