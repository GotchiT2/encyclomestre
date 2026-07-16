<script lang="ts">
	import ProtectedRoute from '$lib/components/auth/protected-route.svelte';
	import type { Snippet } from 'svelte';
	let { children }: { children: Snippet } = $props();
</script>


<ProtectedRoute>{@render children()}</ProtectedRoute>
