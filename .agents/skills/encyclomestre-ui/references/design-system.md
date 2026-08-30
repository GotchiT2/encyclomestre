# WikiForge — ciel nocturne et énergie ambre

- Utiliser `bg-background` et `bg-card` pour les fonds bleu nuit ; `primary` est l’ambre des actions et repères, tandis que `energy` / `energy-soft` apportent le cyan réservé aux états secondaires, focus et halos.
- La typographie de l’interface est `Source Sans 3`, les titres de section `Inter`, les H1 et la typographie des cartes `Palatino Linotype`. `DBacks` est réservé au mot-symbole et aux chiffres mis en avant.
- Préférer les cadres fins ambre, les surfaces bleu nuit en dégradé et les angles coupés de `forge-panel`. Les bordures doubles historiques sont normalisées visuellement en cadre simple : ne pas créer de nouveaux doubles cadres.
- Garder les libellés courts, en capitales espacées via `forge-label`, et laisser les paragraphes éditoriaux en texte courant ; éviter les styles mono décoratifs pour le contenu principal.
- Les cartes conservent leur ratio et la composition partagée `CardTile`. Les images de template PNG sont préchargées au démarrage : ne pas introduire de nouveau template sans l’ajouter à la liste de préchargement.
- Préserver une interaction mobile immédiate : contrôles tactiles, pas de contenu exclusivement au survol, et aucun panneau fixe ne doit masquer la dernière action ou les cartes.
- Les couleurs d’étiquettes sont des données : afficher des labels courts bordés et garder le contrôle `+n` accessible au toucher.
