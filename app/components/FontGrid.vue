<script setup lang="ts">
import { useFontStore } from "../../stores/fontStore"
import CharacterCanvas from "./CharacterCanvas.vue"

const fontStore = useFontStore()

// Method to get character index from row and column
function getCharacterIndex(row: number, col: number): number {
	return row * 16 + col
}

// Format an integer as hex with uppercase letters and padding
function toHex(value: number): string {
	return value.toString(16).padStart(2, "0").toUpperCase()
}
</script>

<template>
	<div class="grid-container">
		<!-- Header row (x-axis indices) -->
		<div class="header-cell"></div>
		<!-- Empty corner cell -->
		<div
			v-for="x in 16"
			:key="'header-' + x"
			class="font-mono text-xs text-neutral-600 flex items-end justify-center"
		>
			{{ (x - 1).toString(16).toUpperCase() }}
		</div>

		<!-- Grid rows with y-axis labels and cells -->
		<template v-for="y in 16" :key="'row-' + y">
			<!-- Y axis label (hex) -->
			<div
				class="font-mono text-xs text-neutral-600 flex flex-col items-end justify-center"
			>
				{{ (y - 1).toString(16).toUpperCase() }}
			</div>

			<!-- Grid cells -->
			<UTooltip
				v-for="x in 16"
				:key="'cell-' + x + '-' + y"
				:text="toHex(getCharacterIndex(y - 1, x - 1))"
			>
				<div
					class="grid-cell border border-neutral-800 hover:bg-neutral-700 cursor-pointer flex items-center justify-center"
				>
					<CharacterCanvas
						v-if="fontStore.hasData"
						:character-index="getCharacterIndex(y - 1, x - 1)"
					/>
					<span v-else class="text-xs text-neutral-400">
						{{ toHex(getCharacterIndex(y - 1, x - 1)) }}
					</span>
				</div>
			</UTooltip>
		</template>
	</div>
</template>

<style scoped>
.grid-container {
	display: grid;
	grid-template-columns: auto repeat(16, 1fr);
	grid-template-rows: auto repeat(16, 1fr);
	min-width: 100%;
}

.header-cell,
.grid-cell {
	aspect-ratio: 12/18;
	min-width: 100%;
}
</style>
