import { defineEventHandler, readBody, setHeader, createError } from "h3"
import sharp from "sharp"
import bmp from "sharp-bmp"

/**
 * Processes an image for preview, showing how it will look after transformation
 * @param imageBuffer The image buffer to process
 * @param isBmp Whether the image is a BMP file
 * @param width Target width for the processed image (default: 288)
 * @param height Target height for the processed image (default: 72)
 * @returns Processed image buffer ready for display
 */
async function processImageForPreview(
	imageBuffer: Buffer,
	isBmp: boolean = false,
	width: number = 288,
	height: number = 72
): Promise<Buffer> {
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

		// First, resize image to fit within specified dimensions while preserving aspect ratio
		const resizedImage = await sharpInstance
			.resize(width, height, {
				fit: "contain", // Preserve aspect ratio, fit within dimensions
				background: { r: 128, g: 128, b: 128, alpha: 0 }, // Transparent gray background
				position: "center" // Center the image
			})
			.ensureAlpha() // Ensure we have alpha channel for transparency
			.raw() // Get raw pixel data
			.toBuffer({ resolveWithObject: true })

		const { data, info } = resizedImage
		const { width: actualWidth, height: actualHeight, channels } = info

		// Create a new buffer for the processed image
		const processedData = Buffer.alloc(actualWidth * actualHeight * 4) // RGBA

		// Process each pixel to show the transformation
		for (let y = 0; y < actualHeight; y++) {
			for (let x = 0; x < actualWidth; x++) {
				const inputIndex = (y * actualWidth + x) * channels
				const outputIndex = (y * actualWidth + x) * 4

				// Get RGBA values from input
				const r = data[inputIndex]
				const g = data[inputIndex + 1]
				const b = data[inputIndex + 2]
				const a = channels > 3 ? data[inputIndex + 3] : 255

				let outputR = 0,
					outputG = 0,
					outputB = 0,
					outputA = 255

				// If pixel is transparent or semi-transparent, make it transparent
				if (a < 128) {
					outputR = outputG = outputB = 0
					outputA = 0 // Fully transparent
				} else {
					// Convert to grayscale using luminance formula
					const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)

					// Convert to our pixel format and assign preview colors:
					// 0 = black, 2 = white, 1 = transparent (for anything else)
					if (gray < 85) {
						// Black pixels
						outputR = outputG = outputB = 0
						outputA = 255
					} else if (gray > 170) {
						// White pixels
						outputR = outputG = outputB = 255
						outputA = 255
					} else {
						// Gray values become transparent
						outputR = outputG = outputB = 0
						outputA = 0
					}
				}

				// Write the processed pixel
				processedData[outputIndex] = outputR
				processedData[outputIndex + 1] = outputG
				processedData[outputIndex + 2] = outputB
				processedData[outputIndex + 3] = outputA
			}
		}

		// Convert back to PNG for display
		const previewBuffer = await sharp(processedData, {
			raw: {
				width: actualWidth,
				height: actualHeight,
				channels: 4
			}
		})
			.png()
			.toBuffer()

		return previewBuffer
	} catch (error) {
		console.error("Error processing image for preview:", error)
		throw new Error("Failed to process image for preview")
	}
}

export default defineEventHandler(async (event) => {
	try {
		const startTime = performance.now()

		// Get the image data from the request body
		const body = await readBody(event)

		if (!body.imageData) {
			throw createError({
				statusCode: 400,
				statusMessage: "Missing imageData in request body"
			})
		}

		// Extract dimensions from request body, default to 288x72 for logo functionality
		const width = body.width || 288
		const height = body.height || 72

		// Validate dimensions
		if (
			typeof width !== "number" ||
			typeof height !== "number" ||
			width <= 0 ||
			height <= 0 ||
			width > 4096 ||
			height > 4096
		) {
			throw createError({
				statusCode: 400,
				statusMessage:
					"Invalid dimensions. Width and height must be positive numbers <= 4096"
			})
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
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid image data format"
			})
		}

		// Detect if the file is a BMP by checking the file signature
		const isBmp =
			imageBuffer.length >= 2 &&
			imageBuffer[0] === 0x42 &&
			imageBuffer[1] === 0x4d // "BM" signature for BMP files

		// Process the image for preview
		const previewBuffer = await processImageForPreview(
			imageBuffer,
			isBmp,
			width,
			height
		)
		const endTime = performance.now()

		// Set appropriate headers for image response
		setHeader(event, "Content-Type", "image/png")
		setHeader(event, "Content-Length", previewBuffer.length)
		setHeader(event, "Cache-Control", "no-cache")
		setHeader(
			event,
			"X-Processing-Time",
			`${(endTime - startTime).toFixed(2)}ms`
		)
		setHeader(event, "X-Processed-Dimensions", `${width}x${height}`)

		return previewBuffer
	} catch (error) {
		console.error("Error in image-preview endpoint:", error)
		throw createError({
			statusCode: 500,
			statusMessage:
				error instanceof Error ? error.message : "Internal server error"
		})
	}
})
