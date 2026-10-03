# Plan 2 — Arcade contemporaine

Livraison sur `feat/arcade-redesign`, dans Encyclomestre et le BO voisin `wikiforge-bo`. Les validations utilisent les mocks, les certificats locaux existants et `https://dev.wikiforge.fr`. `vite.config.ts` est conservé. Aucun déploiement ou appel d’écriture en production.

## Socle commun

- Anthracite, crème et jaune ; Barlow et Barlow Condensed locales, licences OFL jointes. Cadres imprimés, angles coupés et emballages SVG/CSS. Expérience sans son.
- Navigation mobile Collection, Souhaits, Boosters, Catalogue, Marché ; communauté et compte dans l’en-tête. Navigation latérale sur ordinateur. Entrée sur la collection, récapitulatif via le logo.
- Composants de carte partagés, grille stable de deux à six colonnes et vue liste. Les images paysage restent entières ; leur format naturel est conservé dans le détail.
- Quantité personnelle, amis et souhaits sous la carte ; états de protection, vente, enchère et échange cumulables. Numérotation et quantité globale séparées. Données absentes affichées sans zéro inventé.
- Enrichissement des articles visibles : cache par compte, trois workers, recherche exacte dans les wishlists avec pagination et rejet des réponses d’un ancien compte. Les erreurs d’enrichissement préservent les informations déjà connues.
- Préférences locales de présentation, ouverture et mouvements ; réduction système et locale des animations. Cibles des commandes d’au moins 44 px, panneaux mobiles et espace réservé aux actions fixes.

## Changements par page

| Page | Livraison |
| --- | --- |
| Landing | Cartes et emballage Arcade, présentation du cycle de collection, accès compte et documents publics. |
| Accueil joueur | Récapitulatif `/welcome`, données réelles et raccourci booster adapté aux crédits. |
| Connexion | Présentation passkey concentrée, récupération et destination conservées. |
| Inscription | Quatre étapes visibles ; dix codes éphémères et sauvegarde obligatoire conservés. |
| Récupération | Présentation commune des parcours par code/lien ; nouveaux codes et conséquences conservés. |
| Documents légaux | Lecture confortable ; les sections définitives restent explicitement à compléter. |
| Collection | Album principal, progression repliable, filtres rapides, choix directs de variantes/tags, critères actifs supprimables, grille/liste et menu d’actions par exemplaire. Sélection des cartes chargées explicitement bornée à 500. |
| Catalogue | Recherche et tris serveur ; nouvelle grille, bande d’informations et sélection multiple de souhaits. |
| Détail de carte | Objet Arcade, plein écran mobile, contexte personnel/social et actions du Plan 1 ; pack nommé et quantité mondiale distincte. |
| Boosters | Galerie avec voisins visibles, liste complète, crédits par famille, ouverture simple/lot confirmé, zone de glissement dédiée, découverte ordonnée, saut permanent, Express et reprise. |
| Fiche pack | Même emballage, noms/description traduits, dates locales, contenu/probabilités et sélection du pack pour l’ouverture. |
| Souhaits | Listes imprimées et sections lisibles ; partage, comparaison et ajout/retrait multiple conservés. Actualisation de l’appartenance affichée sous les cartes. |
| Enchères | Navigation Marché commune, onglets compacts, recherche/budget, variantes directes et critères avancés en panneau. |
| Détail d’enchère | Nouvelle carte et composants d’action communs ; prix, devis, fonds immobilisés et conflits conservés. |
| Échanges | Deux ensembles « Je donne / Je reçois », onglets mobiles et bilan visible ; termes monétaires repliables. |
| Amis | Identité, avatars et commandes communes ; demandes, confirmations et raccourcis du Plan 1 conservés. |
| Messages | Deux panneaux dès 768 px ; discussion séparée sur téléphone, composition et défilement interne conservés. |
| Guildes | Identité commune ; appartenance, recherche et invitations restent distinctes. |
| Fiche guilde | Onglets compacts, cartes Arcade intégrées et gestion selon permissions ; chat visible et reprise conservés. |
| Mon profil | Vitrine imprimée, mode d’organisation explicite, déplacements accessibles par boutons et ventes séparées. |
| Profil joueur | Même vitrine et cartes, relation et accès selon confidentialité ; comparaison des souhaits et achat confirmé conservés. |
| Paramètres | Préférences Arcade, interrupteurs tactiles et groupes existants profil/visibilité/sécurité ; avatar, passkeys et codes conservés. |
| Fermeture | Conséquences, bloqueur de guilde, revérification et purge de session conservés. |
| Succès | Progression et état réel des récompenses, titre lisible et commande de réclamation tactile. |
| Classements | Périodes, lignes compactes, position personnelle et avatars recadrés. |
| Notifications | Toutes/Non lues explicites, lignes compactes et destinations du Plan 1. |
| Modération | Identité commune sobre, dossiers/restrictions et réponses conservés. |
| Validation | `/arcade/validation`, privée et hors navigation, accessible uniquement avec les mocks ; finitions, portrait/paysage, titre long, image/titre/numéro absents et comparaison source/Arcade. |

