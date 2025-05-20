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
			<!--
				Calculate the hex value for this cell:
				1. Convert row (y-1) and column (x-1) to 0-based indices
				2. Calculate position = row * 16 + column (0-255 decimal)
				3. Convert to hexadecimal string
				4. Pad with leading zero if needed
				5. Convert to uppercase for display
			-->
			<UTooltip
				v-for="x in 16"
				:key="'cell-' + x + '-' + y"
				:text="
					((y - 1) * 16 + (x - 1)).toString(16).padStart(2, '0').toUpperCase()
				"
			>
				<div
					class="grid-cell border border-neutral-800 hover:bg-neutral-700 cursor-pointer flex items-center justify-center text-xs text-neutral-400"
				></div>
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
