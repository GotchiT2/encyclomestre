<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	let { onImportLink }: { onImportLink: (sealUrl: string) => void } = $props();
	let sealUrl = $state('');

	function importLink() {
		if (!sealUrl.trim()) return;
		onImportLink(sealUrl.trim());
		sealUrl = '';
	}
</script>

<div class="flex w-full flex-wrap justify-end gap-2 sm:w-auto sm:flex-nowrap">
	<Input
		bind:value={sealUrl}
		class="h-9 min-w-72 flex-1 sm:w-96"
		placeholder={$_('wishlist.import_link_placeholder')}
	/><Button size="sm" variant="outline" onclick={importLink}
		>{$_('wishlist.import_link_btn')}</Button
	>
</div>
