import type { CardRarity, CardRarityInitials } from '$lib/types';

export type CardRarityCode = CardRarityInitials;

export const cardRarityOptions: Array<{
	value: CardRarity;
	initials: CardRarityInitials;
	code: CardRarityCode;
	color: string;
}> = [
	{ value: 'Commune', initials: 'C', code: 'C', color: '#d3e4f8' },
	{ value: 'Peu Commune', initials: 'PC', code: 'PC', color: '#1d71cf' },
	{ value: 'Rare', initials: 'R', code: 'R', color: '#5c1dcf' },
	{ value: 'Super-Rare', initials: 'SR', code: 'SR', color: '#b41dcf' },
	{ value: 'Ultra-Rare', initials: 'UR', code: 'UR', color: '#cf7d1d' },
	{ value: 'Légendaire', initials: 'L', code: 'L', color: '#cf1d1d' }
];

export const cardRarityCodeByName = Object.fromEntries(
	cardRarityOptions.map((rarity) => [rarity.value, rarity.code])
) as Record<CardRarity, CardRarityCode>;

export const cardRarityByCode = Object.fromEntries(
	cardRarityOptions.map((rarity) => [
		rarity.code,
		{ name: rarity.value, initials: rarity.initials, color: rarity.color }
	])
) as Record<CardRarityCode, { name: CardRarity; initials: CardRarityInitials; color: string }>;
