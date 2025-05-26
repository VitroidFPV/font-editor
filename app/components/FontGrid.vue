<script setup lang="ts">
import { useFontStore } from "~~/stores/fontStore"

const fontStore = useFontStore()

const props = defineProps({
	showGrid: {
		type: Boolean,
		default: true
	},
	showTooltip: {
		type: Boolean,
		default: true
	},
	showBackground: {
		type: Boolean,
		default: true
	}
})

const showGrid = computed(() => props.showGrid)
const showTooltip = computed(() => props.showTooltip)
const showBackground = computed(() => props.showBackground)

function getCharacterIndex(x: number, y: number, zeroBased: boolean = false) {
	return (y - (zeroBased ? 0 : 1)) * 16 + (x - (zeroBased ? 0 : 1))
}

function handleCellClick(x: number, y: number) {
	// Only handle click if font data is loaded
	if (!fontStore.hasData) return

	// Calculate character index (16 characters per row)
	const index = getCharacterIndex(x, y, false)

	// Select the character in the font store
	fontStore.selectedCharacterIndex = index
	console.log(fontStore.selectedCharacterIndex)
}

function isSelected(x: number, y: number) {
	return fontStore.selectedCharacterIndex === getCharacterIndex(x, y, false)
}
</script>

<template>
	<div
		:class="`relative border-2 border-neutral-800 transition-all duration-300 overflow-clip 
		${showGrid ? 'rounded-none' : 'rounded-lg'} ${showBackground ? 'bg-neutral-700/30' : ''}`"
	>
		<div class="absolute pointer-events-none w-full h-full z-10">
			<FontGridCanvas />
		</div>
		<div class="z-50 h-full w-full grid grid-cols-16 grid-rows-16">
			<!-- Grid rows with cells -->
			<template v-for="y in 16" :key="'row-' + y">
				<!-- Grid cells -->
				<UTooltip
					v-for="x in 16"
					:key="'cell-' + x + '-' + y"
					:text="`${getCharacterIndex(x, y, false)} (${getCharacterIndex(x, y, false).toString(16).toUpperCase()} hex)`"
					:ui="{
						content: 'bg-primary-400'
					}"
					:delay-duration="50"
					:disabled="!showTooltip"
				>
					<button
						:class="`border transition-[border-color] duration-300 grid-cell bg-transparent hover:bg-primary-400/50 
						cursor-pointer flex items-center justify-center z-10 
						${showGrid ? ' border-neutral-500/20' : 'border-transparent'} ${isSelected(x, y) ? 'bg-primary-400/50!' : ''}`"
						@click="handleCellClick(x, y)"
					></button>
				</UTooltip>
			</template>
		</div>
	</div>
</template>

<style scoped>
.grid-cell {
	aspect-ratio: 12/18;
	min-width: 100%;
}
</style>
