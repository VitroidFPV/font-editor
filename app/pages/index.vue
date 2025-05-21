<script setup lang="ts">
const showGrid = ref(true)
const showTooltip = ref(true)
</script>

<template>
	<div class="grid grid-cols-6 gap-4 h-full w-full">
		<div
			class="bg-neutral-950/30 rounded-lg p-3 flex flex-col gap-3 col-span-6 md:col-span-3 lg:col-span-2"
		>
			<h2 class="text-2xl font-bold text-primary-400">Font Preview</h2>
			<div class="flex flex-col gap-2">
				<USwitch v-model="showGrid" label="Show Grid" />
				<USwitch v-model="showTooltip" label="Show Tooltip" />
			</div>
			<FontGrid :show-grid="showGrid" :show-tooltip="showTooltip" />
		</div>
		<div
			class="bg-neutral-950/30 rounded-lg col-span-6 md:col-span-3 lg:col-span-4"
		>
			<h2 class="text-lg font-bold"></h2>
			<CharacterGrid :index="148" />
		</div>
	</div>
</template>
