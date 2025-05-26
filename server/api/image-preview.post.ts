import { defineEventHandler, readBody, setHeader, createError } from "h3"
import sharp from "sharp"

/**
 * Processes an image for preview, showing how it will look after transformation
 * @param imageBuffer The image buffer to process
 * @returns Processed image buffer ready for display
 */
async function processImageForPreview(imageBuffer: Buffer): Promise<Buffer> {
	try {
		// First, resize image to fit within 288x72 pixels while preserving aspect ratio
		const resizedImage = await sharp(imageBuffer)
			.resize(288, 72, {
				fit: "contain", // Preserve aspect ratio, fit within dimensions
				background: { r: 128, g: 128, b: 128, alpha: 0 }, // Transparent gray background
				position: "center" // Center the image
			})
			.ensureAlpha() // Ensure we have alpha channel for transparency
			.raw() // Get raw pixel data
			.toBuffer({ resolveWithObject: true })

		const { data, info } = resizedImage
		const { width, height, channels } = info

		// Create a new buffer for the processed image
		const processedData = Buffer.alloc(width * height * 4) // RGBA

		// Process each pixel to show the transformation
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const inputIndex = (y * width + x) * channels
				const outputIndex = (y * width + x) * 4

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
				width,
				height,
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

		// Process the image for preview
		const previewBuffer = await processImageForPreview(imageBuffer)
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
