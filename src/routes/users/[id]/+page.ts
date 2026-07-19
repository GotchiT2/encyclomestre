import type { PageLoad } from './$types';
import {
	getCard,
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
	const catalogue = Promise.all([collection, settings, sales]).then(
		async ([ownedCards, profile, userSales]) => {
			const hydratedSaleCards = userSales.flatMap((sale) => (sale.card ? [sale.card] : []));
			const referencedIds = [
				...new Set([
					...ownedCards.map((card) => card.id),
					...profile.wantedCardIds,
					...profile.showcases.flatMap((showcase) => showcase.cardIds),
					...(profile.avatarCardId ? [profile.avatarCardId] : []),
					...userSales.filter((sale) => !sale.card).map((sale) => sale.cardId)
				])
			];
			const knownIds = new Set([...ownedCards, ...hydratedSaleCards].map((card) => card.id));
			const missingCards = await Promise.all(
				referencedIds
					.filter((cardId) => !knownIds.has(cardId))
					.map((cardId) => getCard(cardId, { fetch }).catch(() => null))
			);
			const items = [
				...ownedCards,
				...hydratedSaleCards.filter(
					(card) => !ownedCards.some((ownedCard) => ownedCard.id === card.id)
				),
				...missingCards.filter((card): card is NonNullable<typeof card> => card !== null)
			];
			return {
				items,
				meta: { page: 1, pageSize: items.length, total: items.length, totalPages: 1 }
			};
		}
	);

	return {
		user: getUser(params.id, { fetch }),
		collection,
		catalogue,
		settings,
		summary: getProfileRegistrySummary(params.id, { fetch }),
		sales
	};
};
