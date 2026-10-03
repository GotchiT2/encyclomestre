# Plan de delivery — Encyclomestre

## Règle de suivi

Avant chaque commit, mettre à jour ce fichier : cocher l’étape réalisée et inscrire l’intitulé Conventional Commit associé. Une étape est donc traçable dans le diff du commit qui la livre.

## Foundation livrée

- [x] Socle i18n, landing et identité L’Alchimie Sombre — `feat(landing): add i18n foundation and registry showcase`
- [x] Mocks de cartes K-pop et pagination — `feat(codex): add k-pop card mocks and catalogue`
- [x] Collection, étiquettes colorées et sélection multiple — série `feat(collection): …`
- [x] Éditeur d’étiquettes et panneau de sélection extraits — `refactor(collection): extract reusable interaction modules`

## Refonte visuelle WikiForge

- [x] Refonte de l’identité, des cartes, des grilles et de l’ouverture de booster — `feat(ui): redesign WikiForge cards and visual system`
- [x] Installer les fondations Forge Astrale et la navigation de jeu responsive — `feat(ui): build forge astral design foundation`
- [x] Recomposer l’accueil, les galeries, le détail de carte et la chambre de booster — `feat(ui): reforge core card experiences`
- [x] Harmoniser les espaces marché, échanges, social, profil et paramètres — `feat(ui): harmonize forge workspaces`
- [x] Valider la refonte complète, les tests et les états responsive — `test(ui): validate forge astral interactions`
- [x] Neutraliser les textes ésotériques et les références K-pop de l’interface — `fix(i18n): clarify factual interface copy`
- [x] Corriger les cartes, modales, filtres, raretés et étiquettes — `fix(ui): refine cards filters and tag controls`

## Plan de support — atomisation de l’interface

- [x] Extraire les contrôles de filtrage de la Collection — `refactor(collection): extract filter controls and card grid`
- [x] Extraire la grille de cartes et ses interactions de sélection — `refactor(collection): extract filter controls and card grid`
- [x] Centraliser la persistance locale des étiquettes dans un module de domaine — `refactor(collection): isolate tag persistence`
- [ ] Appliquer le même découpage aux prochaines routes créées ou modifiées — suivi continu

## Plan principal — nouvelles fonctionnalités

- [x] Versionner la roadmap fonctionnelle — `docs(plan): add main feature roadmap`

### 1. Session et accès protégé

- [x] Persister la session locale après connexion et inscription — `feat(auth): persist mock session`
- [x] Protéger Collection et profil ; conserver l’URL d’origine dans `redirectTo` — `feat(auth): guard private registry routes`
- [x] Ajouter la déconnexion et refléter l’état de session dans la navigation — `feat(auth): expose session controls in navigation`
- [x] Protéger le Codex et le détail de carte — `fix(auth): guard codex routes`
- [x] Verrouiller toutes les routes applicatives avec une garde globale — `fix(auth): require sessions across the application`

### 2. Codex et consultation des cartes

- [x] Ajouter recherche, filtres de rareté et pagination au Codex — `feat(codex): add searchable card filters`
- [x] Finaliser le détail d’une carte : métadonnées, possession et historique mocké — `feat(cards): complete registry card detail`

### 3. Profil et dimension sociale

- [x] Afficher les statistiques de collection et les étiquettes publiques du profil — `feat(profile): show collector registry summary`
- [x] Ajouter la consultation des amis détenteurs depuis le détail de carte — `feat(social): show friend ownership ledger`

- [x] Reconstruire le cabinet de profil : identité, vitrines, recherches et ventes mockées — `feat(profile): rebuild collector cabinet`

### 4. Échanges

- [x] Définir le contrat et les mocks d’offres d’échange — `feat(trades): add mock offer ledger`
- [x] Créer le registre des échanges et les actions d’acceptation/refus mockées — `feat(trades): build exchange register`

### 4.1 Interactions du registre

- [x] Créer une offre, consulter son détail et composer une contre-offre — `feat(trades): add trade composition flows`

### 4.2 Édition avancée des échanges

- [x] Ajouter les modales de détail et de composition, les contre-offres et les crédits — `feat(trades): refine exchange modals and credits`

### 4.3 Raffinement du drawer d’échange

- [x] Réorganiser les contreparties, les crédits et la sélection par onglets — `feat(trades): refine exchange drawer workflow`

### 4.4 Sélection performante des contreparties

- [x] Ajouter tri, pagination, avertissements de possession et action fixe — `feat(trades): optimize trade card selection`

### 4.5 Ergonomie des contre-offres

- [x] Compacter les contrôles et fiabiliser les crédits et le choix de contact — `fix(trades): polish counter offer controls`

### 4.6 Mise en page de l’éditeur

- [x] Étendre les filtres et ancrer l’action de confirmation — `fix(trades): align editor controls and action bar`

### 4.7 Stabilité mobile du registre

- [x] Corriger le débordement horizontal et les libellés de l’éditeur — `fix(ui): prevent horizontal overflow in trade editor`

### 4.8 Finition des contrôles de transaction

- [x] Corriger le select, l’espacement des crédits et la modale de détail — `fix(trades): polish trade detail controls`

### 4.9 Lisibilité du domaine Échanges

- [x] Reformater les composants et routes du registre d’échanges — `refactor(trades): format exchange components`

### 4.10 Actions conditionnelles du détail

- [x] Ajuster la grille de détail et limiter contre-offre et annulation — `fix(trades): constrain detail actions by offer status`

### 5.1 Paramètres du registre

- [x] Créer les préférences protégées et retirer les commentaires d’échange — `feat(settings): add registry preferences page`

### 5.2 Gestion du compte

- [x] Ajouter identité, blacklist, déconnexion et suppression du compte — `feat(settings): add account management controls`

### 5.3 Organisation des paramètres

- [x] Regrouper les préférences et centraliser leur sauvegarde — `refactor(settings): group preferences under one save action`

### 6. Collection avancée

- [x] Ajouter les contrats mock de wishlist et de réserve de packs — `feat(collection): add wishlist and booster reserve mocks`

### 6.1 Navigation et révélation de paquets

- [x] Ajouter la navigation latérale et la révélation guidée des paquets — `feat(app): add desktop sidebar and booster reveal`
- [x] Réinitialiser la navigation lors de l’ouverture d’un paquet suivant — `fix(boosters): reset reveal navigation for next pack`

### 6.2 Registre Wishlist

- [x] Créer la wishlist protégée, ses alertes, filtres, pagination et éditeurs — `feat(wishlist): add dedicated wanted card registry`
- [x] Ajouter les registres multiples, le croisement des amis et le troc prérempli — `feat(wishlist): implement multi-wishlist registry with proactive friends inventory matching, i18n integrations and redirect tests`
- [x] Afficher les transmissions de registres dans le canal de Guilde — `fix(wishlist): render guild share widgets`
- [x] Ajouter import, vue par détenteur et échanges groupés — `feat(wishlist): add owner summaries and grouped trade flow`
- [x] Centrer la création de wishlist et les confirmations d’échange — `fix(wishlist): center creation and trade modals`
- [x] Corriger l’ancrage des modales et importer depuis un lien partagé — `fix(wishlist): center modals and import shared links`
- [x] Réserver les panneaux à la recherche de cartes — `fix(wishlist): keep card search as the only drawer`
- [x] Ajuster la grille mobile et les actions de retrait — `fix(wishlist): improve mobile card removal visibility`
- [x] Aligner le champ d’import et son action — `fix(wishlist): align shared link import controls`

### 6.3 Détail de carte actionnable

- [x] Découper le détail, connecter wishlist, échanges et ventes actives — `feat(cards): complete actionable card detail`
- [x] Corriger la navigation des tuiles vers le détail — `fix(cards): restore detail links from card tiles`
- [x] Corriger le rendu des détails avec liens externes — `fix(cards): allow external links in card details`
- [x] Présenter le détail en modale et gérer les étiquettes de carte — `feat(cards): present details in modal with tag controls`

