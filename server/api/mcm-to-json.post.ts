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
 * Parses MCM font data into a JSON structure
 * MCM files contain font data for MAX7456 on-screen displays
 * Each character is a 12x18 pixel grid where each pixel is represented by 2 bits
 * 00 = black, 10 = white, X1 = transparent (X can be 0 or 1)
 *
 * @param mcmContent String content of the MCM file
 * @returns The parsed data or null if parsing failed
 */
function parseMcmToJson(mcmContent: string): McmData | null {
	try {
		const lines = mcmContent.split(/\r?\n/)

		// Check if the file has the expected format (1 metadata line + 16384 data lines)
		if (lines.length < 16385) {
			console.error(
				`Error: Content contains ${lines.length} lines, but 16385 are expected (1 metadata + 16384 data).`
			)
			return null
		}

		// Check if the first line is "MAX7456"
		const metadataLine = lines[0]?.trim() || ""
		if (metadataLine !== "MAX7456") {
			console.error(
				`Error: First line does not match 'MAX7456'. Found: '${metadataLine}'`
			)
			return null
		}

		// Skip the first line (metadata) and process the data lines
		const dataLines = lines.slice(1, 16385) // Take exactly 16384 lines

		// Process the binary data into characters
		// Each character is 12x18 pixels (216 pixels total)
		// Each byte contains 4 pixels (2 bits per pixel), so we need 54 bytes per character (216/4)
		const characterCount = 256 // MCM files contain 256 characters
		const characters: McmCharacter[] = []

		for (let charIndex = 0; charIndex < characterCount; charIndex++) {
			// For each character, we have 54 lines (bytes) of data
			const charStartLine = charIndex * 64 // Still 64 lines reserved per character in the file
			const charDataLines = dataLines.slice(charStartLine, charStartLine + 64)

			// Initialize a 12x18 pixel grid for this character
			const pixelGrid: number[][] = Array(18)
				.fill(0)
				.map(() => Array(12).fill(0))

			// Process each byte (line) for this character
			// We only need to process 54 bytes (lines) for each character
			const bytesNeeded = Math.ceil((12 * 18) / 4) // = 54 bytes for 12x18 pixels with 4 pixels per byte

			for (let byteIndex = 0; byteIndex < bytesNeeded; byteIndex++) {
				const byteStr = charDataLines[byteIndex]?.trim() || ""

				// Check if the line is a valid 8-bit binary number
				if (byteStr.length === 8 && /^[01]+$/.test(byteStr)) {
					// For every byte, we have 4 pixels (2 bits per pixel)
					// We need to determine which row and column this belongs to
					const row = Math.floor(byteIndex / 3) // 3 bytes per row (12 pixels ÷ 4 pixels per byte)
					const columnStart = (byteIndex % 3) * 4 // Each byte represents 4 pixels

					// Process each pair of bits as one pixel
					for (let bitPairIndex = 0; bitPairIndex < 4; bitPairIndex++) {
						// Skip the last bit pair if we're already at the end of the row
						if (columnStart + bitPairIndex >= 12) break

						// Extract the 2-bit value for this pixel
						const bitPairPos = bitPairIndex * 2
						const bitPair = byteStr.substring(bitPairPos, bitPairPos + 2)

						// Convert binary to decimal (0-3)
						const pixelValue = parseInt(bitPair, 2)

						// Store the pixel value in the grid if it's a valid position
						if (row < 18 && columnStart + bitPairIndex < 12) {
							pixelGrid[row][columnStart + bitPairIndex] = pixelValue
						}
					}
				} else {
					console.error(
						`Error: Invalid byte format '${byteStr}' on line ${charStartLine + byteIndex + 2}`
					)
					return null
				}
			}

			// Add this character to our result
			characters.push({
				index: charIndex,
				width: 12,
				height: 18,
				pixels: pixelGrid
			})
		}

		return {
			metadata: metadataLine,
			characterCount,
			characters
		}
	} catch (error) {
		console.error(`An error occurred: ${error}`)
		return null
	}
}

export default defineEventHandler(async (event) => {
	try {
		// Get the MCM content from the request body
		const body = await readBody(event)

		if (!body.mcmContent || typeof body.mcmContent !== "string") {
			return {
				success: false,
				error: "Missing or invalid mcmContent in request body"
			}
		}

		const mcmContent = body.mcmContent
		const mcmData = parseMcmToJson(mcmContent)

		if (!mcmData) {
			return {
				success: false,
				error: "Failed to parse MCM content"
			}
		}

		// Return the parsed MCM data
		return {
			success: true,
			data: mcmData
		}
	} catch (error) {
		console.error("Error processing MCM to JSON conversion:", error)
		return {
			success: false,
			error: "Internal server error"
		}
	}
})
