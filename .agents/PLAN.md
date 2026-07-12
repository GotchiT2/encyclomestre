# Plan de delivery — Encyclomestre

## Règle de suivi

Avant chaque commit, mettre à jour ce fichier : cocher l’étape réalisée et inscrire l’intitulé Conventional Commit associé. Une étape est donc traçable dans le diff du commit qui la livre.

## Foundation livrée

- [x] Socle i18n, landing et identité L’Alchimie Sombre — `feat(landing): add i18n foundation and registry showcase`
- [x] Mocks de cartes K-pop et pagination — `feat(codex): add k-pop card mocks and catalogue`
- [x] Collection, étiquettes colorées et sélection multiple — série `feat(collection): …`
- [x] Éditeur d’étiquettes et panneau de sélection extraits — `refactor(collection): extract reusable interaction modules`

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
