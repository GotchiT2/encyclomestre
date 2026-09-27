# Recommandations UX/UI WikiForge

Le contrat de référence est `docs/contracts/api.openapi.json` (117 opérations). La section front ci-dessous est livrée dans la refonte UX/UI. La section API reste une proposition backend, hors de cette livraison.

## Livré dans le front — 27 septembre 2026

| Priorité | Proposition                                                  | Écrans                                    | Mise en œuvre et critère de réussite                                                                                                                                                                                                   |
| -------- | ------------------------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Conserver les filtres et le défilement au retour d’une fiche | Collection, catalogue, guildes, wishlists | URL pour recherche/tri/page ; restauration du défilement et du focus sur la carte quittée. Le retour navigateur retrouve exactement le contexte.                                                                                       |
| P1       | Aider à comprendre les probabilités                          | Boosters et fiche édition                 | Représenter le nombre de cartes de chaque groupe et sa répartition. Afficher les taux déjà fournis par GET /packs/{id}, en distinguant chance par tirage et nombre de tirages. Ne pas inventer une chance globale d’obtenir une carte. |
| P1       | Réduire la densité des cartes                                | Collection, catalogue, enchères           | Garder titre, variante, numéro et prix/stock ; déplacer l’explication dans le détail. Conserver taille stable, image de repli, focus visible et accès tactile.                                                                         |
| P1       | Uniformiser les erreurs et confirmations                     | Tous les formulaires historiques          | Employer le même panneau d’erreur contextualisé, avec brouillon conservé et réessai explicite. Une actualisation réussie ne doit pas masquer l’échec d’une mutation.                                                                   |
| P1       | Brouillons locaux opt-in                                     | Échanges, vitrines, messages longs        | Stockage par compte et cible, durée courte et effacement à la déconnexion. Indiquer la restauration et demander confirmation avant remplacement. Aucun suivi d’enchère local.                                                          |
| P2       | Raccourcis d’activité sur l’accueil                          | Accueil                                   | Hiérarchiser messages, invitations et succès à encaisser, masquer les sections à zéro, garder les liens directs. Utiliser uniquement les compteurs /welcome et les sources déjà chargées.                                              |
| P2       | Recherche de membres dans la page courante                   | Guildes                                   | Filtrage local explicitement annoncé. Ne pas prétendre rechercher toute une guilde tant que l’API des membres n’expose pas de recherche.                                                                                               |
| P2       | Comparaison visuelle des variantes                           | Carte, édition                            | Comparer côte à côte les apparences de /variants pour les variantIds de l’article. Identifier les aperçus, sans les confondre avec des exemplaires détenus.                                                                            |
| P2       | Accessibilité des réordonnancements                          | Vitrine et sélections                     | Alternative clavier au glisser-déposer, annonce de la nouvelle position, cibles tactiles de 44 px et absence de dépendance au survol.                                                                                                  |
| P2       | Chargements plus sobres                                      | Tous les écrans                           | Distinguer chargement initial et actualisation. Garder les données visibles pendant un rafraîchissement, regrouper les lectures concurrentes et différer les images hors écran.                                                        |
| P2       | Expliquer les permissions                                    | Guildes et modération                     | Afficher pourquoi une action est indisponible et son effet. Ne pas faire disparaître la possibilité de répondre à la modération sous MUTE.                                                                                             |

## Nécessitent un contrat ou une évolution API

| Priorité | Besoin                                 | Contrat nécessaire                                                                                                  | Critère d’acceptation                                                                                              |
| -------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| P1       | Recherche globale d’enchères           | Paramètres combinables article/titre, variante, vendeur, phase, prix, tri et pagination stable                      | Une recherche trouve une enchère située hors de la page initiale ; nbResults reflète tous les filtres.             |
| P1       | Favoris persistants                    | Ajouter/retirer/lister les favoris et exposer l’état pour le lecteur                                                | Persistance entre appareils et sessions, sans mise ni prolongation artificielle de watch.                          |
| P1       | Historiques complets                   | Pagination des ventes et participations ; résultat personnel explicite après règlement                              | Parcours au-delà de 100 résultats et de 30 jours ; gagnée/perdue fiable même si le gagnant est masqué.             |
| P1       | Disponibilité uniforme des exemplaires | Dans collection et détails : enchère, vente immédiate ou échange actif, avec identifiant navigable lorsque autorisé | Les sélecteurs et cartes montrent immédiatement les blocages sans croiser plusieurs listes personnelles.           |
| P1       | Devis de frais                         | Frais déjà payés ou devis calculé lors d’une modification d’enchère                                                 | Complément exact même après plusieurs baisses et hausses ; aucun montant estimé trompeur.                          |
| P2       | Chat de guilde temps réel              | Événements documentés, curseur de reprise, notifications/non-lus si souhaités                                       | Réception sans polling, reprise sans doublon ni perte, suppression et accès révoqué correctement signalés.         |
| P2       | Membres de guilde recherchables        | Recherche et tri serveur sur GET membres                                                                            | Résultats complets au-delà de la première page, droits conservés côté serveur.                                     |
| P2       | Révoquer une invitation de guilde      | Opération dédiée et règle d’idempotence                                                                             | Retirer une invitation envoyée sans exclure un membre ni dissoudre la guilde.                                      |
| P2       | Retrouver ses signalements             | Historique joueur limité, statut public sans données de modération privées                                          | Accusé de réception durable et compréhension du traitement, sans divulguer preuves ni sanctions de tiers.          |
| P2       | Expliquer les résultats de recherche   | Métadonnées de plafonnement et de pagination du catalogue                                                           | Afficher explicitement une limite de 10 000 résultats et guider l’affinement sans fausse dernière page.            |
| P3       | Statistiques fiables de collection     | Nombre d’articles distincts, total du catalogue pertinent, date du calcul                                           | Afficher un vrai taux de complétion et distinguer articles uniques et exemplaires. /welcome.nbCards ne suffit pas. |

## Ordre conseillé

1. Uniformiser retours de formulaire, restauration du contexte et accessibilité.
2. Améliorer la lecture des cartes et des probabilités avec les données présentes.
3. Faire évoluer en priorité recherche, historique, favoris et disponibilité des cartes.
4. Ajouter le temps réel de guilde après publication et test du contrat d’événements.

Une recommandation d’API n’est pas une autorisation de modifier le backend. Aucun endpoint non documenté ne doit être simulé comme une capacité disponible en production.

## Corrections complémentaires livrées

Bannières persistantes en haut des pages avec fermeture manuelle par session ; sélecteurs de variantes compacts ; modale de détail commune avec comparaison visuelle ; pagination désactivée aux bornes ; filtres d’enchères repliables et résultats pleine largeur ; vocabulaire « carte » ; marges des signalements ; navigation des notifications indépendante du marquage lu.

Les variantes affichées sont celles référencées par la carte. Les aperçus ne prouvent pas la possession d’un exemplaire. La fermeture locale d’une bannière ne modifie jamais son état serveur.
