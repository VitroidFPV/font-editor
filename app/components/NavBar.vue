<script setup lang="ts">
import { ref } from "vue"
import { useFontStore } from "../../stores/fontStore"

const file = ref<File | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Get the font store
const fontStore = useFontStore()

function handleFileChange(event: Event) {
	const input = event.target as HTMLInputElement
	if (input.files && input.files.length > 0) {
		file.value = input.files[0] as File
		// Clear any previous errors when selecting a new file
		error.value = null
		console.log("📂 Font File selected:", file.value)
	}
}

async function readFileAndPostToApi() {
	if (!file.value) {
		error.value = "No file selected"
		fontStore.setError("No file selected")
		return
	}

	if (!file.value.name.endsWith(".mcm")) {
		error.value = "Selected file must be an MCM file"
		fontStore.setError("Selected file must be an MCM file")
		return
	}

	error.value = null
	isLoading.value = true

	try {
		console.log("📂 Begin parsing file")
		// Read the file content
		const fileContent = await file.value.text()

		// Send to API
		const response = await fetch("/api/mcm-to-json", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ mcmContent: fileContent })
		})

		const result = await response.json()

		if (!result.success) {
			const errorMsg = result.error || "Failed to process MCM file"
			error.value = errorMsg
			fontStore.setError(errorMsg)
			return
		}
		console.log("📂 File parsed successfully")
		// Store the result in the Pinia store
		fontStore.setFontData(result.data)
		console.log("📄 Font data loaded:", result.data)
		console.log("⏱️ Timing:", result.timing)
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown error occurred"
		error.value = errorMessage
		fontStore.setError(errorMessage)
	} finally {
		isLoading.value = false
	}
}
</script>

<template>
	<div class="w-full">
		<div
			class="flex p-2 w-full flex-wrap items-center justify-between bg-neutral-900 rounded-lg gap-2"
		>
			<div class="flex gap-4 items-center px-2">
				<img src="/favicon.svg" class="w-8 h-8" />
				<div class="flex gap-4 items-center">
					<UInput
						icon="i-lucide-folder-open"
						variant="soft"
						type="file"
						accept=".mcm"
						:ui="{
							base: 'file:mr-2 file:bg-primary-400 file:cursor-pointer file:text-inverted file:py-1 file:px-2 file:rounded-md',
							leadingIcon: 'text-primary-400'
						}"
						@change="handleFileChange"
					/>
					<UButton
						icon="i-lucide-book-check"
						variant="solid"
						:loading="isLoading"
						:disabled="!file || isLoading"
						@click="readFileAndPostToApi"
					>
						Read
					</UButton>

					<!-- Export button when font data is loaded -->
					<template v-if="fontStore.hasData">
						<FontExporter />
					</template>

					<div class="flex flex-col">
						<div v-if="error" class="text-red-500">{{ error }}</div>
						<div v-if="file && !error" class="text-lime-400 font-mono text-xs">
							Selected: {{ file.name }}
						</div>
						<div
							v-if="fontStore.hasData"
							class="text-sky-400 font-mono text-xs"
						>
							Loaded {{ fontStore.characterCount }} characters
						</div>
					</div>
				</div>
			</div>
			<div class="flex gap-2 items-center">
				<UButton
					icon="i-lucide-heart-plus"
					variant="soft"
					to="https://ko-fi.com/vitroid"
					target="_blank"
					rel="noopener noreferrer"
				>
					Support
				</UButton>
				<UButton
					icon="i-lucide-github"
					variant="soft"
					to="https://github.com/VitroidFPV/font-editor"
					target="_blank"
					rel="noopener noreferrer"
				>
					Source
				</UButton>
			</div>
		</div>
	</div>
</template>
