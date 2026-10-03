# Templates Prestige signés — format v4

Les fichiers `static/cards/templates/v4/prestige-rose-champagne.json` et `prestige-karina-platinum.json` sont des définitions complètes pour **Template JSON · renderKey**. Ils nécessitent le moteur 4 dans le BO et le FO ; les formats v1–v3 restent lisibles.

## Import dans l'atelier

1. Choisir une composition full art, puis ouvrir **Template JSON · renderKey**.
2. Coller le JSON de l'artiste. La photo, le titre, la collection et la numérotation proviennent toujours de la carte ou du contenu d'aperçu.
3. Sélectionner **Signature** dans les commandes de la carte ou la hiérarchie des calques. Modifier les propriétés CSS existantes pour changer sa couleur, sa position, ses dimensions, sa rotation ou son opacité.
4. Télécharger le template ou copier son renderKey. Le calque peut être supprimé et restauré avec l'annulation ; un export sans signature revient au format v3.

Dans **Variantes**, conserver le style `FULL_ART` et copier le JSON dans renderKey. Chaque variante signée est réservée à son artiste : ne pas appliquer le template Rosé à d'autres pages. Les signatures sont intégrées dans la définition, sans fichier externe, nouvel endpoint ni téléversement SVG.

## Géométrie vectorielle

Un calque `content: "signature"` possède `signature: {viewBox, paths, transform?}`.

- `viewBox` : quatre nombres, avec une largeur et une hauteur strictement positives.
- `paths` : de 1 à 16 chaînes de chemins SVG, limitées à 32 768 caractères chacune. Commandes et nombres valides uniquement, sans balisage ni référence à une ressource.
- `transform` facultatif : les six nombres d'une matrice SVG. Cette matrice conserve les transformations des fichiers originaux.
- Nombres finis, de valeur absolue au maximum 10 000 000. La limite globale de renderKey reste de 131 072 caractères.
- Zéro ou un calque signature par définition. Une signature impose `schemaVersion: 4` et `minEngineVersion: 4`. `presentation.version` reste à 1.

Le rendu utilise des éléments SVG natifs, `fill="currentColor"` et `preserveAspectRatio="xMidYMid meet"`. Aucun SVG brut n'est exécuté. Les métadonnées des fichiers fournis ne sont pas importées.

## Compositions et aperçus

Rosé utilise un fond prune, des accents champagne et rose, avec une signature verticale en bas à droite. Karina utilise un fond bleu nuit, des accents platine et bleu, avec une signature horizontale dans la partie basse. Les deux compositions sont portrait 5/7, avec un seul filet métallique et un reflet contrôlé par les interactions existantes ; la réduction des animations est respectée.

Les captures dans `docs/cards/previews/v4/` sont des aperçus : photos locales existantes, numéro de démonstration 17/99. Rosé est cadrée à droite dans la photographie BLACKPINK ; le cadrage reste éditable pour une autre illustration. Crédits photographiques : K-POPIT et 10Asia, CC BY 3.0, sources déjà documentées dans l'atelier. Les tracés reprennent les deux SVG fournis par l'utilisateur.

## Vérification reproductible

Démarrer les deux serveurs en mocks (`PUBLIC_API_MOCK_ENABLED=true`), puis depuis le BO :

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://127.0.0.1:5180'
$env:PRESTIGE_FO_URL = 'https://127.0.0.1:5181'
npx playwright test --config playwright.cards.config.ts tests/prestige-templates.spec.ts
```

Le parcours vérifie les signatures originales, l'édition, l'import/export, le téléchargement, la sauvegarde locale, l'annulation, la suppression, les états sans image et titre long, les animations réduites, ainsi que la géométrie BO/FO à 144, 220 et 380 px. Les captures sont produites avec le véritable moteur FO. La validation n'écrit pas en production.