### 5. Qualité de livraison

- [ ] Ajouter des tests de flux pour chaque feature terminée — suivi continu
- [ ] Étendre les locales avant d’ajouter une nouvelle langue — suivi continu

## Vérification de chaque incrément

- `npm run check`
- ESLint ciblé
- Vitest pertinent
- `git diff --check`

## 7. Pages communautaires et progression — à venir

### 7.1 Amis — `/friends`

- [ ] Ajouter les contrats mock : liste d’amis, invitations reçues/envoyées, statut et dernière activité.
- [ ] Construire le registre d’amis avec recherche, filtres et états vides.
- [ ] Permettre l’ajout, l’acceptation, le refus et la suppression via modales centrées.
- [ ] Exposer les raccourcis « voir collection », « écrire » et « proposer un échange ».

### 7.2 Messages — `/messages`

- [ ] Remplacer le registre temporaire de partage par une boîte de réception complète : conversations, messages et widgets interactifs.
- [ ] Ajouter les mocks de canaux privés/guilde, pagination et accusés de lecture.
- [ ] Prévoir le composeur mobile-first, les réponses et l’ouverture des partages de wishlist.

### 7.3 Marché — `/market`

- [ ] Créer les contrats d’annonces, enchères, offres et historique de transaction.
- [ ] Construire le catalogue filtrable par carte, rareté, prix, type de vente et vendeur.
- [ ] Ajouter les parcours centrés de mise en vente, achat, enchère et annulation.
- [ ] Brancher les actions existantes « Voir le marché » et « Mettre en vente » sur ces flux.

### 7.4 Guilde — `/guild`

- [ ] Ajouter la guilde mock, ses membres, rôles, fil d’activité et objectifs collectifs.
- [ ] Créer le tableau de guilde : présentation, membres, invitations et annonces.
- [ ] Relier le canal de guilde de Messages et les partages de wishlist.

### 7.5 Succès — `/achievements`

- [ ] Définir les contrats de succès, progression, récompenses et catégories.
- [ ] Construire la vitrine de succès avec filtres, progression et détail en modale.
- [ ] Alimenter les états mock depuis collection, échanges, boosters et interactions sociales.

### 7.6 Classement — `/leaderboard`

- [ ] Ajouter les classements mock par collection, échanges, marché, guilde et période.
- [ ] Construire les tableaux responsive, podium et recherche de joueur.
- [ ] Exposer les liens vers les profils publics et les critères de calcul.

### Ordre de livraison proposé

1. `feat(friends): build social friend registry`

- [x] Commencer le branchement WikiForge du catalogue, de la collection, des boosters et du détail carte — `feat(api): start WikiForge catalogue collection and boosters integration`

- [x] Brancher l'authentification WikiForge avec session locale et renouvellement de jeton — `feat(api): connect WikiForge authentication`
- [x] Migrer la connexion vers OAuth2, charger le profil courant et révoquer les sessions — `feat(auth): migrate login to OAuth2`
- [x] Isoler OAuth2 et `/me` sur l'API Cards tout en gardant l'API historique pour le reste — `fix(auth): route OAuth through cards API`
- [x] Suivre le nouvel endpoint de profil OAuth2 `/me` — `fix(auth): use current user endpoint`
- [x] Adapter le profil OAuth2 au modèle de session existant avant la redirection — `fix(auth): normalize OAuth current user`
- [x] Préserver la session OAuth2 lorsqu’une route historique renvoie 401 — `fix(auth): retain OAuth session on legacy errors`
- [x] Transmettre le Bearer OAuth2 aux appels du catalogue Cards — `fix(cards): authorize public catalogue requests`

2. `feat(messages): build conversations and guild shares`

- [x] Créer la boîte de réception, les conversations mockées et les widgets de wishlist de guilde — `feat(messages): build conversations and guild shares`
- [x] Ajouter la navigation, les réponses, réactions et offres d’échange dans les fils — `feat(messages): add reactions replies and trade offer widgets`
- [x] Ancrer les fils de discussion en bas à l’ouverture et à la réception — `fix(messages): keep conversation scroll at bottom`

3. `feat(market): build listings and bidding flows`

- [x] Créer le catalogue d’annonces du marché, ses filtres et son détail — `feat(market): build listing catalogue and filters`
- [x] Ajouter le détail des enchères, l’historique des mises et la modale de prix — `feat(market): add auction detail and price telemetry`
- [x] Ajouter les registres de ventes et la persistance des enchères — `feat(market): add auction registers and bid persistence`
- [x] Ajuster les actions et favoris des registres d’enchères — `fix(market): refine auction register actions and favorites`

4. `feat(guild): build guild workspace`

- [x] Démarrer l’espace de Guilde avec objectif, membres et accès au canal — `feat(guild): start guild workspace`

5. `feat(achievements): build progression registry`
6. `feat(leaderboard): build competitive rankings`

- [x] Aligner les profils publics sur le cabinet avec vitrines, recherches, ventes et collection filtrable — `feat(friends): align public profiles with showcase and collection tabs`

- [x] Démarrer le registre d’amis, ses invitations et raccourcis sociaux — `feat(friends): build social friend registry`
- [x] Ajouter les profils publics et collections des amis — `feat(friends): show friend profiles and collections`

## 8. Branchement API WikiForge

