<script setup lang="ts">
import { ref } from "vue"
import { useFontStore } from "../../stores/fontStore"

interface ApiResponse {
	success: boolean
	error?: string
	data?: {
		metadata: string
		characterCount: number
		characters: Array<{
			index: number
			width: number
			height: number
			pixels: number[][]
		}>
	}
	tilesAdded?: number
	timing?: {
		totalTimeMs: number
		processingTimeMs: number
	}
}

const file = ref<File | null>(null)
const imageUrl = ref<string | null>(null)
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
		// Create object URL for the image preview
		if (imageUrl.value) {
			URL.revokeObjectURL(imageUrl.value)
		}
		imageUrl.value = URL.createObjectURL(file.value)
		console.log("📂 Image File selected:", file.value)
	}
}

async function addToFont() {
	if (!file.value) {
		error.value = "Please select an image first"
		return
	}

	isLoading.value = true
	error.value = null

	try {
		// Convert file to base64
		const reader = new FileReader()
		const imageDataPromise = new Promise<string>((resolve, reject) => {
			reader.onload = () => resolve(reader.result as string)
			reader.onerror = () => reject(new Error("Failed to read file"))
		})
		reader.readAsDataURL(file.value)

		const imageData = await imageDataPromise

		// Call the image-to-font API endpoint
		const response = (await $fetch("/api/image-to-font", {
			method: "POST",
			body: {
				imageData,
				fontData: {
					metadata: fontStore.metadata,
					characterCount: fontStore.characterCount,
					characters: fontStore.characters
				}
			}
		})) as ApiResponse

		if (response.success && response.data) {
			// Update the font store with the new data
			fontStore.setFontData(response.data)

			// Show success message
			console.log(
				`✅ Successfully added ${response.tilesAdded || 96} tiles to the font`
			)
			if (response.timing?.processingTimeMs) {
				console.log(
					`⏱️ Processing took ${response.timing.processingTimeMs.toFixed(2)}ms`
				)
			}

			// Clear the selected file after successful processing
			file.value = null
			if (imageUrl.value) {
				URL.revokeObjectURL(imageUrl.value)
				imageUrl.value = null
			}
		} else {
			error.value = response.error || "Failed to process image"
		}
	} catch (err) {
		console.error("Error processing image:", err)
		error.value = err instanceof Error ? err.message : "Failed to process image"
	} finally {
		isLoading.value = false
	}
}
</script>

<template>
	<div class="flex flex-col gap-4 w-fit">
		<div class="flex gap-4 items-center">
			<UInput
				icon="i-lucide-folder-open"
				variant="soft"
				type="file"
				accept=".bmp,.png,.jpg,.jpeg,.webp,.gif,.tiff"
				:ui="{
					root: 'w-full',
					base: 'file:mr-2 file:bg-primary-400 file:cursor-pointer file:text-inverted file:py-1 file:px-2 file:rounded-md',
					leadingIcon: 'text-primary-400'
				}"
				@change="handleFileChange"
			/>
		</div>
		<img
			v-if="imageUrl"
			:src="imageUrl"
			alt="Selected image preview"
			class="w-sm rounded-md shadow-md"
		/>
		<div
			v-else
			class="w-sm aspect-[288/72] bg-neutral-200/10 border-neutral-200/10 border-dashed border-2 rounded-md shadow-md"
		>
			<div class="flex items-center justify-center h-full">
				<UIcon name="i-lucide-image" class="text-neutral-400" />
			</div>
		</div>
		<UButton
			:disabled="!file || isLoading"
			:loading="isLoading"
			variant="solid"
			class="justify-center"
			@click="addToFont"
		>
			{{ isLoading ? "Processing..." : "Add to font" }}
		</UButton>
		<div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
	</div>
</template>
