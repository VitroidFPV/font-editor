<script setup lang="ts">
import { useFontStore } from "../../stores/fontStore"
import { onMounted, ref, watch } from "vue"

const fontStore = useFontStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)

const CELL_WIDTH = 12 // Each character is 12px wide
const CELL_HEIGHT = 18 // Each character is 18px tall
const GRID_SIZE = 16 // 16x16 grid of characters
const CANVAS_WIDTH = CELL_WIDTH * GRID_SIZE
const CANVAS_HEIGHT = CELL_HEIGHT * GRID_SIZE

// Function to render the entire font grid on canvas
function renderFontGrid() {
	const canvas = canvasRef.value
	if (!canvas || !fontStore.hasData) return

	const ctx = canvas.getContext("2d")
	if (!ctx) return

	// Clear canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height)

	// Draw each character in the 16x16 grid
	for (let gridY = 0; gridY < GRID_SIZE; gridY++) {
		for (let gridX = 0; gridX < GRID_SIZE; gridX++) {
			const charIndex = gridY * GRID_SIZE + gridX

			if (charIndex < fontStore.characters.length) {
				const character = fontStore.characters[charIndex]

				// Draw this character's pixels
				if (character && character.pixels) {
					for (let y = 0; y < character.height; y++) {
						for (let x = 0; x < character.width; x++) {
							const pixelValue = character.pixels[y]?.[x]

							// Set pixel color based on value (similar to CharacterGrid.vue logic)
							if (pixelValue === 0) {
								// Black
								ctx.fillStyle = "#000000"
							} else if (pixelValue === 2) {
								// White
								ctx.fillStyle = "#FFFFFF"
							} else {
								// Transparent (1 or 3)
								continue // Skip transparent pixels
							}

							// Calculate position on canvas
							const canvasX = gridX * CELL_WIDTH + x
							const canvasY = gridY * CELL_HEIGHT + y

							// Draw the pixel
							ctx.fillRect(canvasX, canvasY, 1, 1)
						}
					}
				}
			}
		}
	}
}

// Render when component is mounted
onMounted(() => {
	renderFontGrid()
})

// Re-render when font data changes
watch(
	() => fontStore.characters,
	() => {
		renderFontGrid()
	},
	{ deep: true }
)
</script>

<template>
	<canvas
		ref="canvasRef"
		:width="CANVAS_WIDTH"
		:height="CANVAS_HEIGHT"
		class="aspect-[12/18] w-full h-full"
	></canvas>
</template>

<style scoped>
canvas {
	image-rendering: pixelated;
}
</style>