- [x] Brancher les contrats OpenAPI pour l'authentification, les cartes, la collection, les profils, les amis, le marché, les échanges, les wishlists, la messagerie, le dashboard, les guildes, les boosters, les tags et les filtres — `feat(api): connect complete WikiForge platform`
- [x] Renouveler les sessions expirées sur les réponses 401/403 et rediriger les sessions irrécupérables — `fix(auth): recover expired API sessions`
- [x] Désactiver le préchargement des routes de détail au survol des cartes — `fix(cards): prevent detail requests on hover`
- [x] Adapter la hauteur de la modale de détail à son contenu sur desktop — `fix(cards): size detail modal to content`
- [x] Stabiliser le premier rendu de la collection sans navigation de filtre implicite — `fix(collection): prevent initial grid reload`
- [x] Rendre le menu des étiquettes hors du panneau découpé — `fix(collection): prevent tag selector clipping`
- [x] Normaliser les raretés et filtrer toutes les recherches de cartes par variante — `feat(cards): add card variant filters`
- [x] Charger toutes les cartes des wishlists, stabiliser les filtres et choisir la liste depuis le détail — `fix(wishlist): complete card selection flows`
- [x] Charger le catalogue de cartes à la demande et le paginer dans les wishlists — `fix(wishlist): lazy-load card catalogue`
- [x] Centrer les recherches de cartes, fiabiliser les suppressions et ouvrir le détail sans route dédiée — `fix(wishlist): center card flows and fix deletions`
- [x] Compacter les sélecteurs de cartes et maintenir leur pagination visible — `fix(cards): pin picker pagination`
- [x] Rendre rétractables tous les panneaux de recherche de cartes — `feat(cards): collapse search panels`
- [x] Recentrer le bouton de fermeture des modales compactes — `fix(dialog): center close icon`
- [x] Stabiliser les suppressions, les chargements sociaux, les wishlists et les réactions — `fix(api): stabilize social and wishlist flows`
- [x] Intégrer les UUID de variantes, les réponses hydratées et la composition Full Art — `feat(api): integrate collectible variants`
- [x] Brancher les cartes recherchées sur le catalogue complet, centrer les éditeurs et stabiliser la largeur des pages sous modale — `fix(collection): connect searched cards and center dialogs`
- [x] Recomposer l’ouverture des boosters avec cartes retournées, halos de rareté, interactions desktop/mobile et mode rapide — `feat(boosters): build immersive opening sequence`
- [x] Ouvrir le détail des cartes révélées et ajouter des propagations lumineuses au survol, au focus et au toucher — `feat(boosters): open card details from reveals`
- [x] Relancer la recharge des boosters, conserver la dernière révélation mobile et fiabiliser le détail responsive — `fix(boosters): refine recharge and mobile experience`
- [x] Placer le détail au-dessus des menus, confirmer le récapitulatif mobile et rééquilibrer les halos — `fix(boosters): polish mobile reveal interactions`
- [x] Empiler les modales imbriquées et préremplir les échanges depuis le détail — `fix(cards): stack nested dialogs and prefill trades`
- [x] Compacter les informations du détail et renforcer la présence visuelle de la carte — `refactor(cards): emphasize card in detail modal`
- [x] Maintenir les onglets du détail visibles au-dessus des actions sur mobile — `fix(cards): keep detail tabs visible on mobile`
- [x] Centraliser la vue marché et le graphe de prix dans une modale partagée — `feat(market): centralize card market modal`
- [x] Adapter les amis et wishlists au mobile, puis reconstruire la messagerie en liste et discussion responsive — `fix(social): rebuild responsive friends and messages`
- [x] Compacter les interactions, les espacements et le registre d’amis sur tous les écrans — `fix(ui): improve interaction density and friends layout`
- [x] Séparer les demandes reçues, exposer les relations et stabiliser les profils publics — `fix(friends): surface relationship states and stabilize profiles`
- [x] Remplacer le registre global des échanges par les flux reçus, envoyés et historiques — `fix(trades): connect split trade ledgers`
- [x] Afficher les participants et résoudre les cartes d’échange depuis les UUID d’exemplaires — `fix(trades): hydrate participants and traded cards`
- [x] Verrouiller la modale d’offre, séparer les cartes par propriétaire et masquer les identifiants techniques — `fix(trades): stabilize offer detail modal`
- [x] Limiter le chargement initial aux offres reçues et différer les autres registres, collections et partenaires jusqu’aux actions utilisateur — `perf(trades): defer collection hydration`
- [x] Charger les cartes d’échange par filtres et pages limitées — `fix(trades): lazy-load filtered card pages`
- [x] Afficher la première page de l’onglet d’échange actif — `fix(trades): show initial card page`
- [x] Charger les cartes détaillées d’une wishlist nommée avec son endpoint hydraté dédié — `perf(wishlist): load registry cards in one request`
- [x] Charger les deux côtés d’un échange avec l’endpoint hydraté dédié sans parcourir les collections — `perf(trades): load detailed cards in one request`
- [x] Présenter chaque échange comme une vue bilatérale détaillée avec cartes, crédits, actions et accès direct aux messages — `feat(trades): build bilateral offer summaries`
- [x] Consommer les cartes embarquées des registres et créer ou retrouver les conversations directes depuis les échanges — `perf(trades): consume embedded cards and direct messages`
- [x] Limiter les effets de rareté à un reflet neutre sur les illustrations PC/R et adoucir l'inclinaison 3D — `feat(cards): add subtle rarity illustration effects`
- [x] Étendre les effets foil progressifs de PC à Full Art sans masquer les illustrations — `feat(cards): add progressive foil profiles`
- [x] Remplacer les bandes foil artificielles par un vernis spéculaire piloté par l'angle — `fix(cards): replace artificial foil bands`
- [x] Répartir la brillance foil et renforcer sa progression sur les raretés supérieures — `fix(cards): balance foil brightness`
- [x] Dockeriser le frontend SvelteKit et fournir la stack Portainer de production — `feat(deploy): add Portainer frontend stack`
- [x] Ajouter les stacks TrueNAS sans build Portainer et le clonage Git au démarrage — `feat(deploy): add TrueNAS repository stacks`
- [x] Générer un build statique SPA destiné à Nginx — `feat(deploy): generate static frontend build`

## 9. Ventes liées aux exemplaires, wishlists publiques et responsive mobile

- [x] Recentrer le marché sur les enchères compactes, les timers et les filtres rétractables — `feat(market): compact auction marketplace`
- [x] Enrichir les ventes et les cartes avec états finaux, possession, wishlists et propriétaires — `feat(cards): enrich sale and ownership views`
- [x] Envoyer les identifiants des états sociaux de cartes dans un corps POST validé — `fix(api): post social-state card ids`
- [x] Éviter les appels d’états sociaux personnalisés sans session authentifiée — `fix(api): skip unauthenticated social states`
- [x] Brancher la recherche globale sur le catalogue public et préserver le focus de saisie — `feat(cards): use public page catalogue search`
- [x] Préserver les espaces de saisie avant de relancer la recherche globale — `fix(cards): preserve search whitespace`
- [x] Stabiliser le focus de recherche pendant les rafraîchissements du catalogue — `fix(cards): preserve focus during catalogue search`
- [x] Afficher le volume des résultats et leur répartition par rareté — `feat(cards): show catalogue rarity results`
- [x] Construire les images du catalogue public avec Special:FilePath — `fix(cards): use Wikipedia file paths`
- [x] Charger le détail public dans la modale du catalogue — `feat(cards): load public detail in catalogue modal`
- [x] Prioriser la pertinence des recherches textuelles et propager les curseurs de collection — `feat(cards): use relevance and cursor pagination`
- [x] Adopter la pagination hybride et les filtres canoniques de la collection WikiForge — `fix(collection): adopt wikiforge hybrid pagination`
- [x] Brancher les étiquettes, la protection et leurs indicateurs sur WikiForge — `feat(collection): connect wikiforge collection actions`
- [x] Migrer les wishlists vers les listes, partages et invitations WikiForge — `feat(wishlist): connect wikiforge wishlist workflows`
- [x] Rétablir les actions d’ajout de cartes et contextualiser les erreurs wishlist — `fix(wishlist): restore card addition actions`
- [x] Afficher l’état vide quand une wishlist ne contient aucune carte — `fix(wishlist): handle empty list responses`
- [x] Aligner le dimensionnement des cartes wishlist sur la grille partagée — `fix(wishlist): size cards in registry grid`
- [x] Confirmer les ajouts de cartes sans fermer les modales wishlist — `feat(wishlist): toast successful card additions`
- [x] Brancher l’inventaire et l’ouverture des boosters sur WikiForge — `feat(boosters): connect wikiforge booster workflows`
- [x] Remplacer le polling de recharge des boosters par un réveil unique à échéance — `fix(boosters): avoid repeated inventory polling`
- [x] Découpler la collection de l’ancien enrichissement social et compléter son action de relance — `fix(collection): remove obsolete social hydration`
- [x] Distinguer les recherches de cartes vides des erreurs API — `fix(cards): handle empty search responses`
- [x] Finaliser le chargement après une réponse de collection filtrée par tag — `fix(collection): settle tag filter loading`
- [x] Séparer visuellement la protection et le nombre d’exemplaires sur les cartes — `fix(cards): separate protection and ownership indicators`
- [x] Harmoniser le mode sélection et ajouter la protection groupée — `feat(collection): improve bulk selection actions`
- [x] Renouveler les sessions WikiForge avant l’expiration du jeton d’accès — `fix(auth): refresh wikiforge sessions before expiry`
- [x] Limiter tous les appels API à 12 secondes et signaler leur expiration — `fix(api): timeout requests after twelve seconds`
- [x] Adopter les compteurs de possession, l’accueil et les registres sociaux WikiForge — `feat(api): adopt Wikiforge welcome and social contracts`
- [x] Utiliser directement les URL d’images retournées par WikiForge — `fix(cards): use API image URLs directly`
- [x] Interpréter les registres sociaux WikiForge vides comme des listes vides — `fix(friends): handle empty social payloads`
- [x] Aligner les contrats sociaux et le profil courant sur le Swagger WikiForge — `fix(api): align social and profile contracts`
- [x] Relier les paramètres WikiForge au filtre visuel NSFW des cartes — `feat(settings): add NSFW content filters`

