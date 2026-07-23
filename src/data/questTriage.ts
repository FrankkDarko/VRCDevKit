/**
 * Quest porting triage decision tree — DATA ONLY.
 *
 * To enrich the tree, edit this file alone:
 * - a `question` node shows its text and one link per answer (`next` must be
 *   the id of another node);
 * - a `sheet` node is a terminal card: probable cause, check to run, fix steps;
 * - every user-visible string is a { fr, en } pair;
 * - several branches may point to the same sheet (it is a graph, not a tree).
 *
 * `npm test` validates the integrity of this file: unknown ids, unreachable
 * nodes, empty translations and dead ends are caught automatically.
 */

export interface LocalizedText {
  fr: string;
  en: string;
}

export interface TriageAnswer {
  label: LocalizedText;
  next: string;
}

export interface QuestionNode {
  id: string;
  kind: 'question';
  text: LocalizedText;
  hint?: LocalizedText;
  answers: TriageAnswer[];
}

export interface SheetNode {
  id: string;
  kind: 'sheet';
  title: LocalizedText;
  cause: LocalizedText;
  check: LocalizedText;
  fix: LocalizedText[];
  doc?: { label: string; url: string };
}

export type TriageNode = QuestionNode | SheetNode;

export const TRIAGE_ROOT = 'root';

const DOC_LIMITS = {
  label: 'creators.vrchat.com — Quest Content Limitations',
  url: 'https://creators.vrchat.com/platforms/android/quest-content-limitations/',
};
const DOC_OPTIM = {
  label: 'creators.vrchat.com — Quest Content Optimization',
  url: 'https://creators.vrchat.com/platforms/android/quest-content-optimization/',
};

