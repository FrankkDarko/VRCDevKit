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

  'loc.title': 'Localisation de monde',
  'loc.subtitle':
    "Éditez vos traductions dans une table, importez/exportez en CSV ou JSON, et générez le script UdonSharp qui applique la bonne langue aux composants Text / TextMeshPro.",
  'loc.languages': 'Langues',
  'loc.reference': 'Référence',
  'loc.addLanguage': 'Ajouter',
  'loc.langCode': 'code (ex : ja)',
  'loc.langExists': 'Cette langue existe déjà.',
  'loc.table': 'Table de traduction',
  'loc.key': 'Clé',
  'loc.addRow': 'Ajouter une clé',
  'loc.importCsv': 'Importer CSV',
  'loc.exportCsv': 'Exporter CSV',
  'loc.importError': 'Fichier illisible : {detail}',
  'loc.issues': 'Détections',
  'loc.issues.none': 'Rien à signaler : la table est propre.',
  'loc.issue.empty-key': 'Ligne {row} : clé vide.',
  'loc.issue.duplicate-key': 'Clé en double : « {key} ».',
  'loc.issue.orphan':
    'Clé orpheline : « {key} » n’a pas de texte dans la langue de référence — les autres traductions ne seront jamais servies en repli.',
  'loc.issue.missing': '« {key} » : traduction manquante en {langs}.',
  'loc.issue.overflow':
    '« {key} » ({lang}) : {len} caractères contre {refLen} en référence — risque de débordement d’UI.',
  'loc.outputs': 'Sorties',
  'loc.downloadJson': 'Télécharger le JSON runtime',
  'loc.copyScript': 'Copier le script',
  'loc.downloadScript': 'Télécharger le .cs',
  'loc.note': "Note d'intégration",
  'loc.downloadNote': 'Télécharger la note (.md)',
  'loc.note.md': `## Intégration dans votre monde

1. Importez \`WorldLocalization.cs\` dans votre projet Unity (SDK Worlds + UdonSharp).
2. Placez le composant **WorldLocalization** sur un GameObject de la scène (un seul suffit).
3. Dans l'Inspector, renseignez les liaisons :
   - \`uiTexts\` : les composants **Text** (UI Unity) à localiser, et \`uiTextKeys\` la clé de chaque entrée, dans le même ordre ;
   - \`tmpTexts\` / \`tmpTextKeys\` : pareil pour les composants **TextMeshProUGUI**.
4. Au chargement, la langue du joueur est détectée via \`VRCPlayerApi.GetCurrentLanguage()\` ; si elle n'est pas dans la table, la langue de référence est utilisée.
5. Pour un sélecteur de langue en jeu, faites appeler \`SetLanguage("fr")\` par vos boutons. Pour du texte construit dynamiquement, appelez \`Localize("votre.cle")\` depuis vos autres scripts Udon.
6. Alternative sans re-upload : servez le **JSON runtime** depuis votre site via VRCStringDownloader et parsez-le avec VRCJson — utile pour corriger des textes après publication (le script généré utilise les chaînes embarquées ; cette variante demande une adaptation).

Régénérez le fichier \`.cs\` après chaque modification de la table plutôt que d'éditer les tableaux de chaînes à la main.`,

  'vpm.title': 'Générateur de package VPM',
  'vpm.subtitle':
    "Décrivez votre package et déposez le dossier de l'asset : l'outil valide les entrées et produit package.json, listing de dépôt, workflow de publication et README d'installation — téléchargeables en une archive.",
  'vpm.package': 'Package',
  'vpm.displayName': 'Nom affiché',
  'vpm.id': 'Identifiant inversé',
  'vpm.id.placeholder': 'com.auteur.package',
  'vpm.version': 'Version',
  'vpm.description': 'Description',
  'vpm.authorName': 'Auteur',
  'vpm.authorEmail': 'E-mail (optionnel)',
  'vpm.authorUrl': 'Site (optionnel)',
  'vpm.license': 'Licence',
  'vpm.unity': 'Version Unity',
  'vpm.repoUrl': 'Dépôt GitHub',
  'vpm.repoUrl.placeholder': 'https://github.com/Vous/VotreRepo',
  'vpm.deps': 'Dépendances',
  'vpm.deps.worlds': 'VRChat SDK — Worlds',
  'vpm.deps.avatars': 'VRChat SDK — Avatars',
  'vpm.deps.udonsharp': 'UdonSharp (inclus dans le SDK Worlds ≥ 3.4)',
  'vpm.tree': "Arborescence de l'asset",
  'vpm.tree.drop': "Déposez le dossier de l'asset ici",
  'vpm.tree.browse': 'Choisir un dossier…',
  'vpm.tree.paste': 'Ou saisissez les chemins, un par ligne (ex : Runtime/Door.cs)',
  'vpm.tree.addPaths': 'Ajouter ces chemins',
  'vpm.tree.count': '{n} fichier(s) — {size} Ko',
  'vpm.tree.skipped': '{n} fichier(s) ignoré(s) : trop volumineux pour l’archive générée dans le navigateur.',
  'vpm.tree.clear': 'Vider',
  'vpm.validation': 'Validation',
  'vpm.validation.ok': 'Entrées valides : le package est prêt à générer.',
  'vpm.issue.invalid-id':
    'Identifiant invalide : « {id} ». Format attendu : minuscules en au moins trois segments, ex. com.auteur.package.',
  'vpm.issue.invalid-version':
    'Version invalide : « {version} ». Versionnage sémantique attendu : MAJEUR.MINEUR.CORRECTIF (ex. 1.2.0, 1.0.0-beta.1).',
  'vpm.issue.missing-name': 'Le nom affiché du package est vide.',
  'vpm.issue.missing-author': "Le nom de l'auteur est vide.",
  'vpm.issue.invalid-repo-url':
    'URL de dépôt invalide : « {url} ». Attendu : https://github.com/Proprietaire/Repo — elle sert à dériver l’URL du listing et celle des zips de release.',
  'vpm.issue.both-sdks':
    'Worlds et Avatars sélectionnés ensemble : un package cible rarement les deux — vérifiez que c’est voulu.',
  'vpm.issue.udonsharp-needs-worlds':
    'UdonSharp requiert le SDK Worlds : cochez Worlds ou décochez UdonSharp.',
  'vpm.issue.no-sdk': 'Aucun SDK sélectionné : le package n’aura aucune dépendance VRChat.',
  'vpm.issue.empty-tree':
    "Aucun fichier d'asset : l'archive contiendra seulement le squelette (package.json, listing, workflow, README).",
  'vpm.outputs': 'Fichiers générés',
  'vpm.downloadZip': "Télécharger l'archive (.zip)",
  'vpm.listingUrl': 'URL du listing à ajouter dans le VCC',

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
