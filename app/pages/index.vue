<script setup lang="ts">
import { useFontStore } from "~~/stores/fontStore"

const fontStore = useFontStore()

const showGrid = ref(true)
const showTooltip = ref(true)
</script>

<template>
	<div class="grid grid-cols-6 gap-4 h-full w-full">
		<div
			class="bg-neutral-900 rounded-lg p-4 flex flex-col gap-4 col-span-6 md:col-span-3 lg:col-span-2"
		>
			<h2 class="text-2xl font-bold text-primary-400">Font Preview</h2>
			<template v-if="fontStore.hasData">
				<div class="flex flex-col gap-2">
					<USwitch v-model="showGrid" label="Show Grid" />
					<USwitch v-model="showTooltip" label="Show Tooltip" />
				</div>
				<FontGrid :show-grid="showGrid" :show-tooltip="showTooltip" />
			</template>
			<div
				v-else
				class="flex items-center justify-center h-64 text-neutral-400 text-center"
			>
				Please load an MCM file to display font data
			</div>
		</div>
		<div
			class="bg-neutral-900 rounded-lg p-4 flex flex-col gap-4 col-span-6 md:col-span-3 lg:col-span-4"
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
						/>
						<span class="text-neutral-400">
							(Hex:
							{{ fontStore.selectedCharacterIndex.toString(16).toUpperCase() }})
						</span>
					</div>
				</div>
				<CharacterGrid />
			</template>
			<div
				v-else
				class="flex items-center justify-center h-64 text-neutral-400 text-center"
			>
				Please load an MCM file to display character data
			</div>
		</div>
	</div>
</template>
