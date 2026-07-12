<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import { _ } from '$lib/i18n';
	let {
		arachnophobia = $bindable(false),
		nsfw = $bindable(false),
		imageUrl,
		title
	}: { arachnophobia: boolean; nsfw: boolean; imageUrl: string; title: string } = $props();
	const isAnxietyKeyword = () => /araignée|scorpion/i.test(title);
</script>

<section class="border-4 border-double border-primary/30 bg-card p-4">
	<h2 class="font-serif text-xl font-black uppercase tracking-tight text-foreground">
		{$_('profile.filters_section')}
	</h2>
	<div
		class="mt-4 flex items-center justify-between gap-4 border-t border-dashed border-primary/20 py-3"
	>
		<span class="font-serif italic text-foreground">{$_('profile.nsfw_label')}</span><Switch
			bind:checked={nsfw}
			aria-label={$_('profile.nsfw_label')}
		/>
	</div>
	<div
		class="flex items-center justify-between gap-4 border-y border-dashed border-primary/20 py-3"
	>
		<span class="font-serif italic text-foreground">{$_('profile.arachnophobia_label')}</span
		><Switch bind:checked={arachnophobia} aria-label={$_('profile.arachnophobia_label')} />
	</div>
	<div class="relative mt-4 overflow-hidden border border-primary/30 bg-black p-2">
		<img
			src={imageUrl}
			alt={title}
			class:blur-2xl={arachnophobia && isAnxietyKeyword()}
			class="aspect-video w-full object-cover"
		/>{#if arachnophobia && isAnxietyKeyword()}<p
				class="absolute inset-0 grid place-items-center bg-background/80 font-mono text-[10px] uppercase tracking-widest text-primary"
			>
				{$_('profile.maskedContent')}
			</p>{/if}
	</div>
</section>
