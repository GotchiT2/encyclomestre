<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	void goto(resolve('/login'));
</script>
