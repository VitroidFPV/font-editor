import { defineStore } from "pinia"
import { useFontStore } from "./fontStore"
import { ref, computed } from "vue"

interface PixelChange {
	characterIndex: number
	x: number
	y: number
	oldValue: number
	newValue: number
}

export const useHistoryStore = defineStore("history", () => {
	const undoStack = ref<PixelChange[]>([])
	const redoStack = ref<PixelChange[]>([])

	const fontStore = useFontStore()

	// Record a change to the undo stack
	function recordChange(change: PixelChange) {
		undoStack.value.push(change)
		// Clear redo stack when a new change is made
		redoStack.value = []
		console.log(
			`Recorded change: (${change.x},${change.y}) from ${change.oldValue} to ${change.newValue}`
		)
	}

	// Undo the last change
	function undo() {
		if (undoStack.value.length === 0) return false

		const change = undoStack.value.pop()
		if (!change) return false

		// Add to redo stack
		redoStack.value.push({
			characterIndex: change.characterIndex,
			x: change.x,
			y: change.y,
			oldValue: change.newValue, // swap old and new for redo
			newValue: change.oldValue
		})

		// Apply the reverse change
		fontStore.updatePixelSilent(
			change.characterIndex,
			change.x,
			change.y,
			change.oldValue
		)

		console.log(
			`Undo: restored pixel (${change.x},${change.y}) to ${change.oldValue}`
		)
		return true
	}

	// Redo the last undone change
	function redo() {
		if (redoStack.value.length === 0) return false

		const change = redoStack.value.pop()
		if (!change) return false

		// Add back to undo stack
		undoStack.value.push({
			characterIndex: change.characterIndex,
			x: change.x,
			y: change.y,
			oldValue: change.newValue, // swap old and new for undo
			newValue: change.oldValue
		})

		// Apply the change
		fontStore.updatePixelSilent(
			change.characterIndex,
			change.x,
			change.y,
			change.oldValue
		)

		console.log(
			`Redo: set pixel (${change.x},${change.y}) to ${change.oldValue}`
		)
		return true
	}

	// Clear all history
	function clearHistory() {
		undoStack.value = []
		redoStack.value = []
	}

	const canUndo = computed(() => undoStack.value.length > 0)
	const canRedo = computed(() => redoStack.value.length > 0)

	return {
		recordChange,
		undo,
		redo,
		clearHistory,
		canUndo,
		canRedo
	}
})
