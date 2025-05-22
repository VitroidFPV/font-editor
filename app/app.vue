<script setup lang="ts">
useSeoMeta({
	title: "OSD Font Editor",
	description: "Edit MAX7456-compatible OSD fonts with ease in your browser",
	ogTitle: "OSD Font Editor",
	ogDescription: "Edit MAX7456-compatible OSD fonts with ease in your browser",
	ogImage: "/favicon.svg",
	themeColor: "#ff637e",
	author: "VitroidFPV",
	keywords: "OSD, Font, Editor, MAX7456, OSD Font Editor"
})
</script>

<template>
	<UApp>
		<div
			class="flex flex-col p-3 gap-3 h-screen max-h-screen overflow-y-hidden w-screen bg-zinc-950"
		>
			<NavBar />
			<NuxtPage />
		</div>
	</UApp>
</template>
