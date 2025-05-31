<script setup lang="ts">
import { useFontStore } from "../../stores/fontStore"

const fontStore = useFontStore()
const isExportingMcm = ref(false)
const isExportingHeader = ref(false)
const exportError = ref<Error | null>(null)

const selectedPort = ref<SerialPort | null>(null)
const availablePorts = ref<SerialPort[]>([])
const isUploading = ref(false)
const uploadStatus = ref<string | null>(null)

async function refreshPorts() {
    try {
        const ports = await navigator.serial.getPorts()
        availablePorts.value = ports
        if (ports.length > 0) {
        selectedPort.value = ports[0]
        }
    } catch {
        availablePorts.value = []
    }
}

async function requestPort() {
    try {
        const port = await navigator.serial.requestPort()
        availablePorts.value.push(port)
        selectedPort.value = port
    } catch (err) {
        console.warn("Serial port selection cancelled or failed", err)
    }
}

onMounted(() => {
    refreshPorts()
})

async function uploadToDevice() {
    if (!selectedPort.value) {
        uploadStatus.value = "Please select a serial port first."
        return
    }
    if (!fontStore.hasData) {
        uploadStatus.value = "No font data to upload."
        return
    }

    isUploading.value = true
    uploadStatus.value = "Uploading..."

    try {
        // Request backend for ready MSP packets (base64)
        const response = await fetch("/api/json-to-msp-packets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fontData: {
            metadata: fontStore.metadata || "MAX7456",
            characterCount: fontStore.characterCount || 256,
            characters: fontStore.characters
        }})
        })

        if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        if (!result.success) {
        throw new Error(result.error || "Unknown error")
        }

        await selectedPort.value.open({ baudRate: 115200 })

        const writer = selectedPort.value.writable.getWriter()

        const total = result.packets.length
        for (let i = 0; i < total; i++) {
            uploadStatus.value = `${i + 1}/${total}`
            const packet = Uint8Array.from(atob(result.packets[i]), c => c.charCodeAt(0))
            await writer.write(packet)
            await new Promise(r => setTimeout(r, 60))
        }

        writer.releaseLock()
        await selectedPort.value.close()

        uploadStatus.value = "Upload successful!"
    } catch (error) {
        uploadStatus.value = "Upload failed: " + (error instanceof Error ? error.message : String(error))
    } finally {
        isUploading.value = false
    }
}

// Function to export the current font data as an MCM file
async function exportToMcm() {
	if (!fontStore.hasData) {
		return
	}

	try {
		isExportingMcm.value = true
		exportError.value = null

		// Prepare font data for export
		const jsonData = {
			metadata: fontStore.metadata || "MAX7456",
			characterCount: fontStore.characterCount || 256,
			characters: fontStore.characters
		}

		// Call the API to convert JSON to MCM format
		const response = await fetch("/api/json-to-mcm", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ jsonData })
		})

		if (!response.ok) {
			throw new Error(
				`Server returned ${response.status}: ${response.statusText}`
			)
		}

		const result = await response.json()

		if (!result.success) {
			throw new Error(result.error || "Unknown error occurred during export")
		}

		// Create a download link for the MCM file
		const blob = new Blob([result.data], { type: "text/plain" })
		const url = window.URL.createObjectURL(blob)

		// Create and trigger a download link
		const link = document.createElement("a")
		link.href = url
		link.download = "exported-font.mcm"
		document.body.appendChild(link)
		link.click()

		// Clean up
		document.body.removeChild(link)
		window.URL.revokeObjectURL(url)

		console.log("Font exported successfully!", result.timing)
	} catch (error) {
		console.error("Error exporting font:", error)
		exportError.value =
			error instanceof Error ? error : new Error(String(error))
	} finally {
		isExportingMcm.value = false
	}
}

// Function to export the current font data as a C header file
async function exportToHeader() {
	if (!fontStore.hasData) {
		return
	}

	try {
		isExportingHeader.value = true
		exportError.value = null

		// Prepare font data for export
		const fontData = {
			metadata: fontStore.metadata || "MAX7456",
			characterCount: fontStore.characterCount || 256,
			characters: fontStore.characters
		}

		// Call the API to convert JSON to header format
		const response = await fetch("/api/json-to-header", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ fontData })
		})

		if (!response.ok) {
			throw new Error(
				`Server returned ${response.status}: ${response.statusText}`
			)
		}

		const result = await response.json()

		if (!result.success) {
			throw new Error(result.error || "Unknown error occurred during export")
		}

		// Create a download link for the header file
		const blob = new Blob([result.data.headerContent], { type: "text/plain" })
		const url = window.URL.createObjectURL(blob)

		// Create and trigger a download link
		const link = document.createElement("a")
		link.href = url
		link.download = result.data.filename || "exported-font.h"
		document.body.appendChild(link)
		link.click()

		// Clean up
		document.body.removeChild(link)
		window.URL.revokeObjectURL(url)

		console.log("Header exported successfully!", result.timing)
	} catch (error) {
		console.error("Error exporting header:", error)
		exportError.value =
			error instanceof Error ? error : new Error(String(error))
	} finally {
		isExportingHeader.value = false
	}
}
</script>

<template>
	<div class="flex gap-4">
		<UButton
			:loading="isExportingMcm"
			:disabled="!fontStore.hasData || isExportingMcm || isExportingHeader || isUploading"
			color="primary"
			icon="i-heroicons-arrow-down-tray"
			variant="soft"ґґ
			@click="exportToMcm"
		>
			Export MCM
		</UButton>

		<UButton
			:loading="isExportingHeader"
			:disabled="!fontStore.hasData || isExportingMcm || isExportingHeader || isUploading"
			color="primary"
			icon="i-lucide-file-code"
			variant="soft"
			@click="exportToHeader"
		>
			Export Header
		</UButton>

        <!-- Open Serial Port Button -->
        <UButton
            color="primary"
            variant="soft"
            icon="i-lucide-plug"
            @click="requestPort"
        >
            Open Serial Port
        </UButton>

        <!--
        <select v-model="selectedPort" class="bg-zinc-800 text-white rounded px-2 py-1 text-sm">
            <option disabled value="">Open Serial Port</option>
            <option v-for="port in availablePorts" :key="port" :value="port">
            {{ port.getInfo().usbProductId || "Serial Port" }}
            </option>
        </select>
        -->

        <!-- Upload button -->
        <UButton
            :loading="isUploading"
            :disabled="!selectedPort || !fontStore.hasData || isExportingMcm || isExportingHeader"
            color="secondary"
            icon="i-heroicons-arrow-up"
            variant="soft"
            @click="uploadToDevice"
        >
            Upload to device
        </UButton>

        <p v-if="uploadStatus" class="text-green-500 text-xs mt-2 leading-tight">
            {{ uploadStatus }}
        </p>

		<p v-if="exportError" class="text-red-500 text-sm mt-2">
			{{ exportError.message }}
		</p>
	</div>
</template>