- [x] Stabiliser l’ouverture rapide et la scène mobile des boosters, ordonner les révélations de C à L et contenir les illustrations Full Art paysage — `fix(boosters): stabilize mobile opening and full art rendering`
- [x] Créer et suivre les ventes liées aux exemplaires depuis le détail et la collection — `feat(market): create and track owned card listings`
- [x] Afficher les wishlists publiques et gérer le blocage des utilisateurs — `feat(social): expose public wishlists and user blocking`
- [x] Ajouter les rails de cartes contextuels et auditer le reflow mobile — `refactor(ui): add responsive contextual card rails`
- [x] Comparer les quantités possédées dans les sélecteurs d’échange, clarifier la mise en vente et restaurer le survol complet des cartes — `feat(cards): show cross-collection ownership`

## 10. Migration vers le Swagger WikiForge enrichi (non commitée)

- [x] Centraliser les identifiants, erreurs codifiées, dates UTC, images directes, `nsfw` et tailles de pages déduites.
- [x] Étendre la collection aux wishlists, au tag exclusif `-1`, aux collections et tags d’amis et aux réponses `CardDTO` des mutations.
- [x] Migrer la messagerie vers les conversations et messages par interlocuteur, avec curseurs, lecture implicite et événements d’échange.
- [x] Étendre les échanges aux montants, contre-offres, cartes ajoutées/retirées, rôles courants et rafraîchissements associés.
- [x] Ajouter les illustrations de wishlist, l’avatar `/me`, le solde d’accueil, la sécurité `logout-all` et le cas booster épuisé.
- [x] Mettre à jour les mocks et tests ; aucun commit ni push avant confirmation.
- [x] Publier la migration Swagger, les flux d’échange compacts et leurs validations — `feat(api): complete WikiForge Swagger migration`

## 11. Ajustements visuels et interactions

- [x] Aligner le guide d’interface sur les couleurs et polices actuelles — `docs(ui): align WikiForge design guidelines`
- [x] Choisir l’avatar depuis la collection personnelle — `feat(settings): choose avatar from personal collection`
- [x] Précharger les cadres de cartes et rendre le solde global visible — `feat(layout): preload card assets and surface player balance`
- [x] Afficher les illustrations et fiabiliser les interactions des wishlists — `feat(wishlist): polish registry illustrations and interactions`
- [x] Aligner les grilles sur les pages de 48 cartes — `fix(cards): align grids to 48-card pages`
- [x] Préserver le cadrage circulaire des avatars de conversation — `fix(messages): clip conversation avatars`
- [x] Ouvrir le détail depuis toute la tuile d’échange — `fix(trades): make offer tiles fully actionable`
- [x] Versionner les illustrations de templates pour invalider le cache CDN — `fix(cards): version card template assets`

## 12. Profils et registres WikiForge enrichis (non commitée)

- [x] Connecter les profils complets et réduits, leur visibilité et les collections d’amis autorisées.
- [x] Remplacer la vitrine fictive par l’éditeur `/me/showcase` et l’achat d’emplacements.
- [x] Ajouter les ventes fixes de profil, leur retrait et leur achat immédiat.
- [x] Rendre la visibilité obligatoire dans les paramètres et l’édition des étiquettes.
- [x] Ajouter les classements global, quotidien et hebdomadaire ainsi que le rang d’accueil.
- [x] Étendre les mocks et les tests de contrats associés ; aucun commit ni push sans confirmation.
- [x] Rétablir le cabinet de profil historique avec vitrines WikiForge et ventes fixes réelles.
- [x] Exposer la dernière connexion dans les profils, les amis et la session avec une présence accessible.
- [x] Finaliser les vitrines, ventes fixes, profils publics et présence de messagerie — `feat(profile): complete wikiforge profile workspace`

## 13. Notifications WikiForge

- [x] Ajouter le centre de notifications, la synchronisation SSE, les préférences en attente du backend et les modales d’amis enrichies — `feat(notifications): add realtime notification center`
- [x] Attendre la session validée, synchroniser les domaines concernés et partager l’agrégat d’accueil — `fix(realtime): target session refreshes`

## 14. Performance de navigation

- [x] Réutiliser la session validée du profil et paralléliser ses lectures indépendantes — `perf(profile): parallelize profile loading`

## 15. Actions groupées et liens sociaux des cartes

- [x] Ajouter les opérations groupées de collection et wishlist, les wishlists partagées et le filtre de rareté du classement.
- [x] Afficher les amis détenteurs dans les recherches de cartes et préparer un échange par rareté sans quitter le détail.
- [x] Ajouter la sélection groupée du catalogue vers une wishlist et fiabiliser le rendu des résultats publics — `feat(cards): add bulk wishlist and social ownership flows`

## 16. API WikiForge unique

- [x] Aligner les paramètres sur le corps complet de `/me` et retirer les appels de l’API historique sans équivalent WikiForge — `refactor(api): remove legacy API workflows`

## 17. Variantes et packs WikiForge

- [x] Remplacer la rareté par le catalogue de variantes, partager le rendu des cartes et brancher les packs actifs — `feat(cards): migrate rarity model to variants and packs`
- [x] Intégrer le catalogue détaillé des packs, leurs statuts, groupes de tirage et stocks globaux — `feat(boosters): integrate detailed pack catalogue`

## 18. Succès WikiForge

- [x] Ajouter le registre des succès, ses récompenses réclamables, son badge et sa synchronisation SSE — `feat(achievements): add claimable achievement registry`

## 19. Contrats Swagger WikiForge enrichis

- [x] Migrer les inventaires de boosters par famille et emplacement, l’ouverture groupée, l’accueil, les préférences de succès et les notifications de guilde — `feat(api): align enriched WikiForge contracts`

## 20. Expérience des boosters

- [x] Recomposer le catalogue et le détail des packs, ajouter la recherche de stock et fiabiliser les cartes Full Art portrait/paysage — `feat(boosters): refine pack opening experience`

## 21. Protection Turnstile

- [x] Protéger la connexion et l'ouverture des boosters avec Turnstile et exposer le frontend local sur HTTPS sans port explicite — `feat(security): add Turnstile verification`

## 22. Enchères, bannières et signalements WikiForge

- [x] Regrouper le catalogue de boosters par emplacement et afficher les états dans chaque section.
- [x] Afficher les bannières actives, suivre leurs mises à jour SSE et respecter leur date UTC de fin.
- [x] Ajouter la consultation, le suivi, les plafonds, les enchères personnelles et la création/modification/annulation côté joueur.
- [x] Ajouter les signalements d’articles, les enchères de profils, les soldes bloqués, notifications et succès d’enchères.
- [x] Aligner les mocks et les tests de contrat pour les parcours joueurs.

Validation terminée (check, ESLint ciblé, tests unitaires, build et diff) : `feat(wikiforge): add auctions banners and reports`.

## 23. Refonte du parcours des enchères et des signalements

- [x] Isoler le contrôleur de détail : lectures regroupées, absence de boucle réactive, renouvellement watch à 60 secondes et nettoyage à la navigation.
- [x] Distinguer Explorer, Mes ventes, Mes participations et Historique ; conserver les paramètres d’URL et expliciter les filtres limités à la page.
- [x] Réutiliser la composition des cartes, afficher leurs caractéristiques, ajouter l’agrandissement et les liens de contexte.
- [x] Extraire les formulaires de création, mise et gestion vendeur ; confirmer les actions, conserver les saisies sur erreur et interdire les doubles envois.
- [x] Centraliser les listes personnelles, le solde bloqué et l’association exemplaire–enchère dès l’arrivée dans le FO.
- [x] Partager le dialogue de signalement d’article ; documenter les contrats manquants pour le signalement de joueurs et leurs preuves.
- [x] Replacer les bannières dans la colonne principale pour que la navigation et la pagination restent accessibles.
- [x] Étendre les mocks, les tests de cycle réseau et de navigation aux cinq largeurs ; ajouter `scripts/check-auctions.mjs`.
- [x] Brancher les signalements joueurs et contextuels à partir du Swagger JSON fourni (étape 24).
- [ ] Recherche serveur globale et favoris persistants : nécessitent une évolution API, détaillée dans `docs/api-auctions-reporting-needs.md`.

