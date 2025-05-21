<script setup lang="ts">
const props = defineProps({
	showGrid: {
		type: Boolean,
		default: true
	},
	showTooltip: {
		type: Boolean,
		default: true
	}
})

const showGrid = computed(() => props.showGrid)
const showTooltip = computed(() => props.showTooltip)

function handleCellClick(x: number, y: number) {
	console.log(x, y)
}
</script>

<template>
	<div
		:class="`relative border-2 border-neutral-800 ${showGrid ? '' : 'rounded-lg'}`"
	>
		<div class="absolute pointer-events-none w-full h-full z-10">
			<FontGridCanvas />
		</div>
		<div class="grid-container z-50">
			<!-- Grid rows with cells -->
			<template v-for="y in 16" :key="'row-' + y">
				<!-- Grid cells -->
				<UTooltip
					v-for="x in 16"
					:key="'cell-' + x + '-' + y"
					:text="`${(x - 1).toString(16).toUpperCase()}:${(y - 1).toString(16).toUpperCase()}`"
					:ui="{
						content: 'bg-primary-500'
					}"
					:delay-duration="50"
					:disabled="!showTooltip"
				>
					<button
						:class="
							'border transition-[border-color] duration-300 grid-cell bg-transparent hover:bg-primary-400/50 cursor-pointer flex items-center justify-center z-10 ' +
							(showGrid ? ' border-neutral-500/20' : 'border-transparent')
						"
						@click="handleCellClick(x, y)"
					></button>
				</UTooltip>
			</template>
		</div>
	</div>
</template>

<style scoped>
.grid-container {
	display: grid;
	grid-template-columns: repeat(16, 1fr);
	grid-template-rows: repeat(16, 1fr);
	min-width: 100%;
}

.grid-cell {
	aspect-ratio: 12/18;
	min-width: 100%;
}
</style>
