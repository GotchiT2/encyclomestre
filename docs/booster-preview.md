# Atelier des boosters

Le prototype se trouve sur `/boosters/apercu`. Il utilise uniquement des données locales,
sans paiement ni appel d’ouverture API. Cette route est accessible sans connexion ;
`+page@.svelte` conserve le layout racine et évite le layout authentifié des boosters.
La route `/boosters` conserve sa protection et son comportement actuels.

## Utilisation

- Six éditions : Quotidien, Chrome 2026, Nébuleuse, Arcade, Néon et Comics.
- « Voir le contenu » affiche les finitions et les stocks par sujet et parallèle.
- Une ouverture consomme le stock avant la révélation. Fermer sa fenêtre ne l’annule pas.
- La simulation est stockée dans `sessionStorage`, sous `wikiforge.boosters.preview.v1`.
  Un rechargement conserve les stocks ; « Réinitialiser la démo » rétablit leur état initial.
- Les scénarios au bas de la page permettent de tester le quotidien indisponible,
  Chrome expiré, le dernier exemplaire Nébuleuse, une édition épuisée et les images absentes.
- La galerie compare les cinq images dans les quinze variantes à 150 et 360 pixels.
  La face ne montre que le nom, le sceau d’édition et la gravure `X/max` éventuelle ;
  finition, édition, description et crédits restent dans la fiche détaillée.
- Les cartes sans `FULL_ART` gardent une composition verticale avec la description de la carte,
  limitée visuellement à deux lignes. Les full arts de source paysage ou logo utilisent une carte horizontale
  dédiée ; l’image entière est affichée avec `object-fit: contain`, sans flou ni recadrage
  destructeur.

## Données et règles de démonstration

`src/lib/components/boosters/preview/catalogue.ts` regroupe les fixtures et le moteur pur.
Les valeurs ne définissent pas les futures règles commerciales.

- `VisualVariant` conserve `id`, `name`, `color`, `styles` et ajoute `renderKey`.
  Ce dernier distingue des finitions partageant `FULL_ART`, comme Néon et Full art.
  `printRun` décrit la série, sans attribuer de numéro à une carte d’aperçu.
- `PreviewCard` référence le sujet, la variante et l’édition ; seul un exemplaire tiré
  possède `serial: { number, total }`.
- `PreviewPack` décrit la famille, l’édition, les variantes et la période éventuelle.
  Les thèmes n’ont pas d’échéance : ils quittent le catalogue ouvrable à stock nul.
- Les stocks sont des ensembles de numéros encore disponibles par paquet/édition,
  sujet et variante. Le tirage d’une spéciale est uniforme parmi les exemplaires restants.
  Le stock initial est volontairement déjà entamé et reproductible.
- Quotidien : cinq normales, 10 % de remplacement de la dernière par une full art,
  puis un délai de 24 heures. Chrome : cinq Chrome, 20 % de remplacement de la dernière
  par une full art Chrome numérotée ; uniquement des Chrome simples lorsque le stock
  numéroté est épuisé. Sa période va du 1er janvier 2026 au 1er janvier 2027 exclus, UTC.
- Thématique : quatre normales et une spéciale numérotée garantie, révélée en dernier.
  Les normales appartiennent aux Essentiels ; seule la spéciale porte l’édition thématique.
  Aucun exemplaire retiré ne peut être tiré à nouveau dans la session.

Le rendu reprend la composition du booster historique : bleu nuit, doubles filets, angles
coupés, gravures cuivre et sceaux SVG partagés entre le paquet et ses cartes. Chrome,
Nébuleuse, Arcade, Néon et Comics reprennent ces repères tout en changeant de matière,
d’ornement, d’emblème et de silhouette. Les finitions premium disposent d’un vernis interactif
piloté au pointeur, au focus et au toucher ; toutes les animations sont neutralisées avec
`prefers-reduced-motion`. Un aperçu numéroté affiche `X/99`, `X/50`, `X/10` ou `X/1` ;
le numéro réel n’apparaît qu’après l’ouverture, par exemple `7/10`.

Le rendu n’utilise aucune rareté. Les composants historiques `CardTile`, les collections,
les marchés et les contrats API restent inchangés. Un branchement réel devra faire
attribuer atomiquement les numéros et contrôler les droits d’ouverture par le serveur ;
le moteur local n’est pas destiné aux transactions réelles.

## Vérification

```powershell
npm run check
npx vitest run --project server src/lib/components/boosters/preview/catalogue.spec.ts
npx eslint src/lib/components/boosters/preview 'src/routes/boosters/apercu/+page@.svelte' src/routes/+layout.ts scripts/check-booster-preview.mjs
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174
```

Dans un autre terminal :

```powershell
node scripts/check-booster-preview.mjs http://127.0.0.1:5174
```

Le contrôle Playwright utilise une date fixe de septembre 2026, vérifie les parcours
ordinateur/mobile et écrit les captures dans `%TEMP%\wikiforge-booster-preview`.
Les sources et licences des cinq images sont documentées dans le dossier des assets.
