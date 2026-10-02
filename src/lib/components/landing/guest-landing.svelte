<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import VariantCardFace from '$lib/components/cards/variant-card-face.svelte';
	import BoosterPackArt from '$lib/components/boosters/booster-pack-art.svelte';
	import LegalLinks from '$lib/components/security/legal-links.svelte';
	import { _ } from '$lib/i18n';
	import type { CardRecord } from '$lib/types';
	let { showcaseCard }: { showcaseCard: CardRecord | null } = $props();
</script>

<section class="arcade-landing">
	<div class="landing-copy">
		<p class="forge-label">{$_('landing.eyebrow')}</p>
		<h1>{$_('landing.title')}</h1>
		<p class="manifest">{$_('landing.manifest')}</p>
		<div class="landing-actions">
			<Button href={resolve('/register')} size="lg">{$_('landing.primaryCta')}</Button><Button
				href={resolve('/login')}
				variant="outline"
				size="lg">{$_('plan.account.login')}</Button
			>
		</div>
	</div>
	<div class="landing-objects">
		<div class="graphic-print" aria-hidden="true">✦</div>
		<div class="landing-pack">
			<BoosterPackArt name={$_('navigation.brand')} renderKey="standard" />
		</div>
		{#if showcaseCard}<div class="landing-card"><VariantCardFace card={showcaseCard} /></div>{/if}
	</div>
</section>
<section class="landing-loop">
	{#each ['landing.loopDiscover', 'landing.loopCollect', 'landing.loopTrade'] as key, index (key)}<article
		>
			<span class="loop-number">0{index + 1}</span>
			<h2>{$_(key + 'Title')}</h2>
			<p>{$_(key + 'Body')}</p>
		</article>{/each}
</section>
<LegalLinks />

<style>
	.arcade-landing {
		display: grid;
		gap: 2rem;
		align-items: center;
		padding: 1rem 0 2rem;
	}
	.landing-copy h1 {
		font:
			900 clamp(3rem, 6vw, 6rem)/0.88 'Barlow Condensed',
			sans-serif;
		text-transform: uppercase;
		margin: 1rem 0;
		max-width: 10ch;
	}
	.manifest {
		max-width: 34rem;
		color: var(--muted-foreground);
		line-height: 1.5;
		font-size: 1.125rem;
	}
	.landing-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}
	.landing-objects {
		position: relative;
		isolation: isolate;
		height: 300px;
	}
	.graphic-print {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-size: 360px;
		line-height: 1;
		color: #e8ef42;
		z-index: -1;
	}
	.landing-card {
		position: absolute;
		right: 6%;
		top: 5%;
		width: 144px;
		max-width: 144px;
		transform: rotate(7deg);
	}
	.landing-pack {
		position: absolute;
		width: 40%;
		max-width: 220px;
		top: 22%;
		left: 3%;
		transform: perspective(700px) rotateY(16deg) rotateZ(-10deg);
	}
	.landing-loop {
		display: grid;
		gap: 1rem;
		margin-bottom: 3rem;
	}
	.landing-loop article {
		padding: 1.25rem;
		border-top: 1px solid var(--border);
		background: var(--card);
	}
	.loop-number {
		font:
			900 2rem 'Barlow Condensed',
			sans-serif;
		color: var(--primary);
	}
	.landing-loop h2 {
		font-size: 1.75rem;
		margin: 0.5rem 0;
	}
	.landing-loop p {
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--muted-foreground);
	}
	@media (min-width: 768px) {
		.arcade-landing {
			grid-template-columns: 1fr 1fr;
			min-height: 70dvh;
		}
		.landing-loop {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
