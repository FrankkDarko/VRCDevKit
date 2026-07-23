/** Shell, navigation, home, categories, tool metadata, shared actions. */
export const common = {
  'app.title': 'VRC DevKit',
  'app.tagline': 'Outils réseau pour créateurs VRChat — 100 % côté client.',
  'nav.home': 'Accueil',
  'nav.tools': 'Outils',
  'nav.soon': 'à venir',
  'lang.label': 'Langue',
  'theme.toLight': 'Passer en thème clair',
  'theme.toDark': 'Passer en thème sombre',
  'footer.note': 'Aucun serveur, aucun tracking. Vos scripts ne quittent jamais votre navigateur.',
  'footer.source': 'Code source',
  'footer.discord': 'Discord',

  'category.network': 'Réseau & persistance',
  'category.distribution': 'Distribution',
  'category.content': 'Contenu',
  'category.diagnostic': 'Diagnostic',

  'tool.simulator.title': 'Simulateur de sync Udon',
  'tool.simulator.desc':
    "Rejouez un late joiner, un départ du master ou un vol d'ownership sans lancer VRChat ni mobiliser trois comptes. Timeline par client, divergences mises en évidence, correctifs suggérés.",
  'tool.docgen.title': 'Générateur de documentation',
  'tool.docgen.desc':
    "Déposez vos scripts UdonSharp : le parseur extrait champs, tooltips et variables synchronisées, et produit un guide d'installation en Markdown (FR, EN, JP).",
  'tool.playerdata.title': 'Générateur de schéma PlayerData',
  'tool.playerdata.desc':
    "Décrivez votre schéma de sauvegarde : l'outil génère la classe UdonSharp complète — getters/setters typés, OnPlayerRestored, valeurs par défaut — et le code de migration entre versions.",
  'tool.statemachine.title': 'Machine à états UdonSharp',
  'tool.statemachine.desc':
    "Éditez visuellement états et transitions, puis générez le code UdonSharp avec les gardes réseau corrects. Testable en un clic dans le simulateur de sync.",
  'tool.vpm.title': 'Générateur de package VPM',
  'tool.vpm.desc':
    "Nom, identifiant, version, dépendances : obtenez package.json, listing de dépôt, workflow de publication et README d'installation VCC, validés et téléchargeables en une archive.",
  'tool.quest-triage.title': 'Triage de portage Quest',
  'tool.quest-triage.desc':
    'Un arbre de décision guidé par symptôme — écran noir, textures manquantes, lightmaps cassées… — menant à une fiche : cause probable, vérification, correctif pas à pas.',
  'tool.localization.title': 'Localisation de monde',
  'tool.localization.desc':
    'Table de traduction éditable avec import/export CSV et JSON, détection des clés manquantes ou trop longues, et script UdonSharp runtime prêt à brancher.',

  'home.title': 'Des outils pour fiabiliser vos mondes.',
  'home.intro':
    "VRC DevKit regroupe des outils autonomes pour les créateurs VRChat : réseau, persistance, distribution, contenu et diagnostic. Tout s'exécute dans votre navigateur : rien n'est envoyé, rien n'est stocké ailleurs que chez vous.",
  'home.open': "Ouvrir l'outil",

  'cta.text':
    "Une question sur cet outil, un bug à signaler, une fonctionnalité à suggérer ? La communauté est sur Discord.",
  'cta.button': 'Rejoindre le Discord',

  'pd.title': 'Générateur de schéma PlayerData',
  'pd.subtitle':
    "Décrivez les clés de sauvegarde de votre monde : l'outil génère la classe UdonSharp complète (accès typés, OnPlayerRestored, valeurs par défaut) et, si vous chargez une version précédente, le code de migration.",
  'pd.schema': 'Schéma courant',
  'pd.className': 'Nom de la classe',
  'pd.keyPrefix': 'Préfixe des clés',
  'pd.version': 'Version du schéma',
  'pd.field.key': 'Clé',
  'pd.field.type': 'Type',
  'pd.field.default': 'Valeur par défaut',
  'pd.addField': 'Ajouter une clé',
  'pd.migration': 'Migration',
  'pd.baseline.none':
    "Aucune base de migration : le code est généré sans chemin de migration. Chargez le JSON d'une version précédente, ou prenez le schéma courant comme base avant de le modifier.",
  'pd.baseline.active':
    'Base : v{v}. Modifiez librement les lignes (renommage, type, suppression) — chaque ligne est suivie individuellement, un renommage n’est jamais confondu avec une suppression.',
  'pd.baseline.load': 'Charger la version précédente (JSON)',
  'pd.baseline.snapshot': 'Prendre le schéma courant comme base',
  'pd.baseline.clear': 'Retirer la base',
  'pd.steps': 'Chemin de migration',
  'pd.steps.none': 'Aucune différence avec la base : pas de migration nécessaire.',
  'pd.step.add': 'Ajouté : {key} ({type}) — les joueurs existants partiront de la valeur par défaut.',
  'pd.step.remove': 'Supprimé : {key} ({type})',
  'pd.step.rename': 'Renommé : {from} → {to} ({type})',
  'pd.step.retype': 'Type changé : {key} ({from} → {to})',
  'pd.step.rename-retype': 'Renommé + type changé : {from} → {to} ({fromType} → {toType})',
  'pd.warn.lossy-conversion':
    'Conversion avec perte pour {key} ({from} → {to}) : troncature ou échec de parsing possible ; en cas d’échec, la valeur par défaut s’applique.',
  'pd.warn.non-migratable':
    'Non migrable automatiquement : {key} ({from} → {to}). L’ancienne valeur est abandonnée, les joueurs repartent de la valeur par défaut.',
  'pd.warn.removed-key-persists':
    'PlayerData ne supprime jamais une clé : « {key} » restera orpheline dans les données des joueurs (sans effet, simplement plus lue).',
  'pd.warn.version-not-bumped':
    'Le schéma a changé mais la version ne monte pas (v{old} → v{new}) : la migration ne se déclenchera pas. Incrémentez la version.',
  'pd.warn.duplicate-key': 'Clé en double : « {key} ».',
  'pd.warn.invalid-key': 'Clé invalide : « {key} » (lettres, chiffres et _ uniquement, pas de chiffre initial).',
  'pd.warn.no-fields': 'Le schéma ne contient aucune clé.',
  'pd.code': 'Classe UdonSharp générée',
  'pd.copyCode': 'Copier le code',
  'pd.downloadCs': 'Télécharger le .cs',
  'pd.importError': 'JSON invalide : schéma ignoré.',

  'qt.title': 'Triage de portage Quest',
  'qt.subtitle':
    'Un diagnostic guidé, une question à la fois : partez du symptôme observé sur Quest et arrivez à une fiche correctif. Chaque fiche a une URL partageable.',
  'qt.question': 'Question',
  'qt.sheet': 'Fiche correctif',
  'qt.cause': 'Cause probable',
  'qt.check': 'Vérification à faire',
  'qt.fix': 'Correctif pas à pas',
  'qt.doc': 'Documentation officielle',
  'qt.back': 'Question précédente',
  'qt.restart': 'Recommencer le diagnostic',
  'qt.shareSheet': 'Copier le lien de cette fiche',

  'common.run': 'Lancer la simulation',
  'common.add': 'Ajouter',
  'common.remove': 'Supprimer',
  'common.copy': 'Copier',
  'common.copied': 'Copié !',
  'common.download': 'Télécharger',
  'common.export': 'Exporter JSON',
  'common.import': 'Importer JSON',
  'common.share': 'Copier le lien de partage',
  'common.reset': 'Réinitialiser',
  'common.loadExample': 'Charger un exemple',
} as const;
