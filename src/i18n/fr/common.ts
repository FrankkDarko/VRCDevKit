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
