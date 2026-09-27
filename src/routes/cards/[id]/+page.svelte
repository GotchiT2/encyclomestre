<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	onMount(() => {
		void goto(resolve(`/cards?detail=${encodeURIComponent(page.params.id!)}`), {
			replaceState: true
		});
	});
</script>
