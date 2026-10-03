# Cartes WikiForge — templates CSS/JSON v3

Les compositions validées sont `atelier` (N3 normale) et `full-art` (photo dominante, titre en bas à gauche, flamme en bas à droite). Les six finitions supplémentaires sont des points de départ éditables du studio, pas une publication de nouvelles variantes.

## Fichiers prêts à importer

Les définitions complètes sont dans `static/cards/templates/v3/` : `atelier.json`, `full-art.json`, `chrome.json`, `prism.json`, `orbit.json`, `impact.json`, `circuit.json`, `eclipse.json`. Elles sont identiques dans le FO et le BO.

Dans le BO, ouvrir **Atelier des cartes**, choisir une composition, puis modifier ses propriétés. **Template JSON · renderKey** permet de coller un fichier, copier le JSON courant ou le télécharger. Dans **Variantes**, ce JSON remplace l'ancienne clé courte dans `renderKey`. Le champ reste une chaîne JSON ; aucun endpoint supplémentaire n'est utilisé.

Les styles de variante restent des métadonnées distinctes : `NORMAL` pour N3, `FULL_ART` pour les autres compositions et `CHROME` lorsque cette finition correspond effectivement à la variante. Le nom de variante ne s'imprime jamais sur le recto.

## Contrat de présentation

`schemaVersion: 3`, `minEngineVersion: 3` et `presentation.version: 1` distinguent le moteur CSS. Les sections historiques `visual`, `design` et `layout` sont conservées pour l'échange et la compatibilité. Pour une définition v3, `presentation` décide du rendu.

- `orientation` : `auto`, `portrait` ou `landscape`. En automatique, une image plus large que haute rend une full art paysage ; une image carrée reste portrait. Les cartes normales restent portrait.
- `portrait` et `landscape` : ratios CSS, initialement `5 / 7` et `7 / 5`.
- `style`, `landscapeStyle`, `compactStyle` : propriétés du cadre, avec surcharges paysage puis miniature (largeur inférieure à 170 px).
- `layers` : calques ordonnés, avec `id`, `content`, `parent` facultatif, `style` et surcharges `landscape`/`compact`. Un parent désigne un calque `group`. L'ordre des calques et `z-index` déterminent la superposition.
- `content` : `image`, `title`, `description`, `collection`, `serial`, `logo`, `group` ou `decoration`. Les quatre contenus image/titre/collection/logo sont obligatoires et uniques.
- `motion` facultatif : `trigger` (`active`, `pointer`, `reveal`), `duration` en ms, `easing`, `loop` et tableau `frames` de propriétés CSS. Les presets contiennent ces données complètes ; leurs noms ne déclenchent aucun effet caché.

L'illustration, le titre, la description, le nom de collection, la numérotation et la confidentialité proviennent de la carte. Ils restent séparés du template. Le cadrage est éditable via `object-fit` et `object-position` sur l'illustration. La flamme est le vecteur intégré de WikiForge ; sa taille, sa position et sa couleur sont éditables.

Les descriptions normales sont limitées au nombre de lignes entières réellement disponible, recalculé au redimensionnement et au chargement des polices. Le texte complet reste dans la fiche. La numérotation ne se rend que pour une full art et lorsqu'elle existe. Les informations du joueur restent sous la carte.

## Validation et anciennes sources

Les propriétés autorisées sont définies dans `src/lib/card-renderer/blueprint.ts`. Aucune URL décorative, ressource CSS externe, position fixe ou exécution de code n'est acceptée. Un template contient au maximum 48 calques, 12 étapes par animation et 131 072 caractères. Le Swagger ne déclare pas de limite de longueur pour `VariantDTO.renderKey` ; l'ancienne limite de 64 caractères était dans le BO.

Une saisie invalide conserve le dernier rendu valide et son brouillon. Les mouvements sont arrêtés avec la préférence système ou locale de réduction des animations. Les finitions se jouent sur la carte manipulée, focalisée ou révélée.

Les définitions v1/v2, les anciennes clés courtes et `tpl:id@revision` restent lisibles. Leur adaptation ne réécrit pas la source. Le studio permet de consulter, télécharger et prévisualiser la source conservée ; les anciens espaces de travail restent importables. Les images locales temporaires sont retirées de l'export et de la sauvegarde persistante.

## Contrôles reproductibles

Avec les deux serveurs locaux démarrés explicitement en mocks et les certificats fournis, lancer depuis le FO :

```powershell
node scripts/check-card-designs.mjs
```

Ce parcours vérifie les cinq largeurs 360/390/768/1024/1440, le texte agrandi, le titre long, les orientations, les descriptions, les brouillons invalides, l'import/export, l'annulation/rétablissement, les mouvements réduits et la concordance géométrique FO/BO. Les appels à l'API réelle sont bloqués. Les captures et mesures vont dans `%TEMP%/wikiforge-card-designs/`.

La validation ne publie aucun modèle et ne modifie pas les variantes en production. Le catalogue de publication conserve sa limite actuelle : disponible en mocks uniquement.
