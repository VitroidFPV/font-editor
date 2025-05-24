import { defineEventHandler, readBody } from "h3"

interface FontCharacter {
	index: number
	width: number
	height: number
	pixels: number[][]
}

interface FontData {
	metadata: string
	characterCount: number
	characters: FontCharacter[]
}

/**
 * Converts pixel data to byte array following MAX7456 format
 * Each pixel is 2 bits: 00 = black, 01 = transparent, 10 = white, 11 = gray
 * 4 pixels per byte, 12x18 = 216 pixels = 54 bytes per character
 * But we pad to 64 bytes per character in the array
 */
function pixelsToBytes(pixels: number[][]): number[] {
	const bytes: number[] = []

	// Process 12x18 pixel grid
	for (let row = 0; row < 18; row++) {
		for (let col = 0; col < 12; col += 4) {
			let byte = 0

			// Pack 4 pixels into one byte (2 bits per pixel)
			for (let pixelInByte = 0; pixelInByte < 4; pixelInByte++) {
				const pixelCol = col + pixelInByte
				let pixelValue = 0

				if (
					pixelCol < 12 &&
					row < pixels.length &&
					pixelCol < pixels[row].length
				) {
					pixelValue = pixels[row][pixelCol] & 0x3 // Ensure 2-bit value
				}

				// Shift the pixel value to its position in the byte
				byte |= pixelValue << (6 - pixelInByte * 2)
			}

			bytes.push(byte)
		}
	}

	// Pad to 64 bytes per character (MAX7456 format)
	while (bytes.length < 64) {
		bytes.push(0x55) // Fill with 0x55 (default/empty pattern)
	}

	return bytes
}

/**
 * Formats a byte array as C-style hex values
 */
function formatBytesAsHex(
	bytes: number[],
	charactersPerLine: number = 16
): string {
	const hexValues: string[] = []

	for (let i = 0; i < bytes.length; i++) {
		hexValues.push(`0x${bytes[i].toString(16).padStart(2, "0").toUpperCase()}`)
	}

	// Split into lines
	const lines: string[] = []
	for (let i = 0; i < hexValues.length; i += charactersPerLine) {
		const lineValues = hexValues.slice(i, i + charactersPerLine)
		const line = "    " + lineValues.join(", ")
		lines.push(line + (i + charactersPerLine < hexValues.length ? "," : ""))
	}

	return lines.join("\n")
}

/**
 * Converts JSON font data to C header file format
 */
function jsonToHeader(fontData: FontData): string {
	const lines: string[] = []

	// Header
	lines.push("#pragma once")
	lines.push("#include <stdint.h>")
	lines.push("")
	lines.push('__attribute__((section(".font")))')
	lines.push("const uint8_t font_data[16384] = {")

	// Process each character
	for (let i = 0; i < 256; i++) {
		const character = fontData.characters.find((char) => char.index === i)

		let bytes: number[]
		if (character) {
			bytes = pixelsToBytes(character.pixels)
		} else {
			// Fill with default pattern for missing characters
			bytes = new Array(64).fill(0x55)
		}

		// Character comment
		lines.push(
			`/* Character 0x${i.toString(16).padStart(2, "0").toUpperCase()} */`
		)

		// Format byte data
		const hexData = formatBytesAsHex(bytes)
		lines.push(hexData + (i < 255 ? "," : ""))
		lines.push("")
	}

	// Footer
	lines.push("};")

	return lines.join("\n")
}

export default defineEventHandler(async (event) => {
	try {
		const startTime = performance.now()

		// Get the JSON font data from the request body
		const body = await readBody(event)

		if (!body.fontData) {
			return {
				success: false,
				error: "Missing fontData in request body"
			}
		}

		const fontData = body.fontData as FontData

		// Validate the font data structure
		if (!fontData.characters || !Array.isArray(fontData.characters)) {
			return {
				success: false,
				error: "Invalid font data: missing or invalid characters array"
			}
		}

		const conversionStartTime = performance.now()
		const headerContent = jsonToHeader(fontData)
		const conversionEndTime = performance.now()
		const conversionTime = conversionEndTime - conversionStartTime

		const endTime = performance.now()
		const totalTime = endTime - startTime

		// Return the header file content
		return {
			success: true,
			data: {
				headerContent,
				filename: "font.h",
				characterCount: fontData.characterCount
			},
			timing: {
				totalTimeMs: totalTime,
				conversionTimeMs: conversionTime
			}
		}
	} catch (error) {
		console.error("Error processing JSON to header conversion:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "Internal server error"
		}
	}
})
