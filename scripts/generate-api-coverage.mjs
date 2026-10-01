import { readFile, writeFile } from 'node:fs/promises';
const api = JSON.parse(await readFile('docs/contracts/api.openapi.json', 'utf8'));
const operations = Object.entries(api.paths)
	.flatMap(([path, item]) =>
		Object.entries(item)
			.filter(([method]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
			.map(([method, value]) => ({
				path,
				method: method.toUpperCase(),
				summary: value.summary ?? value.operationId
			}))
	)
	.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
function destination(path) {
	if (/passkeys|reauth|recovery-codes/.test(path))
		return [
			'/login, /register, /recovery, /settings',
			'../passkeys/api.ts',
			'Options WebAuthn, création ou récupération de compte, revérification et codes de secours éphémères.'
		];
	if (path === '/me/deletion' || path === '/me')
		return [
			'/settings, profil, shell',
			'account-deletion.ts, current-user.ts, users.ts',
			'Profil courant, sauvegarde complète ou fermeture revérifiée ; vérification du résultat avec le même jeton.'
		];
	if (/auction-favorites/.test(path))
		return [
			'/market, /market/[id]',
			'auctions.ts',
			'Favoris persistants et liste paginée, distincts des abonnements temporaires.'
		];

	if (/guild/.test(path))
		return [
			'/guild, /guilds/[id]',
			'guilds.ts, wikiforge.ts',
			'Recherche, adhésion, invitations, droits, discussion ou listes partagées selon l’opération.'
		];
	if (/cases|sanctions/.test(path))
		return [
			'/moderation, /moderation/[id]',
			'moderation.ts',
			'Lecture des restrictions et dossiers ; réponse au dossier ouvert.'
		];
	if (/achievements/.test(path))
		return [
			'/achievements',
			'achievements.ts',
			'Consulter les paliers ; encaisser un succès ou tous les succès disponibles.'
		];
	if (/wishlists/.test(path))
		return [
			'/wishlists, catalogue, collection, guilde',
			'wishlist.ts',
			'Gestion des listes, articles, invitations individuelles et partage avec la guilde.'
		];
	if (/auctions|bids/.test(path))
		return [
			'/market, /market/[id], collection, profil',
			'auctions.ts',
			'Catalogue paginé, vues personnelles, prix, plafond, création et abonnement temporaire.'
		];
	if (/sales/.test(path))
		return [
			'/profile, /users/[id]',
			'player-profile.ts',
			'Ventes immédiates et enchères du profil ; créer, acheter ou annuler.'
		];
	if (/showcase/.test(path))
		return [
			'/profile, /users/[id]',
			'player-profile.ts',
			'Composition complète de la vitrine et achat confirmé de place.'
		];
	if (/collection|tags/.test(path))
		return [
			'/collection, /users/[id], sélecteurs',
			'collection.ts, wikiforge.ts, users.ts',
			'Filtres, pagination, détail, protection et tags individuels ou en lot.'
		];
	if (/trades/.test(path))
		return [
			'/trades, cartes, profils, messages',
			'trades.ts',
			'Offres, contre-offres, acceptation, refus, annulation et historique borné.'
		];
	if (/friends|blocks/.test(path))
		return [
			'/friends, profils, signalements',
			'users.ts',
			'Demandes, acceptation, retrait, blocage, déblocage et collections partagées.'
		];
	if (/conversations/.test(path))
		return ['/messages', 'messages.ts', 'Conversations, historique paginé et envoi de texte.'];
	if (/notifications/.test(path))
		return [
			'/notifications, cloche',
			'notifications.ts',
			'Historique, filtre non lu, lecture individuelle et groupée.'
		];
	if (/leaderboards/.test(path))
		return ['/leaderboard', 'player-profile.ts', 'Classements global, quotidien et hebdomadaire.'];
	if (/pages|variants/.test(path))
		return [
			'/cards, modales de carte, sélecteurs, rendus partagés',
			'pages.ts, variants.ts',
			'Recherche, détail de carte et apparences de variante.'
		];
	if (/packs|boosters/.test(path))
		return [
			'/boosters, /packs/[id]',
			'boosters.ts',
			'Catalogue par emplacement, pools, stocks, crédits et ouvertures.'
		];
	if (path === '/reports')
		return [
			'Profils, cartes, enchères, échanges, conversations, guildes',
			'reports.ts',
			'Cinq cibles et six motifs ; commentaire, confirmation, blocage séparé.'
		];
	if (path === '/stream')
		return [
			'Shell authentifié',
			'notification-stream.svelte',
			'Connexion unique et mises à jour SSE ciblées, reconnexion et resynchronisation.'
		];
	if (path === '/welcome')
		return [
			'/',
			'welcome.ts',
			'Résumé des crédits, exemplaires, activité, invitations, messages et guilde.'
		];
	if (path === '/users' || /^\/users\//.test(path))
		return [
			'/users, /users/[id], sélecteurs',
			'users.ts, player-profile.ts',
			'Recherche des joueurs et détail de profil selon sa visibilité.'
		];
	return [
		'/settings, /profile, shell',
		'users.ts, auth.ts, current-user.ts',
		'Session, préférences complètes, avatar ou solde selon l’opération.'
	];
}
const rows = operations.map((o) => {
	const [screens, modules, use] = destination(o.path);
	return (
		'| `' + o.method + ' ' + o.path + '` | ' + screens + ' | `' + modules + '` | ' + use + ' |'
	);
});
await writeFile(
	'docs/api-fo-coverage.md',
	'# Couverture du contrat FO\n\nSource : `docs/contracts/api.openapi.json`, copie du JSON fourni dans cette conversation. ' +
		operations.length +
		' opérations, ' +
		Object.keys(api.paths).length +
		' chemins, ' +
		Object.keys(api.components.schemas).length +
		' schémas.\n\nCette matrice associe chaque opération à son parcours et à son module. Elle ne signifie pas que chaque combinaison de permissions a été testée en production. Les mutations de validation utilisent exclusivement les mocks. Les appels sont déclenchés selon leur utilité dans le parcours, jamais tous au démarrage. Les endpoints administratifs absents de ce document ne sont pas inventés.\n\n| Opération | Écrans | Modules dans src/lib/api (sauf SSE) | Usage |\n|---|---|---|---|\n' +
		rows.join('\n') +
		'\n\nRégénération : `node scripts/generate-api-coverage.mjs`. Types : `node scripts/generate-api-contract.mjs`.\n'
);
console.log(operations.length + ' operations mapped');
