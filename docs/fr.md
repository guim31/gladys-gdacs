# GDACS

Suivez depuis Gladys les grandes catastrophes naturelles du monde : séismes, cyclones tropicaux,
inondations, éruptions volcaniques, sécheresses et feux de forêt, tels que les classe
[GDACS](https://www.gdacs.org) (Global Disaster Awareness and Coordination System, une coopération des
Nations unies et de la Commission européenne). Chaque événement reçoit un niveau d'alerte vert, orange
ou rouge, selon son impact humanitaire attendu.

L'intégration garde les événements de **votre zone** : un rayon autour de votre maison, les pays que vous
choisissez et, si vous le souhaitez, toutes les alertes rouges du monde (famille à l'étranger, voyages).
Pas de compte, pas de clé d'API.

C'est un complément, pas un système d'alerte de sécurité : en cas d'urgence, suivez les consignes des
autorités locales. Non affiliée à GDACS, à la Commission européenne ni aux Nations unies.

## Ce que vous obtenez

- Un appareil **Alertes GDACS** : nombre d'alertes en cours dans votre zone, niveau d'alerte le plus haut,
  dernier événement (en toutes lettres) et distance de l'événement le plus proche, avec leur historique.
- Un **widget de tableau de bord** qui liste les alertes en cours, du niveau le plus haut au plus proche,
  chacune avec son rapport GDACS.
- Deux **déclencheurs de scène** : un nouvel événement dans votre zone, et le niveau d'alerte d'un
  événement relevé.
- Une **action de scène** qui lit les alertes en cours en une phrase, à envoyer par message ou à faire lire
  à voix haute.

## Prérequis

- Gladys Assistant 5.1 ou plus récent.
- Un accès à Internet depuis la machine de Gladys (l'intégration lit `www.gdacs.org`).
- Pour le rayon autour de votre maison : une position pour votre maison dans Gladys (Paramètres →
  Maisons), ou des coordonnées saisies dans la configuration.

## Configuration

### Réglages

| Réglage                         | Effet                                                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Latitude et longitude du centre | Centre de la zone. Laissez les deux vides pour utiliser la position de votre maison dans Gladys. Virgule décimale acceptée. |
| Rayon                           | 100 à 5 000 km autour du centre (1 000 km par défaut).                                                                      |
| Pays                            | Codes ISO (`FR` ou `FRA`, séparés par des virgules) : les événements qui touchent ces pays, où que soit leur centre.        |
| Types d'événements              | Les aléas à suivre (les six par défaut).                                                                                    |
| Niveau d'alerte minimal         | Vert (par défaut), orange ou rouge.                                                                                         |
| Alertes rouges du monde entier  | Suivre aussi toutes les alertes rouges, où qu'elles soient (désactivé par défaut).                                          |
| Fréquence de mise à jour        | 10, 15 (par défaut), 30 ou 60 minutes.                                                                                      |
| Langue des textes               | Noms des fonctionnalités (à leur création) et textes envoyés aux scènes. Français par défaut.                               |

Enregistrez, puis ouvrez l'onglet **Découverte** de l'intégration et créez l'appareil **Alertes GDACS**.
Le bouton **Afficher les alertes en cours** de la configuration liste tout de suite les alertes de votre
zone : un moyen rapide de vérifier les réglages.

### La zone suivie

Un événement est suivi quand il est en cours sur GDACS, d'un type choisi, au niveau minimal ou au-dessus,
et :

- son point est dans le rayon autour du centre. Le point est celui que donne GDACS : l'épicentre d'un
  séisme, la position actuelle d'un cyclone, le centre d'une inondation, d'une sécheresse ou d'un feu ;
- ou il touche l'un des pays choisis (la liste des pays touchés que publie GDACS) ;
- ou c'est une alerte rouge et « Alertes rouges du monde entier » est activé.

Une sécheresse ou une inondation peut s'étendre sur des milliers de kilomètres : son centre peut être
loin de vous alors que votre pays est touché. Ajoutez votre pays au réglage **Pays** pour les attraper.

Les niveaux GDACS : **vert**, un événement limité, sans aide internationale attendue ; **orange**, une
aide peut être nécessaire ; **rouge**, une catastrophe majeure. Vert ne veut pas dire « rien ne s'est
passé » : un séisme de magnitude 4,5 près de chez vous est vert.

## Appareil

| Fonctionnalité                         | Type          | Valeur                                                                                                              |
| -------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Alertes en cours                       | Compteur      | Nombre d'événements suivis                                                                                          |
| Niveau d'alerte le plus haut           | Risque        | 0 aucune alerte, 1 vert, 2 orange, 3 rouge (le badge de risque de Gladys, décalé d'un cran par rapport à GDACS)     |
| Dernier événement                      | Texte         | L'événement le plus récent, par exemple `Orange · Cyclone tropical SIMON-26 250 km/h · México · 3 279 km`           |
| Distance de l'événement le plus proche | Distance (km) | Distance de l'événement suivi le plus proche ; 20 038 km (le plus loin qu'un point puisse être) s'il n'y en a aucun |

Sans centre (ni position de maison, ni coordonnées), la distance n'est pas publiée. Les valeurs sont lues
dans le conteneur à chaque intervalle : l'appareil n'est pas interrogé par Gladys.

## Widget de tableau de bord

**Alertes GDACS** : un titre avec le nombre d'alertes, puis jusqu'à 8 événements, du niveau le plus haut
au plus proche. Chaque ligne donne le type et l'ampleur, le pays et la distance, et le niveau en pastille.
Touchez une ligne pour voir la description GDACS de l'événement, ses dates et le lien vers son rapport
GDACS. Le pied donne la source et l'heure de la dernière lecture, et un lien vers gdacs.org.

## Déclencheurs de scène

**GDACS : nouvel événement dans ma zone** se déclenche quand un événement entre pour la première fois dans
la zone suivie : un nouveau séisme, un cyclone qui se rapproche, une alerte rouge n'importe où si vous
l'avez choisi. Filtres : types d'événements, niveau d'alerte.

**GDACS : niveau d'alerte relevé** se déclenche quand un événement suivi passe du vert à l'orange ou au
rouge, ou de l'orange au rouge. Filtres : types d'événements, nouveau niveau.

Les événements déjà présents au tout premier démarrage de l'intégration, ou quand vous changez sa
configuration, ne déclenchent rien : ce ne sont pas des nouvelles. Ce qui a été vu est gardé : un
redémarrage ne déclenche rien non plus. 20 événements au plus par mise à jour.

Variables des deux déclencheurs : `event_type` (`earthquake`, `tropical_cyclone`, `flood`, `volcano`,
`drought`, `wildfire`), `level` (`green`, `orange`, `red`), `event_type_name` et `level_name` (en toutes
lettres), `name` (type et ampleur), `country`, `distance_km`, `summary` (une ligne, comme la
fonctionnalité Dernier événement) et `url` (rapport GDACS). Le déclencheur de niveau ajoute
`previous_level` et `previous_level_name`.

## Action de scène

**GDACS : lire les alertes en cours** relit GDACS si la dernière lecture date de plus d'un intervalle,
puis renvoie :

- `text` : les alertes en une phrase, par exemple `2 alertes GDACS : Orange · Cyclone tropical SIMON-26
250 km/h (México), à 3 279 km ; Vert · Séisme M4,5 (Panama), à 182 km.` (5 événements au plus, puis « et
  N de plus ») ;
- `count` : le nombre d'alertes ;
- `max_level` : `none`, `green`, `orange` ou `red`.

## Exemples de scènes

- **Message quand un gros événement est proche** : déclencheur « GDACS : nouvel événement dans ma zone »
  filtré sur orange et rouge, action « Envoyer un message » avec `{{triggerEvent.data.summary}}` et
  `{{triggerEvent.data.url}}`.
- **Point du matin** : tous les jours à 7 h 30, « GDACS : lire les alertes en cours », puis « Envoyer un
  message » avec son `text`, seulement si `count` est au-dessus de 0.
- **Famille à l'étranger** : activez « Alertes rouges du monde entier », et envoyez un message à chaque
  nouvel événement rouge : `Alerte {{triggerEvent.data.level_name}} : {{triggerEvent.data.name}},
{{triggerEvent.data.country}}`.
- **Une lampe dans l'entrée** : quand « Niveau d'alerte le plus haut » passe à 2 ou plus, allumer une lampe
  en orange.

## Sources, conditions et quotas

- Données © GDACS (Commission européenne JRC et ECHO, ONU OCHA et UNOSAT), lues depuis l'API publique des
  événements GDACS, sans compte. La source est citée dans le widget, comme le demande la politique de
  réutilisation de la Commission européenne.
- Les notifications GDACS des séismes et des cyclones sont produites par des modèles, automatiquement,
  sans relecture humaine : elles peuvent être fausses, en retard ou incomplètes, et le service peut être
  indisponible. Elles ne remplacent jamais les alertes des autorités locales ou nationales, seules
  chargées d'alerter la population. Voir les
  [conditions d'utilisation de GDACS](https://www.gdacs.org/About/termofuse.aspx).
- Quotas : GDACS n'en publie pas. L'intégration interroge une fois par intervalle (15 minutes par défaut) :
  une recherche pour les sécheresses et une pour les autres aléas, 100 événements par page, 10 pages au
  plus. Le 15/10/2026, un cycle demandait 5 requêtes au niveau vert (270 événements en cours, surtout des
  feux de forêt) et 2 au niveau orange.

## Dépannage

- **« Aucun centre » dans la configuration** : indiquez la position de votre maison dans Gladys
  (Paramètres → Maisons), ou saisissez des coordonnées. Les pays et les alertes rouges mondiales
  fonctionnent sans.
- **« GDACS ne répond pas »** : le site est en panne ou injoignable depuis la machine de Gladys. Les
  dernières valeurs restent ; l'intégration réessaie à chaque intervalle et le dit une fois dans ses logs.
- **« GDACS liste trop d'événements »** : plus de 1 000 événements correspondent (surtout des feux de forêt
  au niveau vert). Relevez le niveau minimal ou décochez des types.
- **Pas de déclencheur après un changement de réglages** : c'est normal, les événements déjà là ne sont
  pas des nouvelles.
- **Les noms des fonctionnalités ne sont pas dans la bonne langue** : ils sont fixés à la création de
  l'appareil. Changez la langue, supprimez l'appareil, puis recréez-le depuis l'onglet Découverte.
- Logs : page de l'intégration dans Gladys, onglet Logs. `LOG_LEVEL=debug` ajoute une ligne par lecture.

## Limites

- La distance est mesurée jusqu'à un point de l'événement, pas jusqu'à son contour : une grande
  inondation ou un grand feu peut vous atteindre alors que son centre est au-delà du rayon. Utilisez le
  réglage Pays pour ceux-là.
- GDACS couvre les grandes catastrophes à impact international possible, pas les aléas locaux (orages,
  crues locales, canicules) : pour ceux-là, voyez les alertes officielles de votre pays (Vigilance
  Météo-France, Vigicrues).
- Les noms de pays et d'événements viennent de GDACS, en anglais.
- Les alertes tsunami de GDACS font partie de ses événements séisme ; elles ne sont pas listées à part.
- Développée et testée contre le vrai service GDACS ; vos retours sur de vraies alertes sont les
  bienvenus sur le forum.
