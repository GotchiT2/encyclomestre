<script lang="ts">
	import { page } from '$app/state';
	import PackPage from '$lib/components/boosters/pack-page.svelte';
</script>

<PackPage id={page.params.id!} />
