import { defineEventHandler, readBody } from "h3"
import sharp from "sharp"

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

/**
 * Processes an image using Sharp and converts it to font tiles
 * @param imageBuffer The image buffer to process
 * @returns Array of 96 tiles (12x18 pixels each) representing the processed image
 */
async function processImageToTiles(
	imageBuffer: Buffer
): Promise<McmCharacter[]> {
	try {
		// Resize image to exactly 288x72 pixels using Sharp
		const processedImage = await sharp(imageBuffer)
			.resize(288, 72, {
				fit: "fill", // Stretch to exact dimensions
				kernel: "nearest" // Use nearest neighbor for pixel art
			})
			.raw() // Get raw pixel data
			.toBuffer({ resolveWithObject: true })

		const { data, info } = processedImage
		const { width, height, channels } = info

		// Convert the raw pixel data to our tile format
		const tiles: McmCharacter[] = []

		// Calculate tiles (24 wide x 4 high = 96 tiles total)
		const tilesWide = Math.floor(width / 12) // 288 / 12 = 24
		const tilesHigh = Math.floor(height / 18) // 72 / 18 = 4

		for (let tileY = 0; tileY < tilesHigh; tileY++) {
			for (let tileX = 0; tileX < tilesWide; tileX++) {
				const tileIndex = tileY * tilesWide + tileX
				const pixels: number[][] = Array(18)
					.fill(0)
					.map(() => Array(12).fill(1))

				// Process each pixel in this 12x18 tile
				for (let y = 0; y < 18; y++) {
					for (let x = 0; x < 12; x++) {
						// Calculate the actual pixel position in the source image
						const sourceX = tileX * 12 + x
						const sourceY = tileY * 18 + y

						// Calculate the pixel index in the raw data buffer
						const pixelIndex = (sourceY * width + sourceX) * channels

						// Get RGB values (assuming RGB or RGBA)
						const r = data[pixelIndex]
						const g = data[pixelIndex + 1]
						const b = data[pixelIndex + 2]

						// Convert to grayscale using luminance formula
						const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)

						// Convert to our pixel format:
						// 0 = black, 2 = white, 1 = transparent (for anything else)
						let pixelValue: number
						if (gray < 85) {
							pixelValue = 0 // Black
						} else if (gray > 170) {
							pixelValue = 2 // White
						} else {
							pixelValue = 1 // Transparent (for gray values in between)
						}

						pixels[y][x] = pixelValue
					}
				}

				tiles.push({
					index: 160 + tileIndex, // Start at position 160
					width: 12,
					height: 18,
					pixels
				})
			}
		}

		return tiles
	} catch (error) {
		console.error("Error processing image:", error)
		throw new Error("Failed to process image")
	}
}

export default defineEventHandler(async (event) => {
	try {
		const startTime = performance.now()

		// Get the request body containing the image data and existing font data
		const body = await readBody(event)

		if (!body.imageData || !body.fontData) {
			return {
				success: false,
				error: "Missing imageData or fontData in request body"
			}
		}

		// Convert base64 image data to buffer
		let imageBuffer: Buffer
		try {
			// Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
			const base64Data = body.imageData.replace(
				/^data:image\/[a-z]+;base64,/,
				""
			)
			imageBuffer = Buffer.from(base64Data, "base64")
		} catch (error) {
			return {
				success: false,
				error: "Invalid image data format: " + error
			}
		}

		// Process the image into tiles
		const processingStartTime = performance.now()
		const imageTiles = await processImageToTiles(imageBuffer)
		const processingEndTime = performance.now()

		// Create updated font data
		const updatedFontData: McmData = {
			metadata: body.fontData.metadata || "MAX7456",
			characterCount: 256,
			characters: [...body.fontData.characters]
		}

		// Ensure we have 256 characters, filling empty ones if needed
		while (updatedFontData.characters.length < 256) {
			updatedFontData.characters.push({
				index: updatedFontData.characters.length,
				width: 12,
				height: 18,
				pixels: Array(18)
					.fill(0)
					.map(() => Array(12).fill(1)) // Transparent
			})
		}

		// Replace characters 160-255 with the image tiles
		for (const tile of imageTiles) {
			if (tile.index >= 160 && tile.index < 256) {
				updatedFontData.characters[tile.index] = tile
			}
		}

		const endTime = performance.now()

		return {
			success: true,
			data: updatedFontData,
			tilesAdded: imageTiles.length,
			timing: {
				totalTimeMs: endTime - startTime,
				processingTimeMs: processingEndTime - processingStartTime
			}
		}
	} catch (error) {
		console.error("Error in image-to-font endpoint:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "Internal server error"
		}
	}
})
