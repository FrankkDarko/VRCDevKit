# VRC DevKit

**[🇫🇷 Version française ci-dessous](#-français)**

> Network tools for VRChat world creators — 100% client-side, no server, no tracking.
>
> **Live demo: <https://frankkdarko.github.io/VRCDevKit/>**

![VRC DevKit home page](docs/screenshots/home.png)

VRC DevKit bundles two standalone tools in a single static site:

## 01 — Udon sync simulator (`#/simulator`)

Test an UdonSharp network design without launching VRChat or juggling three accounts.

- Describe your **synced variables** (type, Manual/Continuous), the **ownership model**
  (master authoritative / owner per object / anyone) and the **script behavior**
  (RequestSerialization in OnPlayerJoined, OnDeserialization handling, SetOwner before
  write, …).
- Replay **predefined scenarios** — late joiner, master leave, ownership steal,
  concurrent writes, RequestSerialization burst, instance owner leave — or compose
  your own action list tick by tick.
- Read the **per-client timeline**: what each virtual client (2–8) perceives at every
  tick, with divergences highlighted, plus a list of **detected problems** with
  severity, one-sentence cause, and a suggested fix.
- The engine is deterministic and seedable, lives in `src/engine/` with zero React
  dependency, and the whole state is encoded in the URL (compressed JSON in base64)
  for sharing. JSON export/import included.

![Simulator: late joiner scenario with detected issues](docs/screenshots/simulator.png)

## 02 — UdonSharp documentation generator (`#/docgen`)

Drop (or paste) your `.cs` scripts: a client-side, compiler-free parser extracts
classes, `public` / `[SerializeField]` fields, `[Tooltip]`, `[Header]`, `[Range]`,
`[UdonSynced]`, `[HideInInspector]`, types and default values — and generates an
installation guide in Markdown with a live HTML preview:

- prerequisites, installation steps, per-component Inspector tables,
  synced-variables note, troubleshooting;
- output language selectable independently from the UI: **FR / EN / JP**
  (tooltip texts are quoted verbatim);
- copy Markdown, download `.md`, copy as plain text.
- unparsable files show a clear warning without breaking the app.

![DocGen: generated installation guide with preview](docs/screenshots/docgen.png)

## Tech notes

- Vite + React + TypeScript, deployed to GitHub Pages (branch `gh-pages`) by
  [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
- Hash routing (`#/simulator`, `#/docgen`) — no 404s on GitHub Pages.
- Zero runtime CDN dependency, zero network call, fonts self-hosted.
- UI in French/English: auto-detected from `navigator.language`, switchable,
  persisted, overridable with `?lang=fr|en`. Dark theme by default, light toggle.
- Unit tests (Vitest) on the simulation engine, the state codec and the C# parser:
  `npm test`.

```bash
npm install
npm run dev       # local dev server
npm test          # unit tests
npm run build     # production build in dist/
```

To regenerate the bitmap assets (favicon, Open Graph image):
`npm i --no-save sharp && node scripts/generate-assets.mjs`.

License: [MIT](LICENSE).

---

# 🇫🇷 Français

> Outils réseau pour créateurs de mondes VRChat — 100 % côté client, sans serveur,
> sans tracking.
>
> **Démo : <https://frankkdarko.github.io/VRCDevKit/>**

VRC DevKit regroupe deux outils autonomes dans un même site statique :

## 01 — Simulateur de synchronisation Udon (`#/simulator`)

Testez un design réseau UdonSharp sans lancer VRChat ni mobiliser trois comptes.

- Décrivez vos **variables synchronisées** (type, Manual/Continuous), le **modèle
  d'ownership** (master authoritative / owner par objet / n'importe qui) et le
  **comportement du script** (RequestSerialization dans OnPlayerJoined, gestion
  d'OnDeserialization, SetOwner avant écriture…).
- Rejouez des **scénarios prédéfinis** — late joiner, départ du master, vol
  d'ownership, écritures concurrentes, rafale de RequestSerialization, départ du
  propriétaire de l'instance — ou composez votre propre liste d'actions tick par tick.
- Lisez la **timeline par client** : ce que chaque client virtuel (2 à 8) perçoit à
  chaque tick, divergences mises en évidence, plus une liste de **problèmes
  détectés** avec sévérité, cause en une phrase et correctif suggéré.
- Le moteur est déterministe et seedable, isolé dans `src/engine/` sans dépendance
  React ; l'état complet est encodé dans l'URL (JSON compressé en base64) pour le
  partage. Export/import JSON inclus.

## 02 — Générateur de documentation UdonSharp (`#/docgen`)

Déposez (ou collez) vos scripts `.cs` : un parseur côté client, sans compilateur,
extrait classes, champs `public` / `[SerializeField]`, `[Tooltip]`, `[Header]`,
`[Range]`, `[UdonSynced]`, `[HideInInspector]`, types et valeurs par défaut — et
génère un guide d'installation en Markdown avec aperçu HTML :

- prérequis, étapes d'installation, tableaux des champs Inspector par composant,
  note sur les variables synchronisées, section dépannage ;
- langue du document sélectionnable indépendamment de l'UI : **FR / EN / JP**
  (les textes des Tooltip sont repris tels quels) ;
- copier le Markdown, télécharger le `.md`, copier en texte brut ;
- un fichier non parsable affiche un avertissement clair sans faire tomber l'app.

## Notes techniques

- Vite + React + TypeScript, déployé sur GitHub Pages (branche `gh-pages`) par
  [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
- Routing en hash (`#/simulator`, `#/docgen`) — pas de 404 sur GitHub Pages.
- Zéro dépendance CDN à l'exécution, zéro appel réseau, polices embarquées.
- UI FR/EN : détection via `navigator.language`, sélecteur persisté, surcharge par
  `?lang=fr|en`. Thème sombre par défaut, bascule clair.
- Tests unitaires (Vitest) sur le moteur de simulation, le codec d'état et le
  parseur C# : `npm test`.

Licence : [MIT](LICENSE).
