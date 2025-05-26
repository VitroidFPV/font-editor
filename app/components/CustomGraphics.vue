<script setup lang="ts">
import { useFontStore } from "~~/stores/fontStore"
import domtoimage from "dom-to-image-more"

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

const fontStore = useFontStore()

// Image upload state
const file = ref<File | null>(null)
const imageUrl = ref<string | null>(null)
const previewUrl = ref<string | null>(null)
const isLoading = ref(false)
const isPreviewLoading = ref(false)
const error = ref<string | null>(null)

const replaceableCharacterIndexes = [
	[33, "!"],
	[34, '"'],
	[35, "#"],

	[37, "%"],
	[38, "&"],
	[39, "'"],

	[44, ","],

	[59, ";"],
	[61, "="],

	[63, "?"],
	[64, "@"],

	[91, "["],
	[92, "\\"],
	[93, "]"],
	[94, "^"]
]

const crosshairCharacterIndexes = [114, 115, 116]

const sacrificeCrosshair = ref(false)

const width = ref(5)
const height = ref(2)

const maxWidth = computed(() => {
	if (height.value == 1) {
		return 15
	} else if (height.value == 2) {
		return 7
	} else if (height.value == 3) {
		return 3
	}
	return 0 // Add default return value
})

const maxHeight = computed(() => {
	if (sacrificeCrosshair.value) {
		return 3
	} else if (width.value <= 7) {
		return 2
	} else {
		return 1
	}
})

// Computed dimensions for the image processing
const imageWidth = computed(() => width.value * 12)
const imageHeight = computed(() => height.value * 18)

// Watch for dimension changes and regenerate preview
watch([width, height], () => {
	if (file.value) {
		generatePreview()
	}
})

// Cleanup URLs when component is unmounted
onUnmounted(() => {
	if (imageUrl.value) {
		URL.revokeObjectURL(imageUrl.value)
	}
	if (previewUrl.value) {
		URL.revokeObjectURL(previewUrl.value)
	}
})

function cellBackground(i: number) {
	// Create a checkerboard pattern by checking row and column position
	const row = Math.floor((i - 1) / width.value)
	const col = (i - 1) % width.value
	const isEven = (row + col) % 2 === 0
	return isEven ? "bg-neutral-700" : "bg-neutral-800"
}

