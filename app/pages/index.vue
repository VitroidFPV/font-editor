<script setup lang="ts">
import { useFontStore } from "~~/stores/fontStore"
import { usePaletteStore } from "~~/stores/paletteStore"

const fontStore = useFontStore()
const paletteStore = usePaletteStore()

const showGrid = ref(true)
const showTooltip = ref(true)

const handleScroll = (event: Event) => {
	// Prevent default scroll behavior
	event.preventDefault()

	// Get scroll direction and update index accordingly
	if (event instanceof WheelEvent) {
		if (event.deltaY > 0 && fontStore.selectedCharacterIndex > 0) {
			fontStore.selectedCharacterIndex--
		} else if (event.deltaY < 0 && fontStore.selectedCharacterIndex < 255) {
			fontStore.selectedCharacterIndex++
		}
	}
}
</script>

<template>
	<div class="grid grid-cols-6 gap-4 h-full w-full overflow-y-auto">
		<div
			class="bg-neutral-900 rounded-lg p-6 flex flex-col gap-4 col-span-6 md:col-span-3 xl:col-span-2"
		>
			<h2 class="text-2xl font-bold text-primary-400">Font Preview</h2>
			<template v-if="fontStore.hasData">
				<div class="flex gap-6">
					<USwitch v-model="showGrid" label="Show Grid" />
					<USwitch v-model="showTooltip" label="Show Tooltip" />
				</div>
				<FontGrid :show-grid="showGrid" :show-tooltip="showTooltip" />
			</template>
			<div
				v-else
				class="flex items-center justify-center h-64 text-neutral-400 text-center font-mono"
			>
				Please load an MCM file to display font data
			</div>
		</div>
		<div
			class="bg-neutral-900 rounded-lg p-6 flex flex-col gap-4 col-span-6 md:col-span-3 xl:col-span-4"
		>
			<h2 class="text-2xl font-bold text-primary-400">Character Preview</h2>
			<template v-if="fontStore.hasData">
				<div class="flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<label for="characterIndex">Character Index</label>
						<UInput
							id="characterIndex"
							v-model="fontStore.selectedCharacterIndex"
							type="number"
							:ui="{
								base: 'w-20'
							}"
							@wheel="handleScroll"
						/>
						<span class="text-neutral-400 font-mono text-xs">
							(Hex:
							{{ fontStore.selectedCharacterIndex.toString(16).toUpperCase() }})
						</span>
					</div>
				</div>
				<CharacterGrid
					:show-grid="showGrid"
					:show-background="true"
					:show-tooltip="showTooltip"
				/>
				<div class="flex gap-2">
					<UButton
						:color="paletteStore.selectedColor === 0 ? 'primary' : 'neutral'"
						:variant="paletteStore.selectedColor === 0 ? 'solid' : 'soft'"
						:ui="{ base: 'p-0.5' }"
						@click="paletteStore.selectedColor = 0"
					>
						<div class="aspect-square w-8 bg-black rounded-sm"></div>
					</UButton>
					<UButton
						:color="paletteStore.selectedColor === 2 ? 'primary' : 'neutral'"
						:variant="paletteStore.selectedColor === 2 ? 'solid' : 'soft'"
						:ui="{ base: 'p-0.5' }"
						@click="paletteStore.selectedColor = 2"
					>
						<div class="aspect-square w-8 bg-white rounded-sm"></div>
					</UButton>
					<UButton
						:color="paletteStore.selectedColor === 3 ? 'primary' : 'neutral'"
						:variant="paletteStore.selectedColor === 3 ? 'solid' : 'soft'"
						:ui="{ base: 'p-0.5' }"
						@click="paletteStore.selectedColor = 3"
					>
						<div class="aspect-square w-8 bg-neutral-400 rounded-sm"></div>
					</UButton>
				</div>
				<p class="text-text text-sm space-y-2">
					Select a color to paint pixels.
					<br />
					Left-click on a pixel to change its color.
					<br />
					Right-click on a pixel to clear it (set to transparent).
					<br />
					<span class="text-xs text-dimmed">
						Gray pixels are only visible when using specific OSD renderers. They
						will show as transparent in other renderers.
					</span>
				</p>
			</template>
			<div
				v-else
				class="flex items-center justify-center h-64 text-neutral-400 text-center font-mono"
			>
				Please load an MCM file to display character data
			</div>
		</div>
	</div>
</template>