Sujet de commit prévu : `fix(auctions): rebuild browsing and stabilize realtime detail`.
Validation : `npm run check` sans erreur ni avertissement ; ESLint ciblé réussi ; Vitest 69 fichiers / 209 tests réussis ; `scripts/check-auctions.mjs` réussi à 360, 390, 768, 1024 et 1440 px ; build statique et `git diff --check` réussis. Le README contient les instructions de reprise et de lancement des parcours mock.
Aucun changement backend ni déploiement inclus. Les écritures de validation passent exclusivement par les mocks.

## 24. Couverture du Swagger joueur et intégration communautaire

- [x] Conserver le Swagger JSON fourni, générer les 87 schémas TypeScript et documenter les 117 opérations avec leurs écrans et modules.
- [x] Ajouter recherche/création/édition de guilde, invitations, adhésion, départ, dissolution, pagination des membres, permissions et transfert de propriété.
- [x] Ajouter le chat de guilde paginé, ses pièces jointes carte/article, les états indisponibles et les wishlists de guilde en lecture seule.
- [x] Exposer les cinq cibles et six motifs de signalement dans les profils, vendeurs, échanges, messages, guildes et articles ; conserver le commentaire après conflit.
- [x] Ajouter les restrictions actives et dossiers de modération ; autoriser la réponse à un dossier ouvert sous MUTE ; intégrer les notifications correspondantes.
- [x] Préserver le partage de wishlist avec la guilde dans les requêtes complètes, conserver les URL d’images et permettre le retrait de l’illustration.
- [x] Ajouter encaissement global des succès, retrait des tags en lot, navigation article/édition, variantes d’article et consultation paginée des pools.
- [x] Compléter accueil/profils/avatars, dates UTC, contraintes DTO, historique des échanges et éligibilité des exemplaires ; conserver le brouillon d’échange après échec.
- [x] Séparer 401 et 403, borner la récupération SSE, réutiliser la conversion des messages HTTP/SSE et respecter les curseurs serveur.
- [x] Étendre mocks et tests de contrat ; tester les transitions de guilde, les conflits et réponses de modération dans le navigateur aux cinq largeurs.
- [x] Livrer `docs/fo-handoff.md`, `docs/api-fo-coverage.md` et `docs/ux-ui-recommendations.md` ; actualiser les besoins API désormais résolus pour les signalements.

Sujet de commit prévu : `feat(community): complete Swagger guilds moderation and player workflows`.

Validation : check sans erreur ni avertissement ; ESLint ciblé ; Vitest 70 fichiers / 226 tests ; parcours Playwright `check-auctions.mjs` et `check-community.mjs` à 360, 390, 768, 1024 et 1440 px ; inspection visuelle mobile ; build statique réussi ; vérification du diff. Aucun commit, push, déploiement ou changement backend dans cette étape. Les recommandations API restent des propositions documentées, pas des opérations fictives du FO.

## 25. UX/UI transverse sans changement backend

- [x] Bannières sticky dans le layout global, fermeture par compte/session et respect des retraits/expirations serveur ; compensation des filtres fixes.
- [x] Sélecteur compact de variantes, recherche, sélection simple/multiple et clavier ; lectures publiques par carte, aperçus et comparaison de styles.
- [x] Modale commune depuis les cartes, guildes et enchères ; anciennes URL de carte converties en ouverture du catalogue et de la modale, restauration du focus.
- [x] Filtres d’enchères repliables, résultats pleine largeur, paginations aux bornes et historique des curseurs dans le sélecteur d’exemplaires.
- [x] Navigation de notification indépendante du marquage lu ; marges des signalements et confirmations ; remplacement des libellés article par carte.
- [x] Brouillons opt-in 24 heures par compte/cible, confirmation de restauration et nettoyage ; erreurs de formulaire conservées.
- [x] Activités pertinentes sur l’accueil, recherche locale des membres, permissions explicites, emplacements visuels des tirages, commandes clavier de vitrine et chargements discrets.
- [x] Contexte de collection restauré par snapshot, paramètres des wishlists dans l’URL ; mocks et tests de régression complétés.
- [x] Guide de reprise et recommandations actualisés ; besoins backend conservés séparément.

Sujet de commit prévu : `feat(ux): unify card details and improve player workflows`.
Validation finale : `npm run check` sans erreur ni avertissement ; ESLint ciblé sur 152 fichiers ; Vitest 77 fichiers / 248 tests réussis ; parcours `check-auctions.mjs`, `check-community.mjs` et `check-ux.mjs` réussis à 360, 390, 768, 1024 et 1440 px ; inspection visuelle mobile ; build statique et `git diff --check` réussis. Écritures exclusivement mock, requêtes de production interdites par les scripts. Aucun commit, push, déploiement ni modification backend.

## 26. Livraison consolidée et besoins API pour Claude

- [x] Regrouper les parcours enchères, communauté et UX/UI validés des étapes précédentes dans la livraison demandée.
- [x] Documenter les besoins API restants, leurs critères d’acceptation et la suppression de son propre compte dans `docs/claude-api-requirements.md` ; copie identique dans le BO.
- [x] Relier le document au guide de reprise. Les contrats proposés ne sont pas branchés comme endpoints existants.

Sujet du commit consolidé : `feat(fo): complete player workflows and shared card experience`.
Les validations de l’étape 25 couvrent les changements de code livrés ; cette dernière étape ajoute uniquement la documentation. Aucun push, déploiement ni changement backend. Le fichier IDE local reste exclu.

## 27. Moteur partagé de modèles de cartes

- [x] Moteur HTML/CSS synchronisé depuis le BO, définition versionnée et données d’exemplaire séparées.
- [x] Conservation des clés `tpl:`, résolution publique à la demande, cache/coalescence, protection contre les réponses anciennes et repli standard.
- [x] Modèles mock, tests du catalogue et du composant, parcours navigateur de publication et de modèle absent.
- [x] Contrat pour Claude et guide de reprise actualisés. Backend, publication réelle et déploiement hors de cette étape.

Sujet prévu pour un futur commit : `feat(fo): render versioned shared card templates`. Aucun commit demandé pour cette étape.

Validation finale : check sans diagnostic, ESLint ciblé, 255 tests dans 79 fichiers, parcours navigateur `check-card-templates.mjs` et `check-ux.mjs` à cinq largeurs, build statique et diff vérifiés. Les lectures de modèles absents sont couvertes par le parcours navigateur mock. Aucune écriture de test en production.

- [x] Rendu des modèles partagé épuré : retrait du logo, des noms de modèle/variante et du libellé de composition ; titre et numérotation conservés. Synchronisation BO/FO. Aucun commit demandé.

## Moteur partagé de l’atelier libre

- [x] Synchronisation du moteur v2 : surfaces éditables, cadres rectangulaires, CSS isolé validé, finitions indépendantes dont néon et logo optionnel dans les données de rendu.
- [x] Migration des définitions v1 et conservation des anciennes clés/rendus ; les aides BO restent absentes du FO.
- [x] Contrat Claude et guide de reprise actualisés, branchement réel du logo conditionné au Swagger backend.
- [x] Check, ESLint ciblé, suite complète de 265 tests puis 14 tests du composant incluant le nouveau test de halo au pointeur ; build statique validé.

Sujet proposé pour un futur commit : `feat(fo): support editable versioned card surfaces`.
Aucun commit, déploiement ou changement backend effectué.

## Livraison Git — 27 septembre 2026

- [x] Regroupement des changements validés de l’atelier et du moteur partagé pour publication sur `main`.
- Sujet Conventional Commit : `feat(fo): render editable versioned card templates`.
- Publication demandée par l’utilisateur ; aucun déploiement ni changement backend.

## Synchronisation de la bibliothèque graphique BO

