import { defineEventHandler, readBody } from "h3"
import sharp from "sharp"
import bmp from "sharp-bmp"

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
 * @param isBmp Whether the image is a BMP file
 * @param width Target width for the processed image (default: 288)
 * @param height Target height for the processed image (default: 72)
 * @param tileWidth Width of each tile (default: 12)
 * @param tileHeight Height of each tile (default: 18)
 * @returns Array of tiles representing the processed image
 */
async function processImageToTiles(
	imageBuffer: Buffer,
	isBmp: boolean = false,
	width: number = 288,
	height: number = 72,
	tileWidth: number = 12,
	tileHeight: number = 18
): Promise<McmCharacter[]> {
	try {
		let sharpInstance: sharp.Sharp

		if (isBmp) {
			// Use sharp-bmp to decode BMP files
			const bmpResult = bmp.sharpFromBmp(imageBuffer)
			// Ensure we have a Sharp instance (sharpFromBmp returns Sharp for buffer input)
			sharpInstance = bmpResult as sharp.Sharp
		} else {
			// Use regular sharp for other formats
			sharpInstance = sharp(imageBuffer)
		}

		// Resize image to fit within specified dimensions while preserving aspect ratio
		// and center it with transparent background
		const processedImage = await sharpInstance
			.resize(width, height, {
				fit: "contain", // Preserve aspect ratio, fit within dimensions
				background: { r: 128, g: 128, b: 128, alpha: 0 }, // Transparent gray background
				position: "center" // Center the image
			})
			.ensureAlpha() // Ensure we have alpha channel for transparency
			.raw() // Get raw pixel data
			.toBuffer({ resolveWithObject: true })

		const { data, info } = processedImage
		const { width: actualWidth, height: actualHeight, channels } = info

		// Convert the raw pixel data to our tile format
		const tiles: McmCharacter[] = []

		// Calculate tiles dynamically based on dimensions
		const tilesWide = Math.floor(actualWidth / tileWidth)
		const tilesHigh = Math.floor(actualHeight / tileHeight)

		for (let tileY = 0; tileY < tilesHigh; tileY++) {
			for (let tileX = 0; tileX < tilesWide; tileX++) {
				const tileIndex = tileY * tilesWide + tileX
				const pixels: number[][] = Array(tileHeight)
					.fill(0)
					.map(() => Array(tileWidth).fill(1))

				// Process each pixel in this tile
				for (let y = 0; y < tileHeight; y++) {
					for (let x = 0; x < tileWidth; x++) {
						// Calculate the actual pixel position in the source image
						const sourceX = tileX * tileWidth + x
						const sourceY = tileY * tileHeight + y

						// Skip if we're outside the actual image bounds
						if (sourceX >= actualWidth || sourceY >= actualHeight) {
							pixels[y][x] = 1 // Transparent
							continue
						}

						// Calculate the pixel index in the raw data buffer
						const pixelIndex = (sourceY * actualWidth + sourceX) * channels

						// Get RGBA values (now we ensure alpha channel exists)
						const r = data[pixelIndex]
						const g = data[pixelIndex + 1]
						const b = data[pixelIndex + 2]
						const a = channels > 3 ? data[pixelIndex + 3] : 255

						// If pixel is transparent or semi-transparent, make it transparent
						if (a < 128) {
							pixels[y][x] = 1 // Transparent
							continue
						}

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
					index: 160 + tileIndex, // Start at position 160 for logo functionality
					width: tileWidth,
					height: tileHeight,
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

		// Extract dimensions from request body, default to 288x72 for logo functionality
		const width = body.width || 288
		const height = body.height || 72
		const tileWidth = body.tileWidth || 12
		const tileHeight = body.tileHeight || 18

		// Validate dimensions
		if (
			typeof width !== "number" ||
			typeof height !== "number" ||
			typeof tileWidth !== "number" ||
			typeof tileHeight !== "number" ||
			width <= 0 ||
			height <= 0 ||
			tileWidth <= 0 ||
			tileHeight <= 0 ||
			width > 4096 ||
			height > 4096 ||
			tileWidth > 256 ||
			tileHeight > 256
		) {
			return {
				success: false,
				error:
					"Invalid dimensions. All dimensions must be positive numbers within reasonable limits"
			}
		}

		// Validate that dimensions are divisible by tile dimensions for optimal results
		if (width % tileWidth !== 0 || height % tileHeight !== 0) {
			console.warn(
				`Warning: Image dimensions (${width}x${height}) are not evenly divisible by tile dimensions (${tileWidth}x${tileHeight}). Some pixels may be lost.`
			)
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

		// Detect if the file is a BMP by checking the file signature
		const isBmp =
			imageBuffer.length >= 2 &&
			imageBuffer[0] === 0x42 &&
			imageBuffer[1] === 0x4d // "BM" signature for BMP files

		// Process the image into tiles
		const processingStartTime = performance.now()
		const imageTiles = await processImageToTiles(
			imageBuffer,
			isBmp,
			width,
			height,
			tileWidth,
			tileHeight
		)
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
		// Note: This assumes logo functionality starting at position 160
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
			processedDimensions: { width, height },
			tileDimensions: { width: tileWidth, height: tileHeight },
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
