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
