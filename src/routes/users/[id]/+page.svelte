<script lang="ts">
	import PublicProfileView from '$lib/components/profile/public-profile-view.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { _ } from '$lib/i18n';
	import type { PageData } from './$types';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	let { data }: { data: PageData } = $props();
</script>

{#await Promise.all([data.profile, data.sales])}
	<p class="forge-label text-primary">{$_('friends.loading')}</p>
{:then [profile, sales]}
	<PublicProfileView {profile} initialSales={sales} />
{:catch}
	<Alert.Root variant="destructive"
		><CircleAlertIcon /><Alert.Title>{$_('friends.error')}</Alert.Title></Alert.Root
	>
{/await}