- [x] Douze modèles et vingt-quatre styles explicites synchronisés depuis le moteur canonique BO ; anciennes révisions mock conservées, données réelles de carte prioritaires.
- [x] Aucune évolution de DTO, publication réelle ou changement du parcours des cartes FO.
- [x] Check sans diagnostic, ESLint ciblé, suite de 266 tests Vitest puis 4 tests ciblés du catalogue après le dernier ajustement, build statique, diff et identité des fichiers partagés validés.

Aucun commit, push ou déploiement demandé pour cette étape.

- [x] Catalogue partagé : titres des douze préréglages systématiquement en bas, sans réécriture des compositions personnalisées. Check et tests ciblés du catalogue validés.

## Commit du catalogue partagé

- [x] Livraison des modèles full art et styles partagés synchronisés avec le BO.
- Sujet Conventional Commit : `feat(cards): sync full-art preset catalogue from backoffice`.
- Commit local demandé ; aucun push ni déploiement.

## Évolution API — 28 septembre 2026

- [x] Recherche serveur des enchères, pagination et filtres dans l’URL ; vues personnelles, résultats explicites, favoris persistants et devis avant confirmation.
- [x] Fermeture de compte avec conséquences, mot de passe, bloqueurs et vérification après erreur réseau sans répétition automatique.
- [x] Délai du pseudo via nameChangeAvailableAt et erreur 429 atomique ; autres préférences modifiables et brouillon conservé.
- [x] Engagements DTO des exemplaires, bornes du catalogue, progression à la demande, recherche membres serveur, révocation des invitations et chat SSE avec rattrapage.

Validation : check et ESLint, tests unitaires et build ; parcours navigateur mock aux cinq largeurs 360, 390, 768, 1024 et 1440 px. Aucun appel d’écriture en production, changement backend, déploiement, commit ou push.

## Passkeys — API 1.2.0

- [x] Branche `passkey` créée depuis le `main` courant, connexion explicite et finalisation OAuth partagée.
- [x] Gestion dans les paramètres FO et `/security` BO ; contrôle ADMIN avant stockage.
- [x] Ajout, liste, suppression, déconnexion globale, erreurs traduites et conservation temporaire du défi sans stockage sensible.
- [x] Turnstile action passkey et jeton unique ; aucune répétition automatique d’écriture.
- [x] Mocks, contrats et authentificateur virtuel aux cinq largeurs ; voir `docs/passkeys.md`.

Aucun commit, push, déploiement ou changement backend dans cette étape.

Validation finale : check sans erreur ni avertissement, ESLint ciblé, 282 tests FO, build statique et diff validés. Parcours Playwright WebAuthn virtuel en mock aux cinq largeurs ; action Turnstile et jetons renouvelés couverts par test de composant FO.

## Aide de connexion passkey FO

- [x] Précise qu’une passkey doit d’abord être enregistrée dans les paramètres du compte.
- [x] Remplace le message d’annulation WebAuthn par une aide pour vérifier la passkey disponible sur l’appareil.
- Sujet Conventional Commit : `feat(auth): add passkey login and management`.

## Plan 1 — bugs, fonctions et parcours de collection — 1er octobre 2026

Plan approuvé par l’utilisateur. Apparence et composition des cartes conservées ; les skills UI/UX sont écartés à sa demande. Les mentions de mots de passe dans les étapes historiques ci-dessus décrivent l’ancien contrat, remplacé par la revérification passkey/code de secours.

- [x] Ensemble 1 : Swagger fourni (134 opérations), types et couverture ; landing et pages de compte/légales publiques ; inscription, récupération, codes éphémères, passkeys et fermeture revérifiée ; navigation et actualisation des données de référence.
- [x] Ensemble 2 : protection/déprotection et cession depuis la collection ; filtres tri-état, reprise et réponses obsolètes ; catalogue et contexte article/exemplaire ; invitations de wishlist par nom, opérations multiples ; packs, crédits et ouvertures réelles limitées par le stock.
- [x] Ensemble 3 : filtres d’enchères sans identifiants saisis, union des souhaits, favoris et devis ; ventes immédiates compatibles avec les échanges ; préremplissage d’échange indépendant de la première page, pagination par page et curseur, historique borné.
- [x] Ensemble 4 : premier message et resynchronisation, relations fiables et confirmations ; guilde et chat visible ; vitrines/profils et avatar recadré commun ; paramètres complets, succès, classements, notifications et dossiers de modération.
- [x] Mocks étendus au nouveau contrat : compte neuf, collections nombreuses, erreurs, conflits, champs omis, dates relatives, stock limitant l’ouverture et propriété de guilde bloquant la fermeture.
- [x] Parcours navigateur spécifiques : WebAuthn virtuel, sauvegarde des codes, récupération par code/lien, premier message, protection et vente, pagination, invitation par pseudonyme, avatar et crédits ; cinq largeurs 360, 390, 768, 1024 et 1440 px.
- [x] Validation finale consolidée : Svelte sans erreur ni avertissement, 295 tests dans 84 fichiers, lint ciblé, revue visuelle et parcours navigateur aux cinq largeurs, build statique et diff validés.

Détail par page et commandes : `docs/plan-1-validation.md`. Les écritures de validation utilisent les mocks ; aucun push, déploiement ou changement backend. Les textes légaux définitifs et la refonte graphique appartiennent aux livraisons ultérieures.

- [x] Livraison du Plan 1 sur la branche `feat/plan-1-collection-parcours` ; commit local demandé par l’utilisateur.
- Sujet Conventional Commit : `feat(collection): complete player flows and fix usability bugs`.

## Déploiement sûr et variables publiques figées — 30 septembre 2026

- [x] Variables publiques lues via `$env/static/public` (module `src/lib/api/public-env.ts`) : valeurs intégrées aux fichiers hashés, plus de `_app/env.js` mis en cache un an.
- [x] `deploy.ps1` : arrêt sur tout code de sortie non nul (build, ssh, scp), refus d’un `.env` sans `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH` ou `SSH_KEY_PATH`, et d’un `DEPLOY_PATH` racine ou personnel ; `build/index.html` exigé avant tout geste distant. Script identique BO/FO.

Validation : check, ESLint, 282 tests (84 fichiers, composants navigateur compris), build sans `_app/env.js`, garde-fous du script testés avec un `.env` factice sans action distante.
Sujet Conventional Commit proposé : `fix(deploy): inline public env at build time and harden deploy script`.

## Plan 2 — Arcade contemporaine

Plan approuvé : nouveau rendu de toutes les cartes, interface mobile, boosters immersifs silencieux et éditeur BO commun. Skill encyclomestre-ui exclu. Branche feat/arcade-redesign ; aucun déploiement ni publication serveur.

- [x] Identité, composants, rendu commun et éditeur BO.
- [x] Collection, catalogue, fiches, sélection et filtres compacts.
- [x] Galerie de boosters, cérémonie, Express et reprise.
- [x] Transactions, communauté, compte et progression.
- [x] Mocks, scénarios aux cinq largeurs, contrôles FO/BO et parité du moteur.

Validation finale : checks FO/BO sans diagnostic ; 305 tests FO et 77 tests BO, 62 scénarios BO ; parcours FO aux cinq largeurs, cibles tactiles, texte agrandi, sélection, filtres directs, ouvertures, reprise, conflits, compte et avatar. ESLint ciblé, builds statiques sans mocks, parité du moteur et diff validés. Voir `docs/plan-2-validation.md`.

Les certificats et `vite.config.ts` sont conservés. GitNexus : index FO reconstruit après corruption FTS ; contrôle des changements avant commit. Aucun push, déploiement ou publication réelle de modèle.

Sujet Conventional Commit : `feat(ui): redesign player experience with Arcade identity`.

## Plan 2 révisé — Arcade réinventée

Branche : `feat/arcade-experience`. Le skill encyclomestre-ui est exclu. Validation avec mocks ; configuration HTTPS et certificats locaux conservés.

