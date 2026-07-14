import type { PageLoad } from './$types';
import {
	getCard,
	getCards,
	getProfileRegistrySummary,
	getProfileSettings,
	getSales,
	getUser,
	getUserCollection
} from '$lib/api';

export const load: PageLoad = ({ params, fetch }) => {
	const collection = getUserCollection(params.id, { fetch });
	const settings = getProfileSettings(params.id, { fetch });
	const sales = getSales(params.id, { fetch }).catch(() => []);
	const catalogue = Promise.all([
		getCards({ page: 1, pageSize: 100 }, { fetch }),
		collection,
		settings,
		sales
	]).then(async ([base, ownedCards, profile, userSales]) => {
		const referencedIds = [
			...new Set([
				...ownedCards.map((card) => card.id),
				...profile.wantedCardIds,
				...profile.showcases.flatMap((showcase) => showcase.cardIds),
				...(profile.avatarCardId ? [profile.avatarCardId] : []),
				...userSales.map((sale) => sale.cardId)
			])
		];
		const knownIds = new Set(base.items.map((card) => card.id));
		const missingCards = await Promise.all(
			referencedIds
				.filter((cardId) => !knownIds.has(cardId))
				.map((cardId) => getCard(cardId, { fetch }).catch(() => null))
		);
		return {
			...base,
			items: [
				...base.items,
				...missingCards.filter((card): card is NonNullable<typeof card> => card !== null)
			]
		};
	});

	return {
		user: getUser(params.id, { fetch }),
		collection,
		catalogue,
		settings,
		summary: getProfileRegistrySummary(params.id, { fetch }),
		sales
	};
};
