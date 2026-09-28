# Reprise du front office WikiForge

## Contrat

- Référence figée : `docs/contracts/api.openapi.json`, JSON fourni par l’utilisateur.
- Inventaire : `docs/api-fo-coverage.md` (117 opérations).
- Types générés : `src/lib/api/schema.ts` (87 schémas).
- Régénérer : `node scripts/generate-api-contract.mjs`, puis `node scripts/generate-api-coverage.mjs`. Passer un fichier JSON au premier script pour mettre à jour le contrat ; revoir les DTO et les limites avant de modifier l’interface.

## Parcours ajoutés et complétés

- `/guild` : sa guilde, recherche avec pagination, invitations reçues, création.
- `/guilds/[id]` : membres, permissions, transfert de propriété, départ, dissolution, gestion des invitations, édition, chat avec article ou exemplaire joint, wishlists en lecture seule.
- `/moderation` et `/moderation/[id]` : restrictions actives, dossiers, non-lus et réponse. MUTE ne bloque pas les réponses à la modération.
- Signalement commun pour USER, MESSAGE, GUILD_MESSAGE, GUILD et PAGE. Entrées dans profils, enchères, échanges, messagerie, guildes et articles. Le blocage reste une action confirmée distincte.
- Les cartes ouvrent une modale partagée avec variantes et signalement ; `/cards/[id]` est uniquement une compatibilité qui ouvre le catalogue et cette modale. `/packs/[id]` conserve le détail d’édition, ses probabilités et ses pools.
- Wishlists : partage avec sa guilde conservé dans les corps complets et retrait d’illustration ; images reçues sous forme d’URL conservées.
- Collection : retrait des tags en lot et respect du curseur renvoyé par le serveur.
- Succès : encaissement global ; profils/accueil : liens de guilde et compteurs ; avatar : sélection dans le catalogue actif, indépendamment des cartes détenues.
- Transactions : restrictions ciblées MUTE/TRADE, sélection excluant les exemplaires engagés, confirmation d’achat de place de vitrine et relecture du solde.
- Session : seuls les 401 déclenchent une récupération OAuth ; les 403 ne rejouent pas une écriture. Reconnexion SSE bornée avant réception d’un nouvel événement ready ; conversion commune des messages HTTP/SSE.

Les composants métier restent sous `src/lib/components` et les routes orchestrent leur chargement. Tous les nouveaux libellés sont dans `src/lib/locales/completion.fr.json`.

## Lancement et validations sans production

Conserver la configuration HTTPS locale et les variables API existantes. Pour une validation isolée en PowerShell :

```powershell
$env:PUBLIC_API_MOCK_ENABLED = 'true'
$env:PUBLIC_API_MOCK_DELAY_MS = '10'
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5180
```

Dans un second terminal :

```powershell
node scripts/check-auctions.mjs
node scripts/check-community.mjs
node scripts/check-ux.mjs
```

Les scripts initialisent une session de démonstration et interdisent les requêtes vers api.wikiforge.fr. Ils utilisent Chromium de Playwright. Ils vérifient les largeurs 360, 390, 768, 1024 et 1440 px. Ne pas lancer le build ou SvelteKit sync pendant ces parcours : ces commandes peuvent réinitialiser le serveur de développement.

Mocks : `src/lib/api/mocks/community.ts`, `auctions.ts` et `src/lib/api/mock.ts`. Scénarios communautaires via `sessionStorage['wikiforge-community-scenario']` : `conflict`, `mute`, `trade`, `empty`. Retirer la clé pour revenir au scénario normal. Les données sont en mémoire et repartent de leur état initial au rechargement complet.

Contrôles hors serveur de démonstration : `npm run check`, ESLint sur les fichiers modifiés, `node node_modules/vitest/vitest.mjs run`, `npm run build`, `git diff --check`.

## Limites et suite

- Recherche d’enchères : filtres locaux à la page, conformément au contrat actuel.
- Pas de favoris locaux ou de faux suivi persistant. watch reste un abonnement technique.
- Les historiques personnels restent bornés par les réponses de l’API.
- Le chat de guilde s’actualise toutes les 15 secondes lorsque visible ; aucun événement SSE de guilde n’est inventé.
- Les dossiers de modération ne constituent pas le suivi des signalements envoyés.
- Aucune modification backend ni déploiement. La validation des écritures est exclusivement mock.

Recommandations priorisées : `docs/ux-ui-recommendations.md`. Besoins API restant ouverts : `docs/api-auctions-reporting-needs.md`.

## UX/UI — reprise du 27 septembre 2026

