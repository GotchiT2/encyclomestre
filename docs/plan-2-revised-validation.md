# Plan 2 révisé — Arcade réinventée

Livraison locale sur `feat/arcade-experience`, dans Encyclomestre et le BO voisin. Le skill encyclomestre-ui est exclu. Les certificats locaux et les deux fichiers `vite.config.ts` sont conservés. Toutes les écritures de validation utilisent les mocks.

## Expériences livrées

- Navigation horizontale à partir de 1024 px, logo compact, destinations Collection/Souhaits/Boosters/Catalogue/Marché, communauté et compte contextuels. Une seule cloche ouvre les dernières notifications ; la destination reste accessible lorsque leur marquage lu échoue.
- Album en grille uniquement, avec 2/2/4/6/8 colonnes aux cinq largeurs cibles. Objet carte plafonné à 144 px hors inspection ; images paysage entières dans des emplacements stables. Les anciennes préférences de liste sont ignorées.
- Standard imprimé avec illustration délimitée et cartouche crème ; full art bord à bord avec repères de coin et titre contrasté ; chrome identifiable au repos, avec tranche et reflet directionnel. Les illustrations, cadrages, éditions et numéros proviennent toujours des définitions et des données du jeu.
- Quantités personnelles, amis, souhaits, engagements compatibles et tags sous les cartes. L’enrichissement existant conserve son cache par compte et sa limite de trois lectures simultanées. Aucun total mondial ou numéro d’édition ne remplace une quantité personnelle inconnue.
- Inspection agrandie depuis la grille, retour du focus, inclinaison au pointeur et commande de rotation utilisable au tactile. Un exemplaire personnel ne présente aucune variante. Un article liste toutes ses variantes disponibles avec de petites miniatures ; en choisir une remplace l’aperçu. La description et l’attribution se chargent indépendamment.
- Filtres directs et compacts, bouton général toujours accessible, recherche/tri serveur du catalogue, contexte URL et refus des réponses obsolètes conservés.
- Packs ouverts disposant de crédits connus en premier ; crédits présentés une fois par famille. Les autres packs restent consultables avec leur disponibilité. Express, ouverture simple et lot disponible confirmé réutilisent les opérations du contrat.

## Ouverture 3D

`pack-scene-engine.ts` est un moteur visuel Three.js chargé à la demande. Il ne contient aucun appel à l’API du jeu. L’emballage possède une épaisseur, des soudures et une surface plissée, un éclairage et des matériaux métalliques. La rupture, la séparation de l’emballage et la sortie des dos de cartes suivent une cérémonie d’environ 3,4 secondes après réception du résultat.

Une seule scène possède le contexte GPU pendant la cérémonie. La galerie libère le sien puis le reprend. Hors mouvement, le rendu ne maintient pas de boucle d’animation. Les ressources GPU, observateurs et événements sont libérés. Le moteur réduit résolution, anticrénelage et vernis selon les capacités annoncées par l’appareil.

Une illustration autorisée par CORS habille le pack. Sinon, l’identité typographique reste disponible. L’absence ou la perte de WebGL bascule vers le rendu DOM, en conservant le résultat et le temps déjà écoulé. Les cartes révélées et toutes les commandes restent en HTML. Le mode de réduction des mouvements évite le moteur 3D.

« Passer l’animation » est disponible pendant la cérémonie ; « Tout révéler » pendant la découverte. Express va au bilan. Le lot utilise une seule cérémonie. L’ordre serveur, le nombre réellement ouvert et les crédits actualisés sont conservés. La reprise relit les identifiants déjà obtenus sans nouvelle ouverture. Une réponse réseau incertaine resynchronise le jeu sans répéter l’écriture ni inventer les résultats.

## Recomposition des pages

