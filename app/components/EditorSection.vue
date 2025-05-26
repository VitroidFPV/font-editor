<script setup lang="ts">
import { useFontStore } from "~~/stores/fontStore"
import { useOptionsStore } from "~~/stores/optionsStore"
import { usePaletteStore } from "~~/stores/paletteStore"
import { useHistoryStore } from "~~/stores/historyStore"

import type { TabsItem } from "@nuxt/ui"

const fontStore = useFontStore()
const optionsStore = useOptionsStore()
const paletteStore = usePaletteStore()
const historyStore = useHistoryStore()

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

const tabs = [
	{
		label: "Painting",
		icon: "i-lucide-brush",
		slot: "character-editor" as const
	},
	{
		label: "Logo Upload",
		icon: "i-lucide-file-image",
		slot: "image-editor" as const
	},
	{
		label: "Custom Graphics",
		icon: "i-lucide-image",
		slot: "custom-graphics" as const
	}
] satisfies TabsItem[]
</script>

<template>
	<h2 class="text-2xl font-bold text-primary-400">Character Editor</h2>

	<UTabs
		v-if="true"
		:items="tabs"
		variant="link"
		class="gap-4 w-full"
		:ui="{
			trigger: 'grow'
		}"
	>
		<template #character-editor>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col xl:flex-row gap-4">
					<div class="flex flex-col gap-4 w-full items-center">
						<CharacterGrid
							:show-grid="optionsStore.showGrid"
							:show-background="optionsStore.showBackground"
							:show-tooltip="optionsStore.showTooltip"
						/>
						<div class="flex items-center justify-between w-full">
							<div class="flex items-center gap-2">
								<UButton
									:color="
										paletteStore.selectedColor === 0 ? 'primary' : 'neutral'
									"
									:variant="paletteStore.selectedColor === 0 ? 'solid' : 'soft'"
									:ui="{ base: 'p-0.5' }"
									@click="paletteStore.selectedColor = 0"
								>
									<div class="aspect-square w-8 bg-black rounded-sm"></div>
								</UButton>
								<UButton
									:color="
										paletteStore.selectedColor === 2 ? 'primary' : 'neutral'
									"
									:variant="paletteStore.selectedColor === 2 ? 'solid' : 'soft'"
									:ui="{ base: 'p-0.5' }"
									@click="paletteStore.selectedColor = 2"
								>
									<div class="aspect-square w-8 bg-white rounded-sm"></div>
								</UButton>
								<UButton
									:color="
										paletteStore.selectedColor === 3 ? 'primary' : 'neutral'
									"
									:variant="paletteStore.selectedColor === 3 ? 'solid' : 'soft'"
									:ui="{ base: 'p-0.5' }"
									@click="paletteStore.selectedColor = 3"
								>
									<div
										class="aspect-square w-8 bg-neutral-400 rounded-sm"
									></div>
								</UButton>
							</div>
							<div class="flex items-center gap-2">
								<UButton
									:disabled="!historyStore.canUndo"
									icon="i-heroicons-arrow-uturn-left"
									color="neutral"
									variant="subtle"
									size="sm"
									class="rounded-full"
									:tooltip="{
										text: 'Undo (Ctrl+Z)',
										disabled: !historyStore.canUndo
									}"
									@click="historyStore.undo()"
								/>
								<UButton
									:disabled="!historyStore.canRedo"
									icon="i-heroicons-arrow-uturn-right"
									color="neutral"
									variant="subtle"
									size="sm"
									class="rounded-full"
									:tooltip="{
										text: 'Redo (Ctrl+Y)',
										disabled: !historyStore.canRedo
									}"
									@click="historyStore.redo()"
								/>
							</div>
						</div>
						<div class="flex items-center w-full justify-between">
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
							</div>
							<span class="text-neutral-400 font-mono text-xs">
								(Hex:
								{{
									fontStore.selectedCharacterIndex.toString(16).toUpperCase()
								}})
							</span>
						</div>
					</div>
					<div class="flex flex-col gap-2 text-text text-sm max-w-[50ch] w-fit">
						<p>
							Select a character to edit, either from the font preview or from
							the input field. Enter in a specific index, or use the scroll
							wheel to navigate through the character set.
						</p>
						<p>Select a color to paint pixels.</p>
						<p>
							<UKbd>Left-click</UKbd> on a pixel to change its color.
							<UKbd>Right-click</UKbd> on a pixel to clear it (set to
							transparent). Hold mouse button to paint a continuous area.
						</p>
						<p>
							<UKbd>Ctrl</UKbd> + <UKbd>Z</UKbd> to undo, <UKbd>Ctrl</UKbd> +
							<UKbd>Y</UKbd> to redo.
						</p>
						<p>
							<span class="text-dimmed">
								Gray pixels are only visible when using specific OSD renderers.
								They will show as transparent in other renderers.
							</span>
						</p>
					</div>
				</div>
			</div>
		</template>
		<template #image-editor>
			<ImageToLogo />
		</template>
		<template #custom-graphics>
			<CustomGraphics />
		</template>
	</UTabs>
	<div
		v-else
		class="flex items-center justify-center h-64 text-neutral-400 text-center font-mono"
	>
		Please load an MCM file to display character data
	</div>
</template>
