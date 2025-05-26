<script setup lang="ts">
import { useFontStore } from "~~/stores/fontStore"
import { useOptionsStore } from "~~/stores/optionsStore"

const fontStore = useFontStore()
const optionsStore = useOptionsStore()
</script>

<template>
	<h2 class="text-2xl font-bold text-primary-400">Font Preview</h2>

	<template v-if="fontStore.hasData">
		<div class="flex gap-4 flex-wrap py-1.5">
			<USwitch v-model="optionsStore.showGrid" label="Show Grid" />
			<USwitch v-model="optionsStore.showTooltip" label="Show Tooltip" />
			<USwitch v-model="optionsStore.showBackground" label="Show Background" />
		</div>
		<FontGrid
			:show-grid="optionsStore.showGrid"
			:show-tooltip="optionsStore.showTooltip"
			:show-background="optionsStore.showBackground"
		/>
	</template>
	<div
		v-else
		class="flex items-center justify-center h-64 text-neutral-400 text-center font-mono"
	>
		Please load an MCM file to display font data
	</div>
</template>
