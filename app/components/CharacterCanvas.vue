<script setup lang="ts">
import { useFontStore } from "../../stores/fontStore"
import { onMounted, ref, watch } from "vue"

const props = defineProps({
	characterIndex: {
		type: Number,
		required: true
	}
})

const fontStore = useFontStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Function to render a character to a canvas
function renderCharacter() {
	if (!canvasRef.value || !fontStore.hasData) return

	const character = fontStore.characters[props.characterIndex]
	if (!character) return

	const canvas = canvasRef.value
	const ctx = canvas.getContext("2d")
	if (!ctx) return

	const pixelSize = 2 // Size of each pixel in the canvas

	// Clear canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height)

	// Set canvas size based on character dimensions (typically 12x18)
	canvas.width = 12 * pixelSize
	canvas.height = 18 * pixelSize

	// Draw each pixel
	if (character.pixels) {
		for (let y = 0; y < character.pixels.length; y++) {
			const row = character.pixels[y]
			if (row) {
				for (let x = 0; x < row.length; x++) {
					const pixelValue = row[x]
					if (pixelValue !== undefined) {
						// Set fill style based on pixel value
						// 00 (0) = black, 10 (2) = white, X1 (1 or 3) = transparent
						switch (pixelValue) {
							case 0: // Black
								ctx.fillStyle = "#000000"
								break
							case 2: // White
								ctx.fillStyle = "#FFFFFF"
								break
							default: // Transparent
								ctx.fillStyle = "transparent"
								continue // Skip drawing transparent pixels
						}

						// Draw the pixel
						ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
					}
				}
			}
		}
	}
}

// Render on mount
onMounted(() => {
	renderCharacter()
})

// Watch for changes in the font store data
fontStore.$subscribe(() => {
	renderCharacter()
})

// Watch for character index changes
watch(
	() => props.characterIndex,
	() => {
		renderCharacter()
	}
)
</script>

<template>
	<canvas ref="canvasRef" class="w-full h-full character-canvas"></canvas>
</template>

<style scoped>
.character-canvas {
	image-rendering: pixelated;
	image-rendering: crisp-edges;
}
</style>