function exportGridTemplate() {
	const gridTemplate = document.getElementById("gridTemplate")
	if (!gridTemplate) return

	domtoimage
		.toBlob(gridTemplate, {
			height: height.value * 18,
			width: width.value * 12,
			style: {
				transform: "scale(0.375) translate(-4px, -4px)",
				transformOrigin: "top left",
				imageRendering: "crisp-edges"
			}
		})
		.then(function (blob: Blob) {
			const link = document.createElement("a")
			link.href = URL.createObjectURL(blob)
			link.download = "grid-template.png"
			link.click()
			URL.revokeObjectURL(link.href)
		})
		.catch(function (error: Error) {
			console.error("Error generating image:", error)
		})
}

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
		console.log("📂 Custom Graphics Image File selected:", file.value)

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

		// Call the image-preview API endpoint with custom dimensions
		const response = await fetch("/api/image-preview", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				imageData,
				width: imageWidth.value,
				height: imageHeight.value
			})
		})

		if (response.ok) {
			// Create blob URL for the preview image
			const blob = await response.blob()
			if (previewUrl.value) {
				URL.revokeObjectURL(previewUrl.value)
			}
			previewUrl.value = URL.createObjectURL(blob)
			console.log("✅ Custom Graphics Preview generated successfully")
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

		// Get the character indexes that will be replaced
		const characterIndexes = getReplacementCharacterIndexes()

		// Call the image-to-font API endpoint with custom dimensions
		const response = (await $fetch("/api/image-to-font", {
			method: "POST",
			body: {
				imageData,
				width: imageWidth.value,
				height: imageHeight.value,
				tileWidth: 12,
				tileHeight: 18,
				characterMapping: characterIndexes, // Map tiles to specific character indexes
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
				`✅ Successfully added ${response.tilesAdded || width.value * height.value} custom graphics tiles to the font`
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

function getReplacementCharacterIndexes(): number[] {
	const indexes: number[] = []

	// Add craft name characters (first row)
	for (let i = 0; i < width.value; i++) {
		if (i < replaceableCharacterIndexes.length) {
			const charEntry = replaceableCharacterIndexes[i]
			if (charEntry && charEntry[0] && typeof charEntry[0] === "number") {
				indexes.push(charEntry[0])
			}
		}
	}

	// Add pilot name characters (second row) if height >= 2
	if (height.value >= 2) {
		for (let i = 0; i < width.value; i++) {
			const charIndex = width.value + i
			if (
				charIndex < replaceableCharacterIndexes.length &&
				replaceableCharacterIndexes[charIndex]
			) {
				const charIndexValue = replaceableCharacterIndexes[charIndex][0]
				if (typeof charIndexValue === "number") {
					indexes.push(charIndexValue)
				}
			}
		}
	}

	// Add crosshair characters (third row) if height is 3
	if (height.value === 3) {
		for (let i = 0; i < width.value; i++) {
			if (i < crosshairCharacterIndexes.length) {
				const crosshairIndex = crosshairCharacterIndexes[i]
				if (typeof crosshairIndex === "number") {
					indexes.push(crosshairIndex)
				}
			}
		}
	}

	return indexes
}

const craftNameString = computed(() => {
	return (
		replaceableCharacterIndexes
			.slice(0, width.value)
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			.map(([index, character]) => character)
			.join("")
	)
})

const pilotNameString = computed(() => {
	if (height.value == 1) {
		return ""
	} else if (height.value == 2) {
		return (
			replaceableCharacterIndexes
				.slice(width.value, width.value * 2)
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.map(([index, character]) => character)
				.join("")
		)
	} else if (height.value == 3) {
		return (
			replaceableCharacterIndexes
				.slice(width.value, width.value * 2)
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.map(([index, character]) => character)
				.join("")
		)
	} else {
		return ""
	}
})
</script>

<template>
	<div class="flex flex-col xl:flex-row gap-4">
		<div class="flex flex-col gap-4 w-full items-center">
			<div class="flex flex-col gap-4 w-fit items-center">
				<div class="flex gap-4 w-fit items-center">
					<USwitch v-model="sacrificeCrosshair" label="Sacrifice Crosshair" />
					<div class="flex gap-2 items-center">
						<UInput
							v-model="width"
							type="number"
							label="Width"
							class="w-16"
							:max="maxWidth"
							:min="1"
						/>
						Width
					</div>
					<div class="flex gap-2 items-center">
						<UInput
							v-model="height"
							type="number"
							label="Height"
							class="w-16"
							:max="maxHeight"
							:min="1"
						/>
						Height
					</div>
				</div>
				<div class="flex gap-4">
					<div
						id="gridTemplate"
						class="grid w-fit"
						:style="{
							gridTemplateColumns: `repeat(${width}, 1fr)`,
							gridTemplateRows: `repeat(${height}, 1fr)`
						}"
					>
						<div
							v-for="i in width * height"
							:key="i"
							:class="`aspect-[12/18] font-thin text-2xl w-8 flex items-center border-none! justify-center ${cellBackground(i)}`"
						>
							{{ i }}
						</div>
					</div>
					<div
						class="flex flex-col gap-2 font-mono text-sm bg-neutral-950 border-neutral-400/10 w-fit rounded-lg p-4"
					>
						<div class="flex gap-2">
							<div class="select-all">
								{{ craftNameString }}
							</div>
							<div class="text-muted text-mono text-sm">Craft Name</div>
						</div>
						<div v-if="height >= 2" class="flex gap-2">
							<div class="select-all">
								{{ pilotNameString }}
							</div>
							<div class="text-muted text-mono text-sm">Pilot Name</div>
						</div>
						<div v-if="height === 3" class="flex gap-2">
							<div>Crosshair</div>
						</div>
					</div>
				</div>
				<UButton class="w-full" @click="exportGridTemplate"
					>Export Grid Template</UButton
				>
			</div>

			<!-- Image Upload Section -->
			<div class="flex flex-col gap-4 w-full max-w-md">
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
				<div class="flex gap-4 w-full">
					<!-- Original image -->
					<div class="flex flex-col gap-2 items-center w-full">
						<h4 class="text-sm font-medium text-muted">Original Image</h4>
						<img
							v-if="imageUrl"
							:src="imageUrl"
							alt="Selected image preview"
							class="w-full max-w-sm rounded-md shadow-md"
						/>
						<div
							v-else
							class="w-full bg-neutral-200/10 border-neutral-200/10 border-dashed border-2 rounded-md shadow-md"
							:style="{ aspectRatio: `${imageWidth}/${imageHeight}` }"
						>
							<div class="flex items-center justify-center h-full">
								<UIcon name="i-lucide-image" class="text-neutral-400" />
							</div>
						</div>
					</div>

					<!-- Font preview -->
					<div class="flex flex-col gap-2 items-center w-full">
						<h4 class="text-sm font-medium text-muted">
							Grid Preview ({{ imageWidth }}x{{ imageHeight }}px)
						</h4>
						<div
							v-if="isPreviewLoading"
							class="w-full max-w-sm bg-neutral-200/10 border-neutral-200/10 border-dashed border-2 rounded-md shadow-md flex items-center justify-center"
							:style="{ aspectRatio: `${imageWidth}/${imageHeight}` }"
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
							class="w-full max-w-sm rounded-md shadow-md bg-neutral-200/10"
							style="image-rendering: pixelated"
						/>
						<div
							v-else
							class="w-full bg-neutral-200/10 border-neutral-200/10 border-dashed border-2 rounded-md shadow-md"
							:style="{ aspectRatio: `${imageWidth}/${imageHeight}` }"
						>
							<div class="flex items-center justify-center h-full">
								<UIcon name="i-lucide-eye" class="text-neutral-400" />
							</div>
						</div>
					</div>
				</div>

				<!-- Action button -->
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
		</div>
		<div class="flex flex-col gap-2 text-text text-sm max-w-[50ch] w-fit">
			<p>
				Select the size of the grid you want to use for your custom graphics.
			</p>
			<p>
				A grid of height 1 can be up to 12 characters wide, height 2 can be up
				to 5 characters wide, and height 3 can be up to 3 characters wide. When
				using height 3, the bottom row will use the crosshair characters.
			</p>
			<p>
				Download the template to use in your favorite image editor, or upload an
				image directly here. The image will be automatically resized to fit the
				grid dimensions and split into individual characters to be used as craft
				and pilot names.
			</p>
			<p>
				Craft name is the top row of the grid. For height 2, pilot name is the
				bottom row. For height 3, pilot name is the middle row and the crosshair
				characters are used for the bottom row.
			</p>
		</div>
	</div>
</template>