export const TRIAGE_NODES: Record<string, TriageNode> = {
  /* ---------------------------------------------------------------- root */
  root: {
    id: 'root',
    kind: 'question',
    text: {
      fr: 'Quel est le symptôme observé sur Quest / Android ?',
      en: 'What symptom do you see on Quest / Android?',
    },
    answers: [
      {
        label: { fr: 'Tout apparaît noir en jeu', en: 'Everything appears black in game' },
        next: 'q-black',
      },
      {
        label: { fr: 'Textures manquantes ou remplacées', en: 'Missing or replaced textures' },
        next: 'q-textures',
      },
      {
        label: {
          fr: 'Le monde ne charge pas / dépasse la limite de taille',
          en: "The world doesn't load / exceeds the size limit",
        },
        next: 'q-load',
      },
      {
        label: {
          fr: 'Lightmaps cassées ou éclairage incohérent',
          en: 'Broken lightmaps or inconsistent lighting',
        },
        next: 'q-lightmaps',
      },
      {
        label: {
          fr: 'Différences de rendu entre PC et Android',
          en: 'Rendering differences between PC and Android',
        },
        next: 'q-diff',
      },
    ],
  },

  /* ------------------------------------------------------------ black */
  'q-black': {
    id: 'q-black',
    kind: 'question',
    text: {
      fr: 'Est-ce que TOUT le monde est noir, ou seulement certains objets ?',
      en: 'Is the WHOLE world black, or only some objects?',
    },
    answers: [
      { label: { fr: 'Tout le monde', en: 'The whole world' }, next: 'q-black-all' },
      { label: { fr: 'Seulement certains objets', en: 'Only some objects' }, next: 'q-black-some' },
    ],
  },
  'q-black-all': {
    id: 'q-black-all',
    kind: 'question',
    text: {
      fr: 'Les matériaux du monde utilisent-ils des shaders custom (Shader Graph, Amplify, shaders d’avatar type Poiyomi…) ?',
      en: 'Do the world materials use custom shaders (Shader Graph, Amplify, avatar shaders like Poiyomi…)?',
    },
    hint: {
      fr: 'Regardez le shader assigné dans quelques matériaux représentatifs de la scène.',
      en: 'Check the shader assigned on a few representative materials of the scene.',
    },
    answers: [
      { label: { fr: 'Oui, des shaders custom', en: 'Yes, custom shaders' }, next: 'sheet-shadergraph' },
      {
        label: { fr: 'Non, Standard / VRChat Mobile', en: 'No, Standard / VRChat Mobile' },
        next: 'sheet-black-lighting',
      },
    ],
  },
  'q-black-some': {
    id: 'q-black-some',
    kind: 'question',
    text: {
      fr: 'Quels objets sont noirs ?',
      en: 'Which objects are black?',
    },
    answers: [
      {
        label: {
          fr: 'Des objets statiques lightmappés (murs, sols…)',
          en: 'Static lightmapped objects (walls, floors…)',
        },
        next: 'sheet-lightmap-missing',
      },
      {
        label: {
          fr: 'Des objets dynamiques (pickups, portes, avatars)',
          en: 'Dynamic objects (pickups, doors, avatars)',
        },
        next: 'sheet-probes',
      },
      {
        label: {
          fr: 'Seulement certains matériaux précis',
          en: 'Only some specific materials',
        },
        next: 'sheet-shader-fallback',
      },
    ],
  },
  'sheet-shadergraph': {
    id: 'sheet-shadergraph',
    kind: 'sheet',
    title: {
      fr: 'Shaders custom non supportés sur mobile',
      en: 'Custom shaders unsupported on mobile',
    },
    cause: {
      fr: 'Sur Android, VRChat n’autorise que les shaders « VRChat/Mobile ». Shader Graph, Amplify et les shaders d’avatar PC ne compilent pas pour GLES et rendent noir ou magenta.',
      en: 'On Android, VRChat only allows the "VRChat/Mobile" shaders. Shader Graph, Amplify and PC avatar shaders do not compile for GLES and render black or magenta.',
    },
    check: {
      fr: 'Sélectionnez un matériau touché : si le champ Shader pointe vers autre chose que VRChat/Mobile/*, c’est la cause. Le panneau Build Control du SDK liste aussi ces matériaux en avertissement.',
      en: 'Select an affected material: if the Shader field points to anything other than VRChat/Mobile/*, that is the cause. The SDK Build Control panel also flags these materials.',
    },
    fix: [
      {
        fr: 'Remplacez chaque shader custom par son équivalent VRChat/Mobile : Standard Lite pour le PBR, Toon Lit pour le style toon, Particles/* pour les effets.',
        en: 'Replace every custom shader with its VRChat/Mobile equivalent: Standard Lite for PBR, Toon Lit for toon looks, Particles/* for effects.',
      },
      {
        fr: 'Reportez à la main les textures et réglages (albedo, normal, émission) — le changement de shader ne les migre pas toujours.',
        en: 'Manually carry over textures and settings (albedo, normal, emission) — switching shaders does not always migrate them.',
      },
      {
        fr: 'Si un effet dépend vraiment du shader custom, dupliquez le matériau et gardez la version simple pour Android seulement.',
        en: 'If an effect truly depends on the custom shader, duplicate the material and keep the simple version for Android only.',
      },
    ],
    doc: DOC_LIMITS,
  },
  'sheet-black-lighting': {
    id: 'sheet-black-lighting',
    kind: 'sheet',
    title: {
      fr: 'Scène sans éclairage exploitable',
      en: 'Scene with no usable lighting',
    },
    cause: {
      fr: 'Sans lumière temps réel (désactivée ou trop coûteuse sur Quest) et sans lightmaps bakées, les shaders lit rendent noir. L’éclairage d’environnement (skybox) peut aussi être à zéro.',
      en: 'Without a realtime light (disabled or too costly on Quest) and without baked lightmaps, lit shaders render black. Environment lighting (skybox) may also be at zero.',
    },
    check: {
      fr: 'Window → Rendering → Lighting : vérifiez qu’un bake existe (onglet Baked Lightmaps non vide) et que Environment Lighting n’est pas noir.',
      en: 'Window → Rendering → Lighting: verify a bake exists (Baked Lightmaps tab not empty) and that Environment Lighting is not black.',
    },
    fix: [
      {
        fr: 'Marquez la géométrie fixe en Contribute GI / Static, puis lancez un bake (Generate Lighting).',
        en: 'Mark fixed geometry as Contribute GI / Static, then run a bake (Generate Lighting).',
      },
      {
        fr: 'Réglez Environment Lighting sur la skybox ou une couleur d’ambiance non nulle.',
        en: 'Set Environment Lighting to the skybox or a non-zero ambient color.',
      },
      {
        fr: 'Évitez les lumières temps réel sur Quest ; si une est indispensable, passez-la en Baked ou Mixed avant le bake.',
        en: 'Avoid realtime lights on Quest; if one is essential, set it to Baked or Mixed before baking.',
      },
    ],
    doc: DOC_OPTIM,
  },
  'sheet-probes': {
    id: 'sheet-probes',
    kind: 'sheet',
    title: {
      fr: 'Light Probes manquantes',
      en: 'Missing Light Probes',
    },
    cause: {
      fr: 'Les objets dynamiques ne reçoivent pas les lightmaps : ils échantillonnent les Light Probes. Sans Light Probe Group dans la scène, ils rendent noirs (ou avec l’ambiance par défaut).',
      en: 'Dynamic objects do not receive lightmaps: they sample Light Probes. Without a Light Probe Group in the scene, they render black (or with default ambient).',
    },
    check: {
      fr: 'Cherchez un Light Probe Group dans la hiérarchie. En jeu, un pickup qui devient noir en s’éloignant d’une zone éclairée confirme le diagnostic.',
      en: 'Look for a Light Probe Group in the hierarchy. In game, a pickup turning black when moving away from a lit area confirms the diagnosis.',
    },
    fix: [
      {
        fr: 'Ajoutez un Light Probe Group (GameObject → Light → Light Probe Group) et répartissez les probes dans les volumes où circulent joueurs et objets.',
        en: 'Add a Light Probe Group (GameObject → Light → Light Probe Group) and spread probes across the volumes where players and objects move.',
      },
      {
        fr: 'Densifiez les probes près des contrastes d’éclairage (portes, passages intérieur/extérieur).',
        en: 'Densify probes near lighting contrasts (doorways, indoor/outdoor transitions).',
      },
      {
        fr: 'Relancez le bake : les probes ne stockent la lumière qu’après Generate Lighting.',
        en: 'Re-run the bake: probes only store light after Generate Lighting.',
      },
    ],
  },
  'sheet-shader-fallback': {
    id: 'sheet-shader-fallback',
    kind: 'sheet',
    title: {
      fr: 'Matériaux à remplacer par des shaders mobiles',
      en: 'Materials to replace with mobile shaders',
    },
    cause: {
      fr: 'Un shader qui ne compile pas sur GLES rend magenta, mais certains rendent noir (variantes manquantes, mots-clés non supportés, HDR requis).',
      en: 'A shader that fails to compile on GLES renders magenta, but some render black (missing variants, unsupported keywords, HDR required).',
    },
    check: {
      fr: 'Passez le build target sur Android (File → Build Settings) et observez ces matériaux dans l’éditeur : le problème apparaît souvent dès l’éditeur en cible Android.',
      en: 'Switch the build target to Android (File → Build Settings) and inspect those materials in the editor: the issue often shows up in-editor on the Android target.',
    },
    fix: [
      {
        fr: 'Remplacez le shader par un VRChat/Mobile/* équivalent sur chaque matériau touché.',
        en: 'Replace the shader with an equivalent VRChat/Mobile/* on every affected material.',
      },
      {
        fr: 'Si le matériau vient d’un asset store, cherchez une variante « mobile » fournie par l’auteur avant de le refaire.',
        en: 'If the material comes from an asset store, look for a "mobile" variant provided by the author before rebuilding it.',
      },
      {
        fr: 'Testez en éditeur avec la cible Android active avant chaque upload pour attraper ces cas tôt.',
        en: 'Test in-editor with the Android target active before every upload to catch these cases early.',
      },
    ],
    doc: DOC_LIMITS,
  },

  /* ---------------------------------------------------------- textures */
  'q-textures': {
    id: 'q-textures',
    kind: 'question',
    text: {
      fr: 'À quoi ressemblent les textures fautives ?',
      en: 'What do the faulty textures look like?',
    },
    answers: [
      { label: { fr: 'Roses / magenta', en: 'Pink / magenta' }, next: 'sheet-magenta' },
      {
        label: { fr: 'Très floues ou pixellisées', en: 'Very blurry or pixelated' },
        next: 'sheet-compression',
      },
      {
        label: { fr: 'Blanches, grises ou absentes', en: 'White, grey or missing' },
        next: 'q-textures-missing',
      },
    ],
  },
  'q-textures-missing': {
    id: 'q-textures-missing',
    kind: 'question',
    text: {
      fr: 'Ces textures sont-elles importées dans le projet, ou générées/téléchargées au runtime ?',
      en: 'Are these textures imported in the project, or generated/downloaded at runtime?',
    },
    answers: [
      {
        label: { fr: 'Importées (fichiers du projet)', en: 'Imported (project files)' },
        next: 'sheet-texture-import',
      },
      {
        label: {
          fr: 'Runtime (RenderTexture, Image Loader…)',
          en: 'Runtime (RenderTexture, Image Loader…)',
        },
        next: 'sheet-runtime-textures',
      },
    ],
  },
  'sheet-magenta': {
    id: 'sheet-magenta',
    kind: 'sheet',
    title: {
      fr: 'Magenta : shader non supporté',
      en: 'Magenta: unsupported shader',
    },
    cause: {
      fr: 'Le magenta est le shader d’erreur d’Unity : le shader du matériau n’existe pas ou ne compile pas sur Android. Ce n’est jamais un problème de texture.',
      en: "Magenta is Unity's error shader: the material's shader is missing or does not compile on Android. It is never a texture problem.",
    },
    check: {
      fr: 'Sélectionnez le matériau : le shader est soit « Hidden/InternalErrorShader », soit un shader non VRChat/Mobile.',
      en: 'Select the material: the shader is either "Hidden/InternalErrorShader" or a non-VRChat/Mobile shader.',
    },
    fix: [
      {
        fr: 'Réassignez un shader VRChat/Mobile/* au matériau (Standard Lite dans la plupart des cas).',
        en: 'Reassign a VRChat/Mobile/* shader to the material (Standard Lite in most cases).',
      },
      {
        fr: 'Rebranchez les textures dans les slots du nouveau shader.',
        en: 'Re-plug the textures into the new shader’s slots.',
      },
      {
        fr: 'Balayez la scène avec la cible Android active pour trouver tous les matériaux concernés d’un coup.',
        en: 'Sweep the scene with the Android target active to find every affected material at once.',
      },
    ],
    doc: DOC_LIMITS,
  },
  'sheet-compression': {
    id: 'sheet-compression',
    kind: 'sheet',
    title: {
      fr: 'Compression / taille max Android trop agressives',
      en: 'Android compression / max size too aggressive',
    },
    cause: {
      fr: 'Sur Android, chaque texture a ses propres réglages d’import (Max Size, compression ASTC). Un override à 256/512 px ou une compression trop forte rend la texture floue uniquement sur Quest.',
      en: 'On Android, each texture has its own import settings (Max Size, ASTC compression). A 256/512 px override or overly strong compression makes the texture blurry on Quest only.',
    },
    check: {
      fr: 'Sélectionnez la texture → onglet Android de l’Inspector d’import : comparez Max Size et le format avec l’onglet PC.',
      en: 'Select the texture → Android tab of the import Inspector: compare Max Size and format with the PC tab.',
    },
    fix: [
      {
        fr: 'Fixez un Max Size raisonnable (1024 pour la plupart des textures de monde, 2048 pour les éléments clés).',
        en: 'Set a reasonable Max Size (1024 for most world textures, 2048 for hero assets).',
      },
      {
        fr: 'Utilisez ASTC 6x6 ou 8x8 : bon compromis qualité/poids sur Quest.',
        en: 'Use ASTC 6x6 or 8x8: a good quality/weight compromise on Quest.',
      },
      {
        fr: 'Gardez la taille de téléchargement à l’œil : augmenter les résolutions se paie sur la limite de 100 Mo.',
        en: 'Keep the download size in mind: raising resolutions costs against the 100 MB limit.',
      },
    ],
    doc: DOC_OPTIM,
  },
  'sheet-texture-import': {
    id: 'sheet-texture-import',
    kind: 'sheet',
    title: {
      fr: 'Import de texture non appliqué à la plateforme Android',
      en: 'Texture import not applied to the Android platform',
    },
    cause: {
      fr: 'Une texture peut être exclue ou mal importée pour Android : format non supporté par GLES, texture marquée en réglages PC uniquement, ou réimport nécessaire après changement de cible.',
      en: 'A texture can be excluded or mis-imported for Android: format unsupported by GLES, PC-only override, or a reimport needed after switching targets.',
    },
    check: {
      fr: 'Avec la cible Android active, la texture apparaît-elle correcte dans l’éditeur ? Vérifiez aussi la Console pour des erreurs d’import au changement de plateforme.',
      en: 'With the Android target active, does the texture look right in-editor? Also check the Console for import errors after the platform switch.',
    },
    fix: [
      {
        fr: 'Clic droit sur la texture → Reimport, cible Android active.',
        en: 'Right click the texture → Reimport, with the Android target active.',
      },
      {
        fr: 'Vérifiez l’onglet Android de l’import : format ASTC, sRGB correct, pas d’override exotique.',
        en: 'Check the Android import tab: ASTC format, correct sRGB, no exotic override.',
      },
      {
        fr: 'Si la texture vient d’un package, réimportez le package après le changement de cible.',
        en: 'If the texture comes from a package, reimport the package after switching targets.',
      },
    ],
  },
  'sheet-runtime-textures': {
    id: 'sheet-runtime-textures',
    kind: 'sheet',
    title: {
      fr: 'Textures runtime hors limites mobiles',
      en: 'Runtime textures beyond mobile limits',
    },
    cause: {
      fr: 'Les RenderTextures haute résolution, les formats flottants et les téléchargements d’images lourds dépassent facilement la mémoire ou les capacités GLES du Quest : la texture reste blanche ou vide.',
      en: 'High-resolution RenderTextures, float formats and heavy image downloads easily exceed the Quest’s memory or GLES capabilities: the texture stays white or empty.',
    },
    check: {
      fr: 'Réduisez temporairement la résolution/format de la texture runtime : si le problème disparaît, c’est bien une limite matérielle.',
      en: 'Temporarily reduce the runtime texture’s resolution/format: if the issue disappears, it is a hardware limit.',
    },
    fix: [
      {
        fr: 'Limitez les RenderTextures à 1024 max et aux formats 8 bits (ARGB32) sur Android.',
        en: 'Cap RenderTextures at 1024 and 8-bit formats (ARGB32) on Android.',
      },
      {
        fr: 'Pour VRCImageDownloader, servez des images déjà redimensionnées (≤ 1024) plutôt que de compter sur le client.',
        en: 'For VRCImageDownloader, serve pre-resized images (≤ 1024) rather than relying on the client.',
      },
      {
        fr: 'Prévoyez un fallback visuel (couleur unie, texture basse définition) quand le chargement échoue.',
        en: 'Provide a visual fallback (flat color, low-res texture) when loading fails.',
      },
    ],
  },

  /* -------------------------------------------------------------- load */
  'q-load': {
    id: 'q-load',
    kind: 'question',
    text: {
      fr: 'Le panneau de build du SDK indique-t-il une taille au-dessus de la limite Quest (100 Mo compressés) ?',
      en: 'Does the SDK build panel report a size above the Quest limit (100 MB compressed)?',
    },
    hint: {
      fr: 'La taille s’affiche dans la fenêtre du SDK après un build, et dans les logs d’upload.',
      en: 'The size shows in the SDK window after a build, and in the upload logs.',
    },
    answers: [
      { label: { fr: 'Oui, au-dessus de la limite', en: 'Yes, above the limit' }, next: 'sheet-size' },
      { label: { fr: 'Non, la taille est correcte', en: 'No, the size is fine' }, next: 'q-load-crash' },
    ],
  },
  'q-load-crash': {
    id: 'q-load-crash',
    kind: 'question',
    text: {
      fr: 'Le monde commence-t-il à charger puis plante/kick, ou le chargement ne démarre jamais ?',
      en: 'Does the world start loading then crash/kick, or does loading never start?',
    },
    answers: [
      {
        label: { fr: 'Charge puis plante ou kick', en: 'Loads then crashes or kicks' },
        next: 'sheet-memory',
      },
      {
        label: { fr: 'Ne démarre jamais', en: 'Never starts' },
        next: 'sheet-build-missing',
      },
    ],
  },
  'sheet-size': {
    id: 'sheet-size',
    kind: 'sheet',
    title: {
      fr: 'Réduire la taille du build Quest',
      en: 'Reduce the Quest build size',
    },
    cause: {
      fr: 'Le build Android dépasse la limite de téléchargement de VRChat (100 Mo compressés). Les textures sont presque toujours le premier poste, suivies de l’audio et des meshes.',
      en: 'The Android build exceeds VRChat’s download limit (100 MB compressed). Textures are almost always the biggest cost, followed by audio and meshes.',
    },
    check: {
      fr: 'Ouvrez le rapport de build (Console après build, ou l’Editor Log) : la répartition par type d’asset y est listée, triée par poids.',
      en: 'Open the build report (Console after a build, or the Editor Log): asset-type breakdown is listed there, sorted by weight.',
    },
    fix: [
      {
        fr: 'Baissez le Max Size Android des textures les plus lourdes (1024, voire 512 pour les décors secondaires) en ASTC.',
        en: 'Lower the Android Max Size of the heaviest textures (1024, or even 512 for secondary props) with ASTC.',
      },
      {
        fr: 'Passez l’audio en Vorbis mono, qualité ~70 %, et Decompress On Load seulement pour les sons courts.',
        en: 'Switch audio to Vorbis mono, ~70% quality, and Decompress On Load only for short sounds.',
      },
      {
        fr: 'Supprimez les assets non référencés et activez la compression de mesh sur les gros modèles.',
        en: 'Remove unreferenced assets and enable mesh compression on large models.',
      },
      {
        fr: 'Rebuildez et comparez : itérez texture par texture plutôt que de tout dégrader uniformément.',
        en: 'Rebuild and compare: iterate texture by texture rather than degrading everything uniformly.',
      },
    ],
    doc: DOC_OPTIM,
  },
  'sheet-memory': {
    id: 'sheet-memory',
    kind: 'sheet',
    title: {
      fr: 'Dépassement mémoire au chargement',
      en: 'Out of memory while loading',
    },
    cause: {
      fr: 'Le Quest a une mémoire limitée : trop de textures décompressées, de meshes ou de particules en overdraw fait tuer l’application par le système pendant ou juste après le chargement.',
      en: 'The Quest has limited memory: too many decompressed textures, meshes or overdrawing particles gets the app killed by the system during or right after loading.',
    },
    check: {
      fr: 'Testez une version du monde vidée de ses zones les plus denses : si elle charge, réintroduisez les zones une par une pour isoler la coupable.',
      en: 'Test a version of the world stripped of its densest areas: if it loads, reintroduce areas one by one to isolate the culprit.',
    },
    fix: [
      {
        fr: 'Réduisez la résolution des textures : la mémoire GPU compte la taille décompressée, pas le poids sur disque.',
        en: 'Reduce texture resolutions: GPU memory counts decompressed size, not on-disk weight.',
      },
      {
        fr: 'Limitez les systèmes de particules (max particles, pas de soft particles) et les miroirs/caméras temps réel.',
        en: 'Limit particle systems (max particles, no soft particles) and realtime mirrors/cameras.',
      },
      {
        fr: 'Découpez le monde en zones activées/désactivées par triggers pour lisser le pic mémoire.',
        en: 'Split the world into zones toggled by triggers to smooth the memory peak.',
      },
    ],
    doc: DOC_OPTIM,
  },
  'sheet-build-missing': {
    id: 'sheet-build-missing',
    kind: 'sheet',
    title: {
      fr: 'Pas de build Android publié',
      en: 'No Android build published',
    },
    cause: {
      fr: 'Un monde n’est visible sur Quest que si une version Android a été buildée ET uploadée. Un upload PC seul laisse les joueurs Quest devant un chargement qui ne démarre jamais ou un monde absent.',
      en: 'A world is only visible on Quest if an Android version has been built AND uploaded. A PC-only upload leaves Quest players with a load that never starts or a missing world.',
    },
    check: {
      fr: 'Sur la page du monde (site VRChat), la plateforme Android est-elle listée ? Dans Unity, le SDK affiche la plateforme courante en haut du panneau de build.',
      en: 'On the world page (VRChat website), is the Android platform listed? In Unity, the SDK shows the current platform at the top of the build panel.',
    },
    fix: [
      {
        fr: 'File → Build Settings → Android → Switch Platform, puis rebuild & upload avec le même blueprint ID.',
        en: 'File → Build Settings → Android → Switch Platform, then rebuild & upload with the same blueprint ID.',
      },
      {
        fr: 'Corrigez les erreurs bloquantes listées par le Build Control avant l’upload (shaders, composants interdits).',
        en: 'Fix the blocking errors listed by Build Control before upload (shaders, forbidden components).',
      },
      {
        fr: 'Vérifiez ensuite la page du monde : les deux plateformes doivent apparaître.',
        en: 'Then check the world page: both platforms must appear.',
      },
    ],
  },

  /* --------------------------------------------------------- lightmaps */
  'q-lightmaps': {
    id: 'q-lightmaps',
    kind: 'question',
    text: {
      fr: 'Comment les lightmaps se comportent-elles sur Quest ?',
      en: 'How do the lightmaps behave on Quest?',
    },
    answers: [
      {
        label: { fr: 'Absentes : tout est sombre/plat', en: 'Missing: everything is dark/flat' },
        next: 'sheet-lightmap-missing',
      },
      {
        label: { fr: 'Présentes mais tachées / artefacts', en: 'Present but blotchy / artifacts' },
        next: 'sheet-lightmap-artifacts',
      },
      {
        label: {
          fr: 'Différentes du rendu PC (couleurs, intensité)',
          en: 'Different from the PC render (colors, intensity)',
        },
        next: 'sheet-lightmap-rebake',
      },
    ],
  },
  'sheet-lightmap-missing': {
    id: 'sheet-lightmap-missing',
    kind: 'sheet',
    title: {
      fr: 'Lightmaps absentes du build Android',
      en: 'Lightmaps missing from the Android build',
    },
    cause: {
      fr: 'Le bake n’a pas été (re)généré avec la cible Android active, ou les données de lighting ont été invalidées par un changement de scène après le dernier bake.',
      en: 'The bake was not (re)generated with the Android target active, or the lighting data was invalidated by a scene change after the last bake.',
    },
    check: {
      fr: 'Cible Android active, ouvrez Window → Rendering → Lighting : l’onglet Baked Lightmaps doit montrer vos lightmaps. Un panneau « Lighting data is stale » confirme le problème.',
      en: 'With the Android target active, open Window → Rendering → Lighting: the Baked Lightmaps tab must show your lightmaps. A "Lighting data is stale" notice confirms the issue.',
    },
    fix: [
      {
        fr: 'Passez la cible sur Android, puis Generate Lighting — le bake est stocké par plateforme dans le build.',
        en: 'Switch the target to Android, then Generate Lighting — the bake is stored per platform in the build.',
      },
      {
        fr: 'Désactivez Auto Generate et rebakez manuellement avant chaque upload Android.',
        en: 'Disable Auto Generate and rebake manually before every Android upload.',
      },
      {
        fr: 'Vérifiez que les objets lightmappés sont bien marqués Contribute GI et n’ont pas changé d’échelle depuis le bake.',
        en: 'Verify lightmapped objects are marked Contribute GI and have not changed scale since the bake.',
      },
    ],
  },
  'sheet-lightmap-artifacts': {
    id: 'sheet-lightmap-artifacts',
    kind: 'sheet',
    title: {
      fr: 'Artefacts de compression des lightmaps',
      en: 'Lightmap compression artifacts',
    },
    cause: {
      fr: 'Sur Android, les lightmaps sont compressées en ASTC : les dégradés doux (pénombres, halos) bandent ou tachent, surtout en mode Directional et à basse résolution.',
      en: 'On Android, lightmaps are ASTC-compressed: soft gradients (penumbras, glows) band or blotch, especially in Directional mode and at low resolution.',
    },
    check: {
      fr: 'Comparez la lightmap dans l’onglet Baked Lightmaps entre cible PC et cible Android : si l’artefact n’existe qu’en Android, c’est la compression.',
      en: 'Compare the lightmap in the Baked Lightmaps tab between the PC and Android targets: if the artifact only exists on Android, it is compression.',
    },
    fix: [
      {
        fr: 'Passez le Directional Mode sur Non-Directional pour les scènes mobiles : moitié moins de données, artefacts réduits.',
        en: 'Set Directional Mode to Non-Directional for mobile scenes: half the data, fewer artifacts.',
      },
      {
        fr: 'Augmentez la résolution de lightmap sur les surfaces où les artefacts se voient (Scale in Lightmap par objet).',
        en: 'Raise the lightmap resolution on surfaces where artifacts show (per-object Scale in Lightmap).',
      },
      {
        fr: 'En dernier recours, désactivez la compression des lightmaps dans les réglages de qualité Android — au prix de la taille du build.',
        en: 'As a last resort, disable lightmap compression in the Android quality settings — at the cost of build size.',
      },
    ],
  },
  'sheet-lightmap-rebake': {
    id: 'sheet-lightmap-rebake',
    kind: 'sheet',
    title: {
      fr: 'Bake incompatible entre plateformes',
      en: 'Bake incompatible across platforms',
    },
    cause: {
      fr: 'Le rendu final dépend de la plateforme : espace colorimétrique, précision GLES, absence de HDR et compression différente font qu’un bake pensé pour PC paraît délavé ou saturé sur Quest.',
      en: 'The final render is platform-dependent: color space, GLES precision, missing HDR and different compression make a PC-tuned bake look washed out or oversaturated on Quest.',
    },
    check: {
      fr: 'Basculez l’éditeur en cible Android et comparez la même vue : si l’écart apparaît dès l’éditeur, il vient du pipeline Android, pas de votre bake.',
      en: 'Switch the editor to the Android target and compare the same view: if the gap shows in-editor, it comes from the Android pipeline, not your bake.',
    },
    fix: [
      {
        fr: 'Rebakez systématiquement avec la cible Android avant l’upload Quest — ne réutilisez jamais le bake PC tel quel.',
        en: 'Always rebake with the Android target before the Quest upload — never reuse the PC bake as is.',
      },
      {
        fr: 'Ajustez l’intensité des lumières et de l’ambiance pour la version Android si nécessaire (les deux builds peuvent différer).',
        en: 'Tune light and ambient intensities for the Android version if needed (the two builds may differ).',
      },
      {
        fr: 'Évitez les effets dépendant du HDR (bloom intense, émissions > 1) : ils clippent sur mobile.',
        en: 'Avoid HDR-dependent effects (strong bloom, emissions > 1): they clip on mobile.',
      },
    ],
    doc: DOC_LIMITS,
  },

  /* -------------------------------------------------------------- diff */
  'q-diff': {
    id: 'q-diff',
    kind: 'question',
    text: {
      fr: 'Quelle différence PC / Android observez-vous ?',
      en: 'Which PC / Android difference do you see?',
    },
    answers: [
      {
        label: { fr: 'Le post-processing a disparu', en: 'Post-processing is gone' },
        next: 'sheet-postprocessing',
      },
      {
        label: { fr: 'Plus d’ombres temps réel', en: 'No more realtime shadows' },
        next: 'sheet-realtime-shadows',
      },
      {
        label: {
          fr: 'Particules / effets absents ou dégradés',
          en: 'Particles / effects missing or degraded',
        },
        next: 'sheet-particles',
      },
      {
        label: { fr: 'Couleurs ou exposition différentes', en: 'Different colors or exposure' },
        next: 'sheet-lightmap-rebake',
      },
    ],
  },
  'sheet-postprocessing': {
    id: 'sheet-postprocessing',
    kind: 'sheet',
    title: {
      fr: 'Post-processing non supporté sur Quest',
      en: 'Post-processing unsupported on Quest',
    },
    cause: {
      fr: 'Post Processing Stack v2 n’est pas exécuté sur Android : bloom, color grading, vignette et AO disparaissent. Le monde Quest rend « brut ».',
      en: 'Post Processing Stack v2 does not run on Android: bloom, color grading, vignette and AO disappear. The Quest world renders "raw".',
    },
    check: {
      fr: 'C’est un comportement attendu — vérifiez simplement que votre direction artistique ne repose pas uniquement sur le post-processing.',
      en: 'This is expected behavior — simply verify your art direction does not rely solely on post-processing.',
    },
    fix: [
      {
        fr: 'Intégrez le look au contenu : couleurs des textures, éclairage baké, émissifs — plutôt que du grading en post.',
        en: 'Bake the look into the content: texture colors, baked lighting, emissives — rather than post grading.',
      },
      {
        fr: 'Simulez les effets clés à moindre coût : sprites additifs pour les halos, assombrissement peint pour le vignettage.',
        en: 'Fake the key effects cheaply: additive sprites for glows, painted darkening for vignettes.',
      },
      {
        fr: 'Gardez le volume PPv2 pour PC : il est ignoré sur Quest, inutile de le retirer.',
        en: 'Keep the PPv2 volume for PC: it is ignored on Quest, no need to remove it.',
      },
    ],
    doc: DOC_LIMITS,
  },
  'sheet-realtime-shadows': {
    id: 'sheet-realtime-shadows',
    kind: 'sheet',
    title: {
      fr: 'Ombres temps réel désactivées sur Quest',
      en: 'Realtime shadows disabled on Quest',
    },
    cause: {
      fr: 'VRChat désactive les ombres temps réel sur Android pour préserver les performances : tout objet qui dépendait d’une ombre dynamique semble flotter.',
      en: 'VRChat disables realtime shadows on Android to preserve performance: anything that relied on a dynamic shadow appears to float.',
    },
    check: {
      fr: 'Comportement attendu sur Quest — identifiez les objets dont la lisibilité dépendait de ces ombres.',
      en: 'Expected behavior on Quest — identify the objects whose readability depended on those shadows.',
    },
    fix: [
      {
        fr: 'Bakez les ombres des objets statiques dans les lightmaps (lumières en Baked/Mixed).',
        en: 'Bake static object shadows into the lightmaps (lights set to Baked/Mixed).',
      },
      {
        fr: 'Sous les objets dynamiques, ajoutez une « blob shadow » : un quad avec une texture d’ombre douce en shader Particles/Multiply.',
        en: 'Under dynamic objects, add a "blob shadow": a quad with a soft shadow texture using a Particles/Multiply shader.',
      },
      {
        fr: 'Renforcez l’ancrage visuel par le contact : socles, tapis, décalcomanies au sol.',
        en: 'Reinforce visual grounding through contact: pedestals, rugs, floor decals.',
      },
    ],
  },
  'sheet-particles': {
    id: 'sheet-particles',
    kind: 'sheet',
    title: {
      fr: 'Particules limitées sur mobile',
      en: 'Particles limited on mobile',
    },
    cause: {
      fr: 'Quest limite le nombre de particules et ne supporte ni soft particles ni la plupart des shaders d’effets PC : les systèmes lourds sont bridés ou invisibles.',
      en: 'Quest caps particle counts and supports neither soft particles nor most PC effect shaders: heavy systems are throttled or invisible.',
    },
    check: {
      fr: 'Vérifiez le shader de chaque matériau de particule (doit être VRChat/Mobile/Particles/*) et les Max Particles des systèmes concernés.',
      en: 'Check each particle material’s shader (must be VRChat/Mobile/Particles/*) and the Max Particles of the affected systems.',
    },
    fix: [
      {
        fr: 'Passez les matériaux de particules sur VRChat/Mobile/Particles (Additive ou Multiply).',
        en: 'Switch particle materials to VRChat/Mobile/Particles (Additive or Multiply).',
      },
      {
        fr: 'Réduisez Max Particles et l’overdraw : moins de particules, plus grandes, avec des textures nettes.',
        en: 'Reduce Max Particles and overdraw: fewer, larger particles with crisp textures.',
      },
      {
        fr: 'Remplacez les gros systèmes par des meshes animés ou des sprites quand c’est possible.',
        en: 'Replace big systems with animated meshes or sprites where possible.',
      },
    ],
    doc: DOC_OPTIM,
  },
};
