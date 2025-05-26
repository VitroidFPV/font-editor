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
const previewUrl = ref<string | null>(null)
const isLoading = ref(false)
const isPreviewLoading = ref(false)
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
		// Clear any previous preview
		if (previewUrl.value) {
			URL.revokeObjectURL(previewUrl.value)
			previewUrl.value = null
		}
		console.log("📂 Image File selected:", file.value)

		// Automatically generate preview
		generatePreview()
	}
}

async function generatePreview() {
	if (!file.value) {
		error.value = "Please select an image first"
		return
	}

	isPreviewLoading.value = true
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

		// Call the image-preview API endpoint
		const response = await fetch("/api/image-preview", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				imageData
			})
		})

		if (response.ok) {
			// Create blob URL for the preview image
			const blob = await response.blob()
			if (previewUrl.value) {
				URL.revokeObjectURL(previewUrl.value)
			}
			previewUrl.value = URL.createObjectURL(blob)
			console.log("✅ Preview generated successfully")
		} else {
			const errorText = await response.text()
			error.value = `Failed to generate preview: ${errorText}`
		}
	} catch (err) {
		console.error("Error generating preview:", err)
		error.value =
			err instanceof Error ? err.message : "Failed to generate preview"
	} finally {
		isPreviewLoading.value = false
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
	<div class="flex flex-col xl:flex-row gap-4 items-center xl:items-start">
		<div class="flex flex-col gap-4 w-full">
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
			<!-- Image previews -->
			<div class="flex flex-col gap-4">
				<!-- Original image -->
				<div class="flex flex-col gap-2 items-center">
					<h4 class="text-sm font-medium text-muted">Original Image</h4>
					<img
						v-if="imageUrl"
						:src="imageUrl"
						alt="Selected image preview"
						class="w-sm rounded-md shadow-md"
					/>
					<div
						v-else
						class="w-sm aspect-square bg-neutral-200/10 border-neutral-200/10 border-dashed border-2 rounded-md shadow-md"
					>
						<div class="flex items-center justify-center h-full">
							<UIcon name="i-lucide-image" class="text-neutral-400" />
						</div>
					</div>
				</div>
				<div class="flex flex-col gap-2 items-center">
					<h4 class="text-sm font-medium text-muted">Font Preview</h4>
					<div
						v-if="isPreviewLoading"
						class="w-sm aspect-[288/72] bg-neutral-200/10 border-neutral-200/10 border-dashed border-2 rounded-md shadow-md flex items-center justify-center"
					>
						<UIcon
							name="i-lucide-loader-2"
							class="text-neutral-400 animate-spin"
						/>
					</div>
					<img
						v-else-if="previewUrl"
						:src="previewUrl"
						alt="Processed image preview"
						class="w-sm rounded-md shadow-md bg-neutral-200/10"
						style="image-rendering: pixelated"
					/>
					<div
						v-else
						class="w-sm aspect-[288/72] bg-neutral-200/10 border-neutral-200/10 border-dashed border-2 rounded-md shadow-md"
					>
						<div class="flex items-center justify-center h-full">
							<UIcon name="i-lucide-eye" class="text-neutral-400" />
						</div>
					</div>
				</div>
			</div>
			<!-- Action buttons -->
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
		<div class="flex flex-col gap-2 text-text text-sm max-w-[50ch] w-fit">
			<p>
				Upload an image that will be used as a logo. Skip a step when uploading
				it from Betaflight Configurator every time you want to use the font for
				your new build!
			</p>
			<p>
				Another advantage over Betaflight Configurator is that you can use any
				image you want, not just a specific tri-color BMP image (as long as it
				has a transparent/color fill background). It will do its best to convert
				any image to a compatible format, but the results may not be perfect.
			</p>
			<p>
				The provided image will be converted to a black and white image with
				transparent background, for best results use a high-contrast image with
				a 288x72px resolution so that it doesn't have to be scaled up/down.
			</p>
		</div>
	</div>
</template>