| Parcours | Livraison |
| --- | --- |
| Landing | Présentation courte, cartes compactes, emballage en relief et accès compte immédiats. |
| Accueil joueur | Actions en attente à gauche, acquisitions compactes à droite ; séquence verticale sur mobile. |
| Connexion | Action passkey principale, récupération et aide contextuelle conservées. |
| Inscription | Pseudonyme puis passkey, codes à sauvegarder et entrée dans la collection ; saisie conservée. |
| Récupération | Code ou lien, conséquences au moment utile, création de passkey et nouveaux codes éphémères. |
| Documents légaux | Sommaire et liens entre documents, colonne de lecture et sections à compléter explicites. |
| Collection | Album dense, progression compacte, recherche et sélection alignées, raccourcis de filtre et barre de sélection. |
| Catalogue | Recherche dominante, tri direct, grille dense et distinction article/exemplaire. |
| Détail de carte | Inspection et informations contextuelles ; aucun comparateur ; variantes uniquement pour l’article. |
| Boosters | Galerie des packs ouvrables, informations adjacentes sur desktop ; voisins visibles et ouverture accessible sur mobile ; cérémonie dédiée. |
| Fiche pack | Emballage et disponibilité en tête, dates réelles, sections repliables et lien vers l’ouverture du pack. |
| Souhaits | Index des listes et grille active sur desktop ; sélecteur compact sur mobile ; invitations repliables et gestion contextuelle. |
| Enchères | Tuiles denses avec prix/échéance/état, favori compact, recherche et budget ; onglets défilants. |
| Détail d’enchère | Inspection et transaction adjacentes ; historique secondaire, frais et confirmation conservés. |
| Échanges | Plateaux Je donne/Je reçois visibles ensemble dès 1024 px ; deux onglets sur mobile, petites cartes sélectionnées et vérification avant envoi. La saisie et les sélections restent disponibles après modification de l’offre. |
| Amis | Contacts et actions directes ; demandes dans une zone distincte, ouverte à la demande sur mobile. |
| Messages | Conversations et discussion côte à côte dès 1024 px ; liste puis discussion sous ce seuil ; défilement interne conservé. |
| Guildes | Sa guilde en priorité ; sinon choix rechercher/créer, invitations séparées. |
| Fiche guilde | Discussion par défaut pour les membres, membres adjacents sur desktop, destinations contextuelles sur mobile et gestion selon droits. |
| Mon profil | Identité courte, vitrines et emplacements compacts, édition explicite et ventes. |
| Profil joueur | Identité lisible, relation et actions sur leur propre ligne mobile, vitrine compacte et collection filtrable. |
| Paramètres | Index de catégories et panneau actif sur desktop ; index puis catégorie sur mobile ; formulaires conservés et sauvegarde contextualisée. |
| Fermeture de compte | Parcours de sécurité distinct, conséquences, blocage de propriété de guilde et revérification conservés. |
| Succès | Récompenses disponibles en premier, objectifs compacts, succès terminés repliables. |
| Classements | Périodes, position personnelle, premiers joueurs compacts puis classement. |
| Notifications | Panneau depuis la cloche, fil compact Toutes/Non lues et destinations explicites. |
| Modération | Restrictions, dossiers compacts puis discussion avec réponse accessible ; restriction de messagerie respectée selon les règles propres à la modération. |
| Validation interne | Sources v1/v2, standard/full art/chrome, portrait/paysage, données manquantes, ouverture visuelle privée sans écriture. |

Les parcours préremplis, liens directs et ancienne adresse `/wishlist` restent disponibles. L’aperçu expérimental des boosters reste hors navigation.

## Studio BO

Le moteur partagé est identique entre les deux dépôts. Le profil Arcade adapte les anciennes définitions sans réécriture des versions publiées. Le profil source, les formats v1/v2, les révisions, imports/exports, styles inconnus et images locales éphémères restent disponibles.

Les propriétés Arcade pilotent effectivement composition, chrome, palette, orientation, titre, cadrage, finitions et numérotation. L’aperçu distingue miniature, détail et révélation. Annuler/rétablir conserve le travail. Sur mobile, la carte est placée avant la bibliothèque et reste visible au-dessus du panneau inférieur de propriétés. Les variantes et packs utilisent les rendus communs. Aucun service de publication backend n’est ajouté.

## Validation exécutée

