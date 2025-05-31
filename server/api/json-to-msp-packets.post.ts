import { defineEventHandler, readBody } from "h3"

interface FontCharacter {
    index: number
    pixels: number[][]
}

interface FontData {
    metadata: string
    characterCount: number
    characters: FontCharacter[]
}

function pixelsToBytes(pixels: number[][]): number[] {
    const bytes: number[] = []
    for (let row = 0; row < 18; row++) {
        for (let col = 0; col < 12; col += 4) {
        let byte = 0
        for (let i = 0; i < 4; i++) {
            const pixelCol = col + i
            let pixelValue = 0
            if (pixels[row] && pixels[row][pixelCol] !== undefined) {
            pixelValue = pixels[row][pixelCol] & 0x3
            }
            byte |= pixelValue << (6 - i * 2)
        }
        bytes.push(byte)
        }
    }
    while (bytes.length < 64) {
        bytes.push(0x55)
    }
    return bytes
}

function buildMspOsdCharWritePacket(symbolIndex: number, data: number[]): number[] {
    const HEADER = [0x24, 0x4D, 0x3C] // MSP v1 header $M<
    const MSP_OSD_CHAR_WRITE = 87
    const length = 1 + data.length

    const packet = new Array(6 + length).fill(0)
    packet[0] = HEADER[0]
    packet[1] = HEADER[1]
    packet[2] = HEADER[2]
    packet[3] = length
    packet[4] = MSP_OSD_CHAR_WRITE
    packet[5] = symbolIndex

    for (let i = 0; i < data.length; i++) {
        packet[6 + i] = data[i]
    }

    let checksum = 0
    for (let i = 3; i < 6 + length - 1; i++) {
        checksum ^= packet[i]
    }
    packet[6 + length - 1] = checksum

    return packet
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    if (!body.fontData) {
        return { success: false, error: "Missing fontData" }
    }

    const fontData: FontData = body.fontData

    const packets: number[][] = []

    for (let i = 0; i < 256; i++) {
        const char = fontData.characters.find((c) => c.index === i)
        let bytes: number[]
        if (char) {
            bytes = pixelsToBytes(char.pixels)
        } else {
            bytes = new Array(64).fill(0x55)
        }

        const packet = buildMspOsdCharWritePacket(i, bytes)
        packets.push(packet)
    }

    // Return as base64 (or just an array of byte arrays)
    return {
        success: true,
        packets: packets.map((p) => Buffer.from(p).toString("base64"))
    }
})