- Les bannières sont sticky dans le layout global. Leur hauteur décale les filtres fixes ; les fermetures sont conservées par compte et identifiant dans `sessionStorage`, clé `wikiforge.banners.<compte>`. Expiration et retrait serveur restent prioritaires.
- `variant-selector.svelte` fournit recherche, sélection simple/multiple, clavier et conservation des identifiants inconnus. Les aperçus consultent `/pages/{id}` et `/variants` sans modifier l’exemplaire. Les lectures simultanées sont regroupées par compte et carte.
- `CardTile` ouvre par défaut le détail commun. `interactive={false}` est réservé aux rendus internes de la modale et à la carte déjà enveloppée par le bouton de révélation. Les gestes explicites de sélection restent disponibles dans les sélecteurs.
- Les notifications naviguent indépendamment du PATCH de lecture ; le compteur change seulement après succès. Scénario mock : `sessionStorage['wikiforge-ux-scenario']='notification-error'`.
- Brouillons opt-in : `wikiforge.draft.<compte>.<cible>` dans localStorage, durée maximale de 24 h, restauration confirmée, effacement à la déconnexion et après envoi réussi. Les données locales ne contiennent aucun jeton et ne constituent pas des favoris d’enchères.
- La collection conserve ses pages chargées dans les snapshots de navigation ; les wishlists conservent liste, recherche, tri et page dans l’URL. Les filtres des enchères restent limités aux 48 résultats de la page.
- Les trois scripts navigateur utilisent uniquement les mocks ; captures dans le dossier temporaire Windows. Ne pas lancer de build pendant ces scripts.

Validation de cette étape : check sans diagnostics, ESLint ciblé, 248 tests Vitest (77 fichiers), trois parcours Playwright aux cinq largeurs, build statique et diff vérifiés. Aucun commit ni push effectué ; le travail antérieur déjà présent dans le dépôt a été conservé.

## Transmission API à Claude

Le document [claude-api-requirements.md](claude-api-requirements.md) décrit les capacités existantes et les évolutions backend nécessaires, avec priorités, contrats proposés et critères d’acceptation. Il inclut la suppression de son propre compte et ses blocages métier. Une copie identique est livrée dans le BO. Aucun nouvel endpoint n’est présenté comme déjà disponible.

## Modèles de cartes publiés

Les clés de variante `tpl:<id>@<revision>` sont préservées par la normalisation et résolues à la demande via le catalogue public proposé. Le composant conserve son rendu historique pour les autres clés et fournit un repli standard explicite si une révision est absente, invalide ou incompatible. Les requêtes concurrentes sont regroupées et les réponses obsolètes ignorées. Les filtres d’images sensibles et les données réelles de l’exemplaire restent prioritaires.

Le moteur `src/lib/card-renderer` provient du BO : utiliser son script `sync-card-renderer.mjs --target=<dossier-FO>` puis `--check`. Ne pas éditer ces fichiers directement ici. Le format des templates est séparé des données de carte et de l’export de comparaison du BO.

Contrat : `docs/card-template-api-contract.md`. Aucun backend n’est modifié et aucun modèle réel n’est publié. En mode mock seulement, `sessionStorage['wikiforge-template-scenario']='published'` ou `'missing'` active les scénarios de démonstration depuis `/cards`. Supprimer cette clé pour revenir aux variantes habituelles. Le parcours automatisé `scripts/check-card-templates.mjs` vérifie ces deux cas à cinq largeurs et interdit les requêtes de production.

Le moteur partagé accepte désormais les définitions v2 (surfaces, finitions séparées, CSS de présentation validé) et migre les anciennes définitions. Aucune zone d’édition BO n’est rendue dans le FO. `RenderData.boosterLogo` est prêt pour un logo optionnel ; le branchement à un DTO réel attend le contrat backend documenté. Les anciennes clés de variante gardent leur rendu historique.


## Catalogue mock de modèles full art

La source canonique du BO ajoute `src/lib/card-renderer/presets.ts` : douze définitions graphiques v2 et vingt-quatre styles combinables. Le catalogue mock comprend les douze nouvelles révisions tout en préservant les anciennes clés. La galerie et la bibliothèque sont des outils du BO ; aucun nouveau sélecteur ou écran FO n’est introduit.

Un modèle décrit uniquement une apparence. L’association à une variante réelle n’est pas publiée dans cette étape. Le FO conserve la composition normale/full art, le titre, l’image et la numérotation issus de la carte réelle. Le format v2, les adaptateurs et les replis restent identiques. Pour mettre à jour ces fichiers, lancer le script `scripts/sync-card-renderer.mjs` depuis le BO avec `--target=<dossier-FO>` ; `--check` vérifie leur identité.


## Évolution API du 28 septembre 2026

Intégration livrée des contrats des messages (4)/(5) et de la limite de pseudo. FO : recherche serveur et historiques paginés, favoris persistants, devis de frais, fermeture de compte, engagements des cartes, progression et SSE de guilde. BO : dossier joueur, renommage forcé, purge et journal, corrections des DTO enchères/signalements. Les APIs ont été annoncées vérifiées en local ; pas de bascule automatique vers les mocks ni d’écriture de test sur la production.

Les besoins backend précédemment listés pour la recherche, les favoris, l’historique, le devis, les engagements et la suppression sont désormais couverts par le contrat. La publication des templates et le logo de booster restent indisponibles. Voir l’audit administratif `docs/admin-api-coverage.md` dans le BO pour les outils absents.
