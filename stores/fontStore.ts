import { defineStore } from "pinia"

interface McmCharacter {
	index: number
	width: number
	height: number
	pixels: number[][]
}

interface McmData {
	metadata: string
	characterCount: number
	characters: McmCharacter[]
}

interface TimingInfo {
	totalTimeMs: number
	parseTimeMs: number
}

export const useFontStore = defineStore("font", {
	state: () => ({
		metadata: "",
		characterCount: 0,
		characters: [] as McmCharacter[],
		isLoaded: false,
		selectedCharacterIndex: 1,
		error: null as string | null,
		timing: null as TimingInfo | null
	}),

	getters: {
		hasData: (state) => state.isLoaded && state.characters.length > 0,
		selectedCharacter: (state) => {
			if (
				state.selectedCharacterIndex >= 0 &&
				state.selectedCharacterIndex < state.characters.length
			) {
				return state.characters[state.selectedCharacterIndex]
			}
			return null
		}
	},

	actions: {
		setFontData(data: McmData) {
			this.metadata = data.metadata
			this.characterCount = data.characterCount
			this.characters = data.characters
			this.isLoaded = true
			this.error = null
		},

		setTiming(timing: TimingInfo) {
			this.timing = timing
		},

		selectCharacter(index: number) {
			if (index >= 0 && index < this.characters.length) {
				this.selectedCharacterIndex = index
				return true
			}
			return false
		},

		// Get the current pixel value
		getPixelValue(characterIndex: number, x: number, y: number): number {
			if (
				characterIndex >= 0 &&
				characterIndex < this.characters.length &&
				x >= 0 &&
				y >= 0
			) {
				return this.characters[characterIndex]?.pixels?.[y]?.[x] ?? 1 // Default to transparent
			}
			return 1 // Default to transparent
		},

		// Update pixel with history tracking
		updatePixel(x: number, y: number, value: number) {
			if (
				this.selectedCharacterIndex >= 0 &&
				this.selectedCharacterIndex < this.characters.length &&
				x >= 0 &&
				y >= 0
			) {
				// Get the old value for history
				const oldValue = this.getPixelValue(this.selectedCharacterIndex, x, y)

				// Don't update if the value is the same
				if (oldValue === value) return false

				// Update the pixel
				this.updatePixelSilent(this.selectedCharacterIndex, x, y, value)

				// Notify history store of the change (will be handled by the component)
				console.log(`Updated pixel at (${x},${y}) from ${oldValue} to ${value}`)
				return { oldValue, newValue: value }
			}
			return false
		},

		// Update pixel without history tracking (for undo/redo)
		updatePixelSilent(
			characterIndex: number,
			x: number,
			y: number,
			value: number
		) {
			if (
				characterIndex >= 0 &&
				characterIndex < this.characters.length &&
				x >= 0 &&
				y >= 0
			) {
				// Create a deep copy of the character
				const updatedChar = JSON.parse(
					JSON.stringify(this.characters[characterIndex])
				)

				// Ensure pixels array exists and has enough rows
				if (!updatedChar.pixels) {
					updatedChar.pixels = []
				}

				// Ensure the row exists
				if (!updatedChar.pixels[y]) {
					updatedChar.pixels[y] = []
				}

				// Update the pixel
				updatedChar.pixels[y][x] = value

				// Update the character in the store
				this.characters[characterIndex] = updatedChar
				return true
			}
			return false
		},

		clearData() {
			this.metadata = ""
			this.characterCount = 0
			this.characters = []
			this.isLoaded = false
			this.selectedCharacterIndex = -1
			this.error = null
			this.timing = null
		},

		setError(message: string) {
			this.error = message
		}
	}
})
