<script setup lang="ts">
import { useFontStore } from "../../stores/fontStore"

const fontStore = useFontStore()
const isExportingMcm = ref(false)
const isExportingHeader = ref(false)
const exportError = ref<Error | null>(null)

// Function to export the current font data as an MCM file
async function exportToMcm() {
	if (!fontStore.hasData) {
		return
	}

	try {
		isExportingMcm.value = true
		exportError.value = null

		// Prepare font data for export
		const jsonData = {
			metadata: fontStore.metadata || "MAX7456",
			characterCount: fontStore.characterCount || 256,
			characters: fontStore.characters
		}

		// Call the API to convert JSON to MCM format
		const response = await fetch("/api/json-to-mcm", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ jsonData })
		})

		if (!response.ok) {
			throw new Error(
				`Server returned ${response.status}: ${response.statusText}`
			)
		}

		const result = await response.json()

		if (!result.success) {
			throw new Error(result.error || "Unknown error occurred during export")
		}

		// Create a download link for the MCM file
		const blob = new Blob([result.data], { type: "text/plain" })
		const url = window.URL.createObjectURL(blob)

		// Create and trigger a download link
		const link = document.createElement("a")
		link.href = url
		link.download = "exported-font.mcm"
		document.body.appendChild(link)
		link.click()

		// Clean up
		document.body.removeChild(link)
		window.URL.revokeObjectURL(url)

		console.log("Font exported successfully!", result.timing)
	} catch (error) {
		console.error("Error exporting font:", error)
		exportError.value =
			error instanceof Error ? error : new Error(String(error))
	} finally {
		isExportingMcm.value = false
	}
}

// Function to export the current font data as a C header file
async function exportToHeader() {
	if (!fontStore.hasData) {
		return
	}

	try {
		isExportingHeader.value = true
		exportError.value = null

		// Prepare font data for export
		const fontData = {
			metadata: fontStore.metadata || "MAX7456",
			characterCount: fontStore.characterCount || 256,
			characters: fontStore.characters
		}

		// Call the API to convert JSON to header format
		const response = await fetch("/api/json-to-header", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ fontData })
		})

		if (!response.ok) {
			throw new Error(
				`Server returned ${response.status}: ${response.statusText}`
			)
		}

		const result = await response.json()

		if (!result.success) {
			throw new Error(result.error || "Unknown error occurred during export")
		}

		// Create a download link for the header file
		const blob = new Blob([result.data.headerContent], { type: "text/plain" })
		const url = window.URL.createObjectURL(blob)

		// Create and trigger a download link
		const link = document.createElement("a")
		link.href = url
		link.download = result.data.filename || "exported-font.h"
		document.body.appendChild(link)
		link.click()

		// Clean up
		document.body.removeChild(link)
		window.URL.revokeObjectURL(url)

		console.log("Header exported successfully!", result.timing)
	} catch (error) {
		console.error("Error exporting header:", error)
		exportError.value =
			error instanceof Error ? error : new Error(String(error))
	} finally {
		isExportingHeader.value = false
	}
}
</script>

<template>
	<div class="flex gap-4">
		<UButton
			:loading="isExportingMcm"
			:disabled="!fontStore.hasData || isExportingMcm || isExportingHeader"
			color="primary"
			icon="i-heroicons-arrow-down-tray"
			variant="soft"
			@click="exportToMcm"
		>
			Export MCM
		</UButton>

		<UButton
			:loading="isExportingHeader"
			:disabled="!fontStore.hasData || isExportingMcm || isExportingHeader"
			color="primary"
			icon="i-lucide-file-code"
			variant="soft"
			@click="exportToHeader"
		>
			Export Header
		</UButton>

		<p v-if="exportError" class="text-red-500 text-sm mt-2">
			{{ exportError.message }}
		</p>
	</div>
</template>