- [x] Navigation horizontale, cartes standard/full art et moteur partagé ; studio adapté.
- [x] Album, catalogue, inspection contextuelle, souhaits et filtres compacts.
- [x] Packs ouvrables prioritaires, cérémonie 3D, Express et reprise.
- [x] Plateaux d’échange, marché et vitrines.
- [x] Communauté, compte, progression et notifications recomposés.
- [x] Validation aux cinq largeurs, clavier, mouvements réduits, checks, tests et builds FO/BO.

Validation : checks FO/BO sans diagnostic ; 307 tests FO, 77 tests BO et 33 scénarios du studio. Parcours aux cinq largeurs, WebGL et repli, compte, transactions, communauté et compteur de notifications concurrent ; lint ciblé, builds sans mocks, parité du moteur et diff validés. Voir `docs/plan-2-revised-validation.md`.

Sujet Conventional Commit : `feat(ui): reinvent Arcade navigation and player journeys`.

## Correctifs UX/UI — WikiForge

Branche : `feat/arcade-experience`. Skill encyclomestre-ui exclu ; certificats et `vite.config.ts` conservés. Validation exclusivement en mocks.

- [x] Modales stables, marges, selects, identité WikiForge et tooltips.
- [x] Filtres directs, recherche d’étiquettes et création/attribution immédiate FRIENDS.
- [x] Suppression de la progression, brouillons, Tabs d’échange, vitrines pleine largeur et notifications par famille.
- [x] Validation des animations, parcours et contrôles techniques FO/BO.

Sujet Conventional Commit : `fix(ui): stabilize dialogs and refine WikiForge controls`.

Validation : 317 tests FO, 77 tests BO, cinq scénarios du studio ; checks sans diagnostic, builds FO/BO, lint ciblé, rendu partagé et diff validés. Soixante ouvertures de dialogue contrôlées sur 1 031 images aux cinq largeurs, mouvements normaux et réduits, sans déplacement du centre. Parcours collection, vente, messages, notifications, échanges et pagination vérifiés en mocks. Voir docs/ui-corrections-validation.md.

## Boosters WikiForge — plateau, dessins et cérémonie ; corrections des compositions

Branche `feat/arcade-experience`. Périmètre FO uniquement ; skill encyclomestre-ui exclu. Configuration HTTPS et certificats locaux conservés. Validation exclusivement avec les mocks sur `https://dev.wikiforge.fr`.

- [x] Plateau de sélection, dock des packs ouvrables, crédits uniques par famille, consultation des autres packs et gestes équivalents aux boutons.
- [x] Dessins vectoriels Signal/Circuit/Prisme, dos communs, texture typographique et correction des intersections responsables des perforations du booster.
- [x] Cérémonie Three.js/DOM, commandes HTML, découverte libre, finitions réelles, douze cartes par page, Express et animation passée.
- [x] Acquisition séparée de la scène, verrou, reprise par identifiants, migration des reçus, réponse incertaine, déconnexion, visibilité et perte WebGL.
- [x] Corrections supplémentaires demandées : marges des succès, filtres sans barre horizontale et selects harmonisés, recherche/tri pleine largeur et panneau opaque, badge/prix des enchères, demandes d'amis élargies, largeur disponible du site.
- [x] Svelte sans diagnostic, 328 tests FO (92 fichiers), lint ciblé, build FO sans mocks et contrôle du diff ; 26 scénarios d'ouverture et 30 visites des pages corrigées. Captures aux cinq largeurs cibles, mouvements ordinaires/réduits, vidéo et images intermédiaires ; contrôle supplémentaire à 1920 px.

GitNexus : analyses avant modification et index actualisé avant contrôle des changements. Le routeur des mocks a une portée critique signalée avant intervention ; modifications limitées aux ouvertures et fixtures de validation, suite complète réussie. Aucun changement du BO ni déploiement. Voir `docs/booster-room-validation.md`.

Sujet Conventional Commit : `feat(boosters): rebuild opening room and refine player layouts`.

## Ouverture — supprimer les noms de rareté

- [x] Retirer les noms sous les dos et la légende des finitions ; masquer le nom de variante imprimé sur les rectos uniquement dans le plateau d'ouverture. Titres, couleurs, effets et dimensions conservés, y compris en Express et dans le bilan.
- [x] Validation en mocks à 360 et 1440 px, Découverte/Express ; dix tests ciblés, Svelte sans diagnostic, lint, build FO et contrôle du diff réussis. GitNexus : impact faible, contrôle des changements avant commit.

Sujet Conventional Commit : `fix(boosters): hide variant names in opening results`.

## Ouverture mobile — ancrer la fenêtre au viewport

- [x] Ajouter un mode plein écran explicite au dialogue et l'utiliser pour l'ouverture. Supprimer l'héritage des translations de centrage et les annulations CSS du plateau ; couvrir la largeur du viewport, y compris en présence d'une gouttière de défilement.
- [x] Contrôler l'origine et les dimensions de la fenêtre dans le scénario navigateur existant pendant la requête et après la cérémonie. Les 26 scénarios passent aux cinq largeurs ; 348 images contrôlées en émulation mobile Chromium/WebKit après navigation, défilement et rotation, mouvements ordinaires/réduits. Sept tests ciblés, Svelte, lint, formatage, build FO et diff validés. GitNexus avant modification et avant commit.

Sujet Conventional Commit : `fix(boosters): anchor opening dialog to mobile viewport`.

## Enchère depuis une carte et navigation continue des boosters

- [x] Le formulaire charge ses prérequis par compte, indépendamment de la validation globale de la session restaurée. Lectures partagées, reprise explicite des erreurs et garde contre les données d'un autre compte ; frais et confirmation conservés.
- [x] Remplacer les remontages SVG/WebGL entre packs par un carrousel de dessins persistants avec relief CSS. Déplacement horizontal continu, gestes tactiles, sélection directe, dock et clavier ; arrêt immédiat de l'inertie en mouvements réduits. La cérémonie d'ouverture conserve Three.js.
- [x] Cinq régressions du formulaire, contrôles navigateur des 20 combinaisons Chromium/WebKit, cinq largeurs et deux modes de mouvement ; aucun saut vertical, objet remplacé ou acquisition pendant la navigation. Création depuis la fiche à 390/1440 px, 26 scénarios d'ouverture et changements rapides à 1868 px validés en mocks.
- [x] Svelte sans diagnostic, 16 tests ciblés, ESLint et Prettier ciblés, build FO sans mocks et contrôle du diff réussis ; index GitNexus actualisé et changements contrôlés avant commit. 5 791 images du carrousel vérifiées.

Sujet Conventional Commit : `fix(ui): unblock card auctions and smooth booster navigation`.

## Boosters sans crédit, prochaines recharges et numérotation des tirages — 3 octobre 2026

- [x] Conserver tous les packs ouverts dans le carrousel et le dock, même sans crédit connu ou disponible ; permettre leur sélection par lien direct. Le balayage sur la soudure d'un pack vide navigue sans lancer d'acquisition. Le message de réserve vide ne déplace pas le paquet.
- [x] Afficher les prochaines recharges Premium et Premium+ d'après les dates API, en heures/minutes/secondes pour les délais longs ; une seule réserve par famille. À l'échéance, attendre la confirmation API du nouveau crédit.
- [x] Numéroter les emplacements de probabilités à partir de 1, en continu entre les groupes de tirage.
- [x] Validation en mocks : 14 tests ciblés, Svelte sans diagnostic, ESLint/Prettier ciblés, build FO sans mocks et diff validés. Les 26 scénarios d'ouverture et les 20 combinaisons de carrousel Chromium/WebKit passent aux cinq largeurs, mouvements ordinaires/réduits ; contrôle visuel des minuteries et des probabilités à 390/1440 px. GitNexus avant modification et contrôle des changements avant commit.

Sujet Conventional Commit : `fix(boosters): retain empty packs, show recharges and number draws`.

