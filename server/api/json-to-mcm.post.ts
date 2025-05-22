import { defineEventHandler, readBody } from "h3"

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
 * Converts JSON font data back to MCM format
 * MCM files contain font data for MAX7456 on-screen displays
 * Each character is a 12x18 pixel grid where each pixel is represented by 2 bits
 * 00 = black, 10 = white, 11 = gray, 01 = transparent
 *
 * @param jsonData The JSON data structure containing font data
 * @returns MCM file content as a string or null if conversion failed
 */
function convertJsonToMcm(jsonData: McmData): string | null {
	try {
		// Validate the input data
		if (
			!jsonData.metadata ||
			!jsonData.characters ||
			!Array.isArray(jsonData.characters)
		) {
			console.error("Error: Invalid JSON data structure")
			return null
		}

		// Start with the metadata line
		let mcmContent = "MAX7456\n"

		// Process each character
		const characterCount = 256 // MCM files require exactly 256 characters

		for (let charIndex = 0; charIndex < characterCount; charIndex++) {
			// Find the character in our data or create an empty one
			const character = jsonData.characters.find(
				(c) => c.index === charIndex
			) || {
				index: charIndex,
				width: 12,
				height: 18,
				pixels: Array(18)
					.fill(0)
					.map(() => Array(12).fill(1)) // Fill with transparent pixels (01)
			}

			// Each character in MCM format needs 64 lines of data
			// We'll use the first 54 for the actual pixel data (54 bytes = 216 pixels)
			// and fill the rest with empty lines

			// Process pixel data into bytes
			const bytesNeeded = Math.ceil((12 * 18) / 4) // = 54 bytes for 12x18 pixels with 4 pixels per byte

			for (let byteIndex = 0; byteIndex < bytesNeeded; byteIndex++) {
				// Calculate row and starting column for this byte
				const row = Math.floor(byteIndex / 3) // 3 bytes per row (12 pixels ÷ 4 pixels per byte)
				const columnStart = (byteIndex % 3) * 4 // Each byte represents 4 pixels

				let byte = ""

				// Process 4 pixels (2 bits each) for this byte
				for (let pixelIndex = 0; pixelIndex < 4; pixelIndex++) {
					const column = columnStart + pixelIndex

					if (column < 12 && row < 18) {
						// Get the pixel value (0-3) and convert to 2-bit binary
						const pixelValue = character.pixels?.[row]?.[column] ?? 1 // Default to transparent (01)
						const bitPair = pixelValue.toString(2).padStart(2, "0")
						byte += bitPair
					} else {
						// If we're out of bounds, use transparent (01)
						byte += "01"
					}
				}

				// Add this byte to the MCM content
				mcmContent += byte + "\n"
			}

			// Fill the remaining 10 lines with zeros to match the 64-line format
			for (let i = bytesNeeded; i < 64; i++) {
				mcmContent += "00000000\n"
			}
		}

		return mcmContent
	} catch (error) {
		console.error(`An error occurred: ${error}`)
		return null
	}
}

export default defineEventHandler(async (event) => {
	try {
		const startTime = performance.now()
		// Get the JSON data from the request body
		const body = await readBody(event)

		if (!body.jsonData) {
			return {
				success: false,
				error: "Missing jsonData in request body"
			}
		}

		const jsonData = body.jsonData

		const conversionStartTime = performance.now()
		const mcmContent = convertJsonToMcm(jsonData)
		const conversionEndTime = performance.now()
		const conversionTime = conversionEndTime - conversionStartTime

		if (!mcmContent) {
			return {
				success: false,
				error: "Failed to convert JSON to MCM format"
			}
		}

		const endTime = performance.now()
		const totalTime = endTime - startTime

		// Return the MCM content
		return {
			success: true,
			data: mcmContent,
			timing: {
				totalTimeMs: totalTime,
				conversionTimeMs: conversionTime
			}
		}
	} catch (error) {
		console.error("Error processing JSON to MCM conversion:", error)
		return {
			success: false,
			error: "Internal server error"
		}
	}
})
