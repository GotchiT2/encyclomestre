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

- [x] Brancher l’authentification WikiForge avec session locale et renouvellement de jeton — `feat(api): connect WikiForge authentication`

2. `feat(messages): build conversations and guild shares`

- [x] Créer la boîte de réception, les conversations mockées et les widgets de wishlist de guilde — `feat(messages): build conversations and guild shares`
- [x] Ajouter la navigation, les réponses, réactions et offres d’échange dans les fils — `feat(messages): add reactions replies and trade offer widgets`

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

## 9. Ventes liées aux exemplaires, wishlists publiques et responsive mobile

- [x] Recentrer le marché sur les enchères compactes, les timers et les filtres rétractables — `feat(market): compact auction marketplace`
- [x] Enrichir les ventes et les cartes avec états finaux, possession, wishlists et propriétaires — `feat(cards): enrich sale and ownership views`
- [x] Envoyer les identifiants des états sociaux de cartes dans un corps POST validé — `fix(api): post social-state card ids`
- [x] Éviter les appels d’états sociaux personnalisés sans session authentifiée — `fix(api): skip unauthenticated social states`
- [x] Brancher la recherche globale sur le catalogue public et préserver le focus de saisie — `feat(cards): use public page catalogue search`
- [x] Préserver les espaces de saisie avant de relancer la recherche globale — `fix(cards): preserve search whitespace`
- [x] Stabiliser le focus de recherche pendant les rafraîchissements du catalogue — `fix(cards): preserve focus during catalogue search`
- [x] Afficher le volume des résultats et leur répartition par rareté — `feat(cards): show catalogue rarity results`

- [x] Stabiliser l’ouverture rapide et la scène mobile des boosters, ordonner les révélations de C à L et contenir les illustrations Full Art paysage — `fix(boosters): stabilize mobile opening and full art rendering`
- [x] Créer et suivre les ventes liées aux exemplaires depuis le détail et la collection — `feat(market): create and track owned card listings`
- [x] Afficher les wishlists publiques et gérer le blocage des utilisateurs — `feat(social): expose public wishlists and user blocking`
- [x] Ajouter les rails de cartes contextuels et auditer le reflow mobile — `refactor(ui): add responsive contextual card rails`
- [x] Comparer les quantités possédées dans les sélecteurs d’échange, clarifier la mise en vente et restaurer le survol complet des cartes — `feat(cards): show cross-collection ownership`