| Contrôle | Résultat |
| --- | --- |
| `npm run check`, FO et BO | 0 erreur et 0 avertissement. |
| `npm test`, FO | 88 fichiers, 307 tests réussis. |
| Notifications et événement temps réel concurrent | Panneau et fil complet : navigation immédiate, relecture du compteur serveur après le marquage, aucun second décrément après un événement reçu avant la réponse. |
| `npm test`, BO | 13 fichiers, 77 tests réussis. |
| BO : tests `arcade-reinvented`, `studio`, `style-library`, `sandbox` | 33 scénarios réussis, réglages réels, annuler/rétablir, source, import/export et anciennes finitions. |
| `check-arcade-reinvented.mjs` | 22 pages aux cinq largeurs ; grille 2/2/4/6/8, cartes compactes, cloche unique, fiche personnelle/catalogue, notifications malgré erreur de marquage, plateaux/vérification/retour. Vraie scène WebGL, contexte perdu, animation passée et absence de WebGL. Un seul appel d’ouverture. |
| `check-arcade.mjs` à 390 px | Pages, filtres directs, sélection, clavier et ouverture. |
| `check-arcade-accessibility.mjs` | Pages publiques et joueur aux cinq largeurs, cibles de 44 px, silence et mouvements réduits ; texte à 200 % aux bornes 360/1440 px. |
| `check-arcade-gestures.mjs` | Déchirement et mouvements ordinaires aux cinq largeurs. |
| `check-arcade-flows.mjs` | Interruption/reprise, Express, déconnexion, stock épuisé et résultat réseau incertain aux cinq largeurs. |
| `check-plan-account.mjs` | WebAuthn virtuel, inscription avec codes non persistés, récupération code/lien, destination de connexion et fermeture aux cinq largeurs. |
| `check-plan-trades.mjs` | Invitation par pseudonyme, pagination page/curseur et exemplaire prérempli hors première page aux cinq largeurs. |
| `check-plan-progress.mjs` | Lot limité par le stock, crédits exacts, recadrage d’avatar et blocage de fermeture lié à la guilde aux cinq largeurs. |
| `check-community.mjs` | Relations, modération malgré restriction, guilde et droits, erreurs/conflits, cinq largeurs. |
| ESLint ciblé FO et BO | Réussi. |
| Builds statiques FO et BO, mocks désactivés | Réussis. |
| Synchronisation du moteur FO/BO et `git diff --check` | Réussis. |

Largeurs : 360, 390, 768, 1024 et 1440 px. Les tests navigateur utilisent Chromium avec émulation tactile ; ils ne constituent pas une certification sur appareils physiques ou Safari. Captures : `%TEMP%/encyclomestre-reinvented` et `wikiforge-bo/test-results`. La revue visuelle a corrigé les favoris qui chevauchaient les tuiles, le nom du profil comprimé sur mobile et les propriétés BO qui éloignaient l’aperçu.

Le premier lancement complet de Vitest a déclenché une réoptimisation des dépendances Vite ; le second a passé les 305 tests sans modification de la configuration HTTPS. Après ajout du scénario de compteur de notifications, les 307 tests ont passé. GitNexus a été réindexé en mode `--index-only`, puis ses contrôles de changements complétés par la revue des imports et les tests Svelte. Son graphe des composants Svelte reste incomplet.

GitNexus classe les changements préparés pour cette livraison à risque faible dans les deux dépôts. La comparaison cumulée FO avec `main` est critique (233 fichiers et 157 processus), car elle inclut aussi les plans précédents et le client API partagé `request`. La revue de ce symbole confirme que le présent commit ne modifie ni ce client ni les fichiers API ; les contrôles d’authentification, transactions et communauté ci-dessus vérifient les parcours concernés. Le résultat critique a été signalé avant le commit et n’est pas assimilé au classement de cette livraison.

L’album Panini avec pages de livre 3D constitue une étape future. Le moteur 3D visuel est séparé du jeu pour permettre cette évolution. Aucun push, déploiement ni publication réelle de modèle dans cette livraison.
