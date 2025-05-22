<script setup lang="ts">
import { useFontStore } from "../../stores/fontStore"
import { usePaletteStore } from "../../stores/paletteStore"
import { useHistoryStore } from "../../stores/historyStore"
import { computed, ref } from "vue"

const fontStore = useFontStore()
const paletteStore = usePaletteStore()
const historyStore = useHistoryStore()

// Drag painting state
const isDragging = ref(false)
const isRightClick = ref(false)
const lastPaintedCoords = ref<{ x: number; y: number } | null>(null)

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

// Handle left click (paint with selected color)
function handleLeftClick(x: number, y: number) {
	const result = fontStore.updatePixel(x, y, paletteStore.selectedColor)
	if (result) {
		historyStore.recordChange({
			characterIndex: fontStore.selectedCharacterIndex,
			x,
			y,
			oldValue: result.oldValue,
			newValue: result.newValue
		})
	}

	// Update last painted coordinates
	lastPaintedCoords.value = { x, y }
}

// Handle right click (set to transparent)
function handleRightClick(x: number, y: number) {
	const result = fontStore.updatePixel(x, y, 1) // 1 = transparent
	if (result) {
		historyStore.recordChange({
			characterIndex: fontStore.selectedCharacterIndex,
			x,
			y,
			oldValue: result.oldValue,
			newValue: result.newValue
		})
	}

	// Update last painted coordinates
	lastPaintedCoords.value = { x, y }

	return false // Prevent context menu
}

// Start drag painting
function startDrag(event: MouseEvent, x: number, y: number) {
	isDragging.value = true
	isRightClick.value = event.button === 2

	// Begin recording a stroke
	historyStore.beginStroke()

	// Paint the initial pixel
	if (isRightClick.value) {
		handleRightClick(x, y)
	} else {
		handleLeftClick(x, y)
	}
}

// Continue drag painting
function continueDrag(x: number, y: number) {
	// Only process if we're dragging and the coords are different from last painted
	if (!isDragging.value) return
	if (lastPaintedCoords.value?.x === x && lastPaintedCoords.value?.y === y)
		return

	// Paint based on which mouse button is held
	if (isRightClick.value) {
		handleRightClick(x, y)
	} else {
		handleLeftClick(x, y)
	}
}

// End drag painting
function endDrag() {
	if (isDragging.value) {
		// Finish recording the stroke
		historyStore.endStroke()

		isDragging.value = false
		isRightClick.value = false
		lastPaintedCoords.value = null
	}
}

// Define keyboard shortcuts using Nuxt's defineShortcuts
defineShortcuts({
	// Undo with Ctrl+Z
	ctrl_z: () => historyStore.undo(),
	// Redo with Ctrl+Y
	ctrl_y: () => historyStore.redo(),
	// Redo with Ctrl+Shift+Z
	ctrl_shift_z: () => historyStore.redo()
})

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
	<div
		:class="`grid-container ${showBackground ? 'bg-neutral-900' : ''}`"
		@mouseup="endDrag"
		@mouseleave="endDrag"
	>
		<!-- Undo/Redo Controls -->
		<div class="undo-redo-controls">
			<UButton
				:disabled="!historyStore.canUndo"
				icon="i-heroicons-arrow-uturn-left"
				color="neutral"
				variant="subtle"
				size="sm"
				class="rounded-full"
				:tooltip="{
					text: 'Undo (Ctrl+Z)',
					disabled: !historyStore.canUndo
				}"
				@click="historyStore.undo()"
			/>
			<UButton
				:disabled="!historyStore.canRedo"
				icon="i-heroicons-arrow-uturn-right"
				color="neutral"
				variant="subtle"
				size="sm"
				class="rounded-full"
				:tooltip="{
					text: 'Redo (Ctrl+Y)',
					disabled: !historyStore.canRedo
				}"
				@click="historyStore.redo()"
			/>
		</div>

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
					@mousedown="startDrag($event, x - 1, y - 1)"
					@mousemove="continueDrag(x - 1, y - 1)"
					@contextmenu.prevent
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
	position: relative;
}

.grid-cell {
	aspect-ratio: 1/1;
	width: 32px;
}

.undo-redo-controls {
	position: absolute;
	top: -40px;
	right: 0;
	display: flex;
	gap: 8px;
	z-index: 10;
}
</style>