## Enchères — dates préremplies et durées rapides

- [x] Préremplir le début à l'heure locale actuelle et conserver un départ immédiat au moment de la confirmation. Ajouter « Maintenant » pour revenir à ce mode après programmation.
- [x] Ajouter les durées 30 min, 1 h, 6 h, 12 h et 24 h depuis le début choisi ; recalculer la fin après modification du début. Une fin manuelle désactive la durée sélectionnée. Préserver devis, confirmation et limites serveur.
- [x] Validation exclusivement en mocks : 13 tests ciblés, départ immédiat après attente, programmation UTC, modification des dates et écriture unique. Création depuis une fiche aux cinq largeurs 360/390/768/1024/1440 px, WebKit mobile et texte agrandi ; aucun débordement ni appel de production. Svelte sans diagnostic, lint/formatage ciblés, build FO et diff réussis. GitNexus avant modification et avant commit ; HTTPS, certificats et BO conservés.

Sujet Conventional Commit : `feat(auctions): prefill dates and add duration shortcuts`.

## Identité WikiForge — flamme Taillée et formats web — 3 octobre 2026

Branche `feat/arcade-experience`. Commit local demandé après validation ; aucun déploiement. Skill encyclomestre-ui exclu. HTTPS, certificats, BO et clés de stockage conservés.

- [x] Reconstruire la proposition 01 en vecteurs et vectoriser le nom WikiForge depuis Barlow Condensed Black ; variantes sombre, claire et monochromes, signatures horizontales/empilées et dessin optique 16 px.
- [x] Remplacer les anciens monogrammes et logotypes dans l'en-tête, la connexion, l'accueil, les cartes, les boosters/dos et leurs rendus de secours, y compris l'aperçu expérimental. Préserver les logos spécifiques fournis par les données.
- [x] Préparer 31 SVG, 52 PNG, favicon ICO, icônes Apple/installation/maskable, manifeste et image de partage ; sources de génération, inventaire et licences joints.
- [x] Centrer verticalement le symbole et le nom dans le header, sans espace de descente typographique ; conserver une cible d'au moins 44 px.
- [x] Vérifier 155 combinaisons de pages/largeurs en mocks, 26 scénarios d'ouverture, 28 tests ciblés et l'en-tête dans Chromium/WebKit à six largeurs avec texte normal/agrandi. Svelte sans diagnostic, lint/formatage ciblés, syntaxe Python, build FO sans mocks et diff validés.

GitNexus avant les modifications et contrôle des changements : portée faible sur les symboles indexés ; imports Svelte et nouveaux fichiers vérifiés directement. Captures et documentation : `docs/branding/wikiforge-taillee/`. Les modifications préexistantes d'AGENTS.md et les anciens fichiers de proposition restent hors de cette livraison.

Sujet Conventional Commit : `feat(branding): integrate WikiForge flame identity and web assets`.

## Cartes validées — N3 et full art photo dominante — 3 octobre 2026

- [x] Direction validée : N3 normale avec description, full art avec flamme en bas à droite et texte discret en bas à gauche ; numérotation seulement full art.
- [x] Moteur CSS/JSON v3 partagé FO/BO, styles/calques/animations éditables, lecture v1/v2 et anciennes clés conservée. Sept fichiers du moteur strictement identiques entre les deux projets.
- [x] N3 et full art, six finitions éditables d'exploration, huit JSON prêts à importer ; studio visuel, variantes JSON, titres longs, orientations 5:7/7:5 et description ajustée aux lignes disponibles. Sources et styles inconnus conservés.
- [x] Validation exclusivement en mocks : Svelte sans diagnostic ; 361 tests FO, 94 tests BO, 28 scénarios navigateur de compatibilité ; parcours du nouveau studio aux cinq largeurs, texte agrandi, import/export, brouillons invalides, annulation/rétablissement, sauvegarde de variante, mouvements réduits et concordance FO/BO normale/full art portrait/paysage. Lint ciblé, builds FO/BO et diff validés.

HTTPS et certificats conservés ; skill encyclomestre-ui exclu. Aucun déploiement ni publication réelle.

Documentation : `docs/cards/templates-v3.md`. Captures et mesures : `%TEMP%/wikiforge-card-designs/`. GitNexus exécuté avant les changements et en contrôle final : portée élevée FO / critique BO sur les chemins communs de templates, couverts par les validations d'import, chargement, création et sauvegarde en mocks. Aucun commit effectué pour cette étape.


## Détail d’enchère et livraison FO — 3 octobre 2026

- [x] Carte inspectable au clic sans bouton redondant ; description puis historique ouvert par défaut, métadonnées répétées retirées.
- [x] Panneau persistant à droite sur desktop et fixé au-dessus de la navigation mobile, hauteur mesurée et espace réservé ; une seule instance du formulaire conserve sa saisie entre les tailles d’écran.
- [x] Timer dominant, date exacte en petit dessous, informations secondaires dans un dialogue. Avatars recadrés vendeur/meneur, lecture légère et cache dédupliqué par visite, initiales et meneur masqué conservés.
- [x] Mise rapide immédiate au minimum serveur, dépassement du plafond personnel, verrou contre double appel. Confirmation manuelle et récupération du surplus maintenues. Saisie vidée après succès, conservée après conflit/actualisation, erreurs locales et serveur actualisées avec la saisie.
- [x] Validation en mocks : Svelte sans diagnostic, 57 tests ciblés (enchères, cache, JSON et rendu), lint ciblé et build FO. Revue navigateur aux cinq largeurs 360/390/768/1024/1440, texte agrandi, défilement, focus, hauteur réduite, changement de largeur, conflit et phases ; 16 mesures de géométrie, aucune requête de production.
- [x] Livraison des cartes CSS/JSON précédemment validées avec ces corrections d’enchère. GitNexus contrôlé avant les changements et avant commit : portée élevée sur les treize flux communs du rendu, couverts par les tests ; contrôle manuel des compositions Svelte et du cache d’identités.
- Sujet Conventional Commit : feat(fo): add configurable cards and persistent auction bidding.

Captures et mesures : %TEMP%/wikiforge-auction-detail/. Vite, certificats, clés de session et préférences préservés. Skill encyclomestre-ui exclu. Commit local demandé ; fichiers IDE, AGENTS généré et outillage .claude hors livraison. Aucun push ni déploiement.


## Illustrations absentes et historique des mises — 3 octobre 2026

- [x] Rendu de remplacement commun avec flamme Taillée et nom WikiForge, anthracite/crème/jaune. Les images absentes, le chemin de remplacement de l’API et les échecs de chargement ne sont plus recadrés comme une photographie ; une vraie image rétablit son orientation. API et définitions JSON conservées.
- [x] Avatars recadrés dans l’historique des mises, initiales après échec et icône générique pour joueur masqué. Cache commun vendeur/meneur/auteurs dédupliqué par visite, avec trois lectures simultanées maximum et garde contre les réponses obsolètes.
- [x] Explication des mises remplacée par le texte demandé, avec paragraphes et saut de ligne, via svelte-i18n.
- [x] Validation exclusivement en mocks : Svelte sans diagnostic, 33 tests ciblés, lint, build et contrôle du diff. Revue à 360/390/768/1024/1440 px ; logo entier, orientation portrait sans illustration, reprise d’image, avatars, texte exact et lecture de profil unique contrôlés.
- [x] GitNexus avant modification : portée critique identifiée sur le convertisseur de cartes, laissé intact ; composants Svelte non indexés vérifiés directement. Contrôle final des chemins attendus et absence de changement d’API.

Captures : C:/Users/benja/.codex/artifacts/fo-card-avatar-corrections/. BO, Vite et certificats préservés ; skill encyclomestre-ui exclu. Livraison par commit local demandé sur feat/arcade-experience. Sujet Conventional Commit : fix(fo): brand missing illustrations and show bid history avatars. Aucun push ni déploiement.
