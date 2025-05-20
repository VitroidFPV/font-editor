<script setup lang="ts">
import { ref, defineEmits } from "vue"

const file = ref<File | null>(null)
const mcmData = ref(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

function handleFileChange(event: Event) {
	const input = event.target as HTMLInputElement
	if (input.files && input.files.length > 0) {
		file.value = input.files[0] as File
	}
}

async function readFileAndPostToApi() {
	if (!file.value) {
		error.value = "No file selected"
		return
	}

	if (!file.value.name.endsWith(".mcm")) {
		error.value = "Selected file must be an MCM file"
		return
	}

	error.value = null
	isLoading.value = true

	try {
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
			error.value = result.error || "Failed to process MCM file"
			return
		}

		// Store the result
		mcmData.value = result.data

		// You could emit an event or use Pinia/Vuex store to share this data
		// For now, we'll emit an event
		emit("mcmDataLoaded", result.data)
		console.log(result.data)
	} catch (err) {
		error.value = err instanceof Error ? err.message : "Unknown error occurred"
	} finally {
		isLoading.value = false
	}
}

const emit = defineEmits(["mcmDataLoaded"])
</script>

<template>
	<div class="w-full">
		<div
			class="flex p-2 w-full items-center bg-neutral-950/30 rounded-lg h-full gap-2"
		>
			<div class="flex gap-4">
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
				<UButton icon="i-lucide-save-all" variant="soft">Save As</UButton>
			</div>
			<div v-if="error" class="text-red-500 ml-4">{{ error }}</div>
			<div v-if="file && !error" class="text-green-500 ml-4">
				Selected: {{ file.name }}
			</div>
		</div>
	</div>
</template>
