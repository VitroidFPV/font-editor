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
			return "bg-black"
		case 1: // Transparent
			return "bg-transparent"
		case 2: // White
			return "bg-white"
		case 3: // Gray
			return "bg-neutral-400"
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
</script>

<template>
	<div class="grid-container">
		<!-- Grid rows with cells -->
		<template v-for="y in 18" :key="'row-' + y">
			<!-- Grid cells -->
			<UTooltip
				v-for="x in 12"
				:key="'cell-' + x + '-' + y"
				:text="'Position: ' + (x - 1) + ',' + (y - 1)"
			>
				<div
					class="grid-cell border border-neutral-800 hover:bg-neutral-700/50 cursor-pointer flex items-center justify-center text-xs text-neutral-400"
					:class="getCellStyle(getPixelValue(x - 1, y - 1))"
				></div>
			</UTooltip>
		</template>
	</div>

	<div class="mt-4 flex gap-2">
		<div class="flex items-center">
			<div class="w-4 h-4 bg-black mr-1"></div>
			<span class="text-xs">Black (00)</span>
		</div>
		<div class="flex items-center">
			<div class="w-4 h-4 bg-white mr-1 border border-neutral-800"></div>
			<span class="text-xs">White (10)</span>
		</div>
		<div class="flex items-center">
			<div class="w-4 h-4 bg-neutral-400 mr-1 border border-neutral-800"></div>
			<span class="text-xs">Gray (11)</span>
		</div>
		<div class="flex items-center">
			<div class="w-4 h-4 bg-transparent mr-1 border border-neutral-800"></div>
			<span class="text-xs">Transparent (01)</span>
		</div>
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
