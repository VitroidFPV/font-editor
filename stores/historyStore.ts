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

// A stroke is a collection of pixel changes made in a single drag operation
interface Stroke {
	changes: PixelChange[]
}

export const useHistoryStore = defineStore("history", () => {
	const undoStack = ref<Stroke[]>([])
	const redoStack = ref<Stroke[]>([])
	const currentStroke = ref<PixelChange[]>([])
	const isRecordingStroke = ref(false)

	const fontStore = useFontStore()

	// Start recording a new stroke
	function beginStroke() {
		isRecordingStroke.value = true
		currentStroke.value = []
	}

	// Add a change to the current stroke
	function addToStroke(change: PixelChange) {
		// Don't add duplicates within the same stroke
		const isDuplicate = currentStroke.value.some(
			(existing) =>
				existing.characterIndex === change.characterIndex &&
				existing.x === change.x &&
				existing.y === change.y
		)

		if (!isDuplicate) {
			currentStroke.value.push(change)
		}
	}

	// Finish recording the current stroke
	function endStroke() {
		if (currentStroke.value.length > 0) {
			undoStack.value.push({
				changes: [...currentStroke.value]
			})
			// Clear redo stack when a new change is made
			redoStack.value = []
			console.log(
				`Recorded stroke with ${currentStroke.value.length} pixel changes`
			)
		}
		currentStroke.value = []
		isRecordingStroke.value = false
	}

	// Record a single change (for backward compatibility)
	function recordChange(change: PixelChange) {
		if (isRecordingStroke.value) {
			addToStroke(change)
		} else {
			// Create a single-change stroke
			undoStack.value.push({
				changes: [change]
			})
			// Clear redo stack when a new change is made
			redoStack.value = []
			console.log(
				`Recorded individual change: (${change.x},${change.y}) from ${change.oldValue} to ${change.newValue}`
			)
		}
	}

	// Undo the last stroke
	function undo() {
		if (undoStack.value.length === 0) return false

		const stroke = undoStack.value.pop()
		if (!stroke) return false

		// Create reversed changes for the redo stack
		const redoChanges: PixelChange[] = stroke.changes.map((change) => ({
			characterIndex: change.characterIndex,
			x: change.x,
			y: change.y,
			oldValue: change.newValue, // swap old and new for redo
			newValue: change.oldValue
		}))

		// Add to redo stack
		redoStack.value.push({
			changes: redoChanges
		})

		// Apply all changes in the stroke in reverse order
		// This ensures we undo from last action to first
		for (let i = stroke.changes.length - 1; i >= 0; i--) {
			const change = stroke.changes[i] as PixelChange

			// Apply the reverse change
			fontStore.updatePixelSilent(
				change.characterIndex,
				change.x,
				change.y,
				change.oldValue
			)
		}

		console.log(`Undid stroke with ${stroke.changes.length} pixel changes`)
		return true
	}

	// Redo the last undone stroke
	function redo() {
		if (redoStack.value.length === 0) return false

		const stroke = redoStack.value.pop()
		if (!stroke) return false

		// Create reversed changes for the undo stack
		const undoChanges: PixelChange[] = stroke.changes.map((change) => ({
			characterIndex: change.characterIndex,
			x: change.x,
			y: change.y,
			oldValue: change.newValue, // swap old and new for undo
			newValue: change.oldValue
		}))

		// Add back to undo stack
		undoStack.value.push({
			changes: undoChanges
		})

		// Apply all changes in the stroke
		for (const change of stroke.changes) {
			// Apply the change
			fontStore.updatePixelSilent(
				change.characterIndex,
				change.x,
				change.y,
				change.oldValue
			)
		}

		console.log(`Redid stroke with ${stroke.changes.length} pixel changes`)
		return true
	}

	// Clear all history
	function clearHistory() {
		undoStack.value = []
		redoStack.value = []
		currentStroke.value = []
		isRecordingStroke.value = false
	}

	const canUndo = computed(() => undoStack.value.length > 0)
	const canRedo = computed(() => redoStack.value.length > 0)

	return {
		beginStroke,
		addToStroke,
		endStroke,
		recordChange,
		undo,
		redo,
		clearHistory,
		canUndo,
		canRedo,
		isRecordingStroke
	}
})
