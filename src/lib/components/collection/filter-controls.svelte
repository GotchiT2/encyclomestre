<script lang="ts">
	import CompactFilters from './compact-filters.svelte';
	import type {
		CardSearchSort,
		CollectionBooleanFilter,
		CollectionSort,
		CollectionTag,
		User
	} from '$lib/types';

	let {
		query = $bindable(''),
		sortBy = $bindable<CollectionSort | CardSearchSort>('acquiredDate'),
		variantIds = $bindable<number[]>([]),
		tagFilterIds = $bindable<string[]>([]),
		duplicate = $bindable<CollectionBooleanFilter>('all'),
		protected: protection = $bindable<CollectionBooleanFilter>('all'),
		wishlistOwnerId = $bindable(''),
		wishlistOwners = [],
		tags,
		untaggedOption,
		canonical = false,
		allowTagCreation = true,
		onOpenTagEditor,
		onClear
	}: {
		query: string;
		sortBy: CollectionSort | CardSearchSort;
		variantIds: number[];
		tagFilterIds: string[];
		duplicate?: CollectionBooleanFilter;
		protected?: CollectionBooleanFilter;
		wishlistOwnerId?: string;
		wishlistOwners?: User[];
		tags: CollectionTag[];
		untaggedOption?: string;
		allowTagCreation?: boolean;
		canonical?: boolean;
		onOpenTagEditor: () => void;
		onClear: () => void;
	} = $props();
</script>

<CompactFilters
	bind:query
	bind:sortBy
	bind:variantIds
	bind:tagFilterIds
	bind:duplicate
	bind:protected={protection}
	bind:wishlistOwnerId
	{wishlistOwners}
	{tags}
	{canonical}
	{untaggedOption}
	{onClear}
	onOpenTagEditor={allowTagCreation ? onOpenTagEditor : undefined}
/>