Les pages sociales, transactions et sécurité réutilisent le nouveau socle tout en préservant leurs parcours fonctionnels du Plan 1. L’ancien `/boosters/apercu` reste privé, hors navigation et hors migration.

## Ouverture et incertitude réseau

Le pack reste fermé pendant la vérification et la requête. Le résultat reçu déclenche une seule cérémonie de 720 ms ; chaque carte se retourne en 360 ms. L’ordre serveur est conservé. Express accède immédiatement au bilan. Toutes les cartes appartiennent déjà à la collection.

La session conserve uniquement les identifiants et l’avancement du dernier résultat, séparés par compte et purgés à la déconnexion. La reprise relit les exemplaires, avec trois lectures simultanées au maximum, et refuse une réponse portant un autre identifiant. Une réponse d’ouverture perdue actualise les crédits et acquisitions sans relancer l’écriture et sans fabriquer un résultat.

La galerie permet de parcourir les packs sans consommer de crédit. Déchirer utilise une zone dédiée ; le bouton reste disponible comme alternative. Les mocks conservent les acquisitions après rechargement et simulent un lot limité à deux boosters, l’épuisement et une réponse perdue après consommation réelle du crédit mock.

## BO et conservation des sources

Le moteur de cartes est identique octet par octet entre FO et BO. Le profil Arcade adapte la présentation ; les définitions sources v1/v2, imports/exports, styles inconnus et anciennes révisions restent lisibles. Aucune migration serveur ou réécriture des définitions publiées.

L’atelier propose bibliothèque, aperçu, propriétés, palette Arcade, annuler/rétablir, contexte collection/détail/révélation et comparaison avec la source. Sur mobile, les propriétés utilisent un panneau inférieur. Les variantes et packs réutilisent les rendus communs. Les autres domaines administratifs restent hors de la refonte. La publication des modèles reste limitée aux mocks, conformément au contrat disponible.

## Résultats et commandes

| Contrôle | Résultat |
| --- | --- |
| `npm run check`, FO et BO | 0 erreur, 0 avertissement. |
| FO : `node node_modules/vitest/vitest.mjs run --project server` | 56 fichiers, 232 tests. |
| FO : `node node_modules/vitest/vitest.mjs run --project client` | 30 fichiers, 73 tests. |
| BO : `node node_modules/vitest/vitest.mjs run` | 13 fichiers, 77 tests. |
| BO : `node node_modules/@playwright/test/cli.js test` | 62 scénarios. |
| ESLint ciblé des fichiers modifiés, FO et BO | Réussi. |
| Builds statiques FO et BO, mocks désactivés | Réussi. |
| `git diff --check`, FO et BO | Réussi. |
| `node scripts/sync-card-renderer.mjs --target=D:/Documents/KTD/encyclomestre --check`, depuis BO | Moteur partagé identique. |

Scénarios FO exécutés sur les cinq largeurs **360, 390, 768, 1024, 1440 px** :

- `node scripts/check-arcade.mjs` : pages connectées, deux colonnes téléphone, raccourcis de filtres et sélecteurs directs, sélection remplaçant la navigation, focus de modale, révélation et bilan.
- `node scripts/check-arcade-accessibility.mjs` : sept pages publiques et vingt-quatre destinations connectées ; absence de débordement, commandes de 44 px, réduction des mouvements, absence de son ; texte agrandi à 200 % à 360 et 1440 px.
- `node scripts/check-arcade-flows.mjs` : reprise après rechargement sans nouvelle ouverture, Express mémorisé, purge à la déconnexion, lot réellement borné par le stock et réponse réseau incertaine.
- `node scripts/check-arcade-gestures.mjs` : glissement de galerie sans consommation, déchirure dédiée et découverte avec animations normales.
- `$env:PLAN_TEST_BASE='https://dev.wikiforge.fr'; node scripts/check-plan-account.mjs` : inscription et sauvegarde des dix codes, authentificateur virtuel, ajout de passkey, régénération, récupération par code/lien et fermeture.
- Même base pour `check-plan-collection.mjs` : protection/déprotection, conflit de vente avec saisie conservée, premier message, brouillon, resynchronisation sans doublon, 145 cartes paginées, erreur puis reprise vers l’état vide.
- Même base pour `check-plan-progress.mjs` : lot épuisant le stock, cadrage d’avatar réutilisé sur le profil et propriété de guilde bloquant la fermeture.

Les captures collection/boosters/ouverture sont enregistrées dans `%TEMP%/encyclomestre-arcade`. Les scénarios bloquent explicitement les requêtes vers l’API de production. L’interaction tactile est simulée dans Chromium ; aucun déploiement, publication réelle de modèle ou validation sur appareil physique n’est inclus.
