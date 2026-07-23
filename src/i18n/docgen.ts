/**
 * Labels for the *generated documentation* (independent from the UI language).
 * Tooltip/Header texts from the source files are quoted verbatim, only the
 * structural labels are translated.
 */

export type DocLang = 'fr' | 'en' | 'jp';
export const DOC_LANGS: DocLang[] = ['fr', 'en', 'jp'];

export interface DocDict {
  title: string; // {name}
  intro: string;
  prerequisites: string;
  prereqUnity: string;
  prereqSdk: string;
  prereqUdonSharp: string;
  installSteps: string;
  step1: string;
  step2: string;
  step3: string; // {components}
  step4: string;
  components: string;
  componentIntro: string; // {name}
  behaviourBadge: string;
  notBehaviourNote: string;
  colField: string;
  colType: string;
  colDescription: string;
  colDefault: string;
  noDescription: string;
  noDefault: string;
  rangeNote: string; // {min} {max}
  noInspectorFields: string;
  syncedTitle: string;
  syncedIntro: string;
  colVariable: string;
  colComponent: string;
  colSyncMode: string;
  syncedNone: string;
  syncManualNote: string;
  troubleshooting: string;
  trouble1q: string;
  trouble1a: string;
  trouble2q: string;
  trouble2a: string;
  trouble3q: string;
  trouble3a: string;
  generatedBy: string;
}

export const docDicts: Record<DocLang, DocDict> = {
  en: {
    title: 'Installation guide — {name}',
    intro: 'This guide was generated from the UdonSharp scripts of the asset.',
    prerequisites: 'Prerequisites',
    prereqUnity: 'Unity 2022.3 LTS (the version currently targeted by VRChat)',
    prereqSdk: 'VRChat SDK3 — Worlds (via the VRChat Creator Companion)',
    prereqUdonSharp: 'UdonSharp (bundled with the Worlds SDK since 3.4)',
    installSteps: 'Installation steps',
    step1: 'Import the asset package (or copy the scripts) into your Unity project.',
    step2: 'Wait for Unity to compile; check the Console for missing dependencies.',
    step3: 'Add the components listed below to the relevant GameObjects: {components}.',
    step4: 'Fill in the Inspector fields for each component as described in the tables below, then test in ClientSim or with a friend before publishing.',
    components: 'Components',
    componentIntro: 'Inspector fields exposed by `{name}`:',
    behaviourBadge: 'UdonSharpBehaviour',
    notBehaviourNote: 'Note: this class does not inherit from `UdonSharpBehaviour` (helper class or data container).',
    colField: 'Field',
    colType: 'Type',
    colDescription: 'Description',
    colDefault: 'Default',
    noDescription: '—',
    noDefault: '—',
    rangeNote: 'range {min} to {max}',
    noInspectorFields: 'This component exposes no Inspector fields.',
    syncedTitle: 'Synced variables',
    syncedIntro: 'The following variables are network-synced (`[UdonSynced]`). Their value replicates from the owner of the object to every player in the instance:',
    colVariable: 'Variable',
    colComponent: 'Component',
    colSyncMode: 'Sync mode',
    syncedNone: 'No synced variables were detected in these scripts.',
    syncManualNote: 'Reminder: with **Manual** sync, the owner must call `RequestSerialization()` for changes to replicate.',
    troubleshooting: 'Troubleshooting',
    trouble1q: 'The behaviour does nothing in game',
    trouble1a: 'Check that the component sits on an active GameObject and that every required Inspector reference is assigned (no `None` field).',
    trouble2q: 'Values are wrong for other players or late joiners',
    trouble2a: 'Only the owner of the object can change synced variables. Make sure ownership is transferred before writing, and that `RequestSerialization()` is called with Manual sync.',
    trouble3q: 'Udon compile errors after import',
    trouble3a: 'Verify the SDK and UdonSharp versions match the prerequisites, then reimport the scripts (right click → Reimport).',
    generatedBy: 'Generated with VRC DevKit — https://frankkdarko.github.io/VRCDevKit/',
  },
  fr: {
    title: "Guide d'installation — {name}",
    intro: "Ce guide a été généré à partir des scripts UdonSharp de l'asset.",
    prerequisites: 'Prérequis',
    prereqUnity: 'Unity 2022.3 LTS (version actuellement ciblée par VRChat)',
    prereqSdk: 'VRChat SDK3 — Worlds (via le VRChat Creator Companion)',
    prereqUdonSharp: 'UdonSharp (inclus dans le SDK Worlds depuis la 3.4)',
    installSteps: "Étapes d'installation",
    step1: "Importez le package de l'asset (ou copiez les scripts) dans votre projet Unity.",
    step2: 'Laissez Unity compiler ; vérifiez la Console pour détecter des dépendances manquantes.',
    step3: 'Ajoutez les composants listés ci-dessous aux GameObjects concernés : {components}.',
    step4: "Renseignez les champs Inspector de chaque composant comme décrit dans les tableaux ci-dessous, puis testez dans ClientSim ou avec un ami avant de publier.",
    components: 'Composants',
    componentIntro: 'Champs Inspector exposés par `{name}` :',
    behaviourBadge: 'UdonSharpBehaviour',
    notBehaviourNote: "Note : cette classe n'hérite pas de `UdonSharpBehaviour` (classe utilitaire ou conteneur de données).",
    colField: 'Champ',
    colType: 'Type',
    colDescription: 'Description',
    colDefault: 'Valeur par défaut',
    noDescription: '—',
    noDefault: '—',
    rangeNote: 'plage {min} à {max}',
    noInspectorFields: "Ce composant n'expose aucun champ Inspector.",
    syncedTitle: 'Variables synchronisées',
    syncedIntro: "Les variables suivantes sont synchronisées sur le réseau (`[UdonSynced]`). Leur valeur est répliquée depuis le propriétaire de l'objet vers tous les joueurs de l'instance :",
    colVariable: 'Variable',
    colComponent: 'Composant',
    colSyncMode: 'Mode de sync',
    syncedNone: 'Aucune variable synchronisée détectée dans ces scripts.',
    syncManualNote: 'Rappel : en sync **Manual**, le propriétaire doit appeler `RequestSerialization()` pour que les changements se propagent.',
    troubleshooting: 'Dépannage',
    trouble1q: 'Le behaviour ne fait rien en jeu',
    trouble1a: "Vérifiez que le composant est sur un GameObject actif et que toutes les références Inspector requises sont assignées (aucun champ à `None`).",
    trouble2q: 'Les valeurs sont fausses pour les autres joueurs ou les late joiners',
    trouble2a: "Seul le propriétaire de l'objet peut modifier les variables synchronisées. Assurez-vous de transférer l'ownership avant d'écrire, et d'appeler `RequestSerialization()` en sync Manual.",
    trouble3q: "Erreurs de compilation Udon après l'import",
    trouble3a: 'Vérifiez que les versions du SDK et d’UdonSharp correspondent aux prérequis, puis réimportez les scripts (clic droit → Reimport).',
    generatedBy: 'Généré avec VRC DevKit — https://frankkdarko.github.io/VRCDevKit/',
  },
  jp: {
    title: 'インストールガイド — {name}',
    intro: 'このガイドはアセットのUdonSharpスクリプトから自動生成されました。',
    prerequisites: '前提条件',
    prereqUnity: 'Unity 2022.3 LTS（現在VRChatが対象とするバージョン）',
    prereqSdk: 'VRChat SDK3 — Worlds（VRChat Creator Companion経由）',
    prereqUdonSharp: 'UdonSharp（Worlds SDK 3.4以降に同梱）',
    installSteps: 'インストール手順',
    step1: 'アセットのパッケージをUnityプロジェクトにインポート（またはスクリプトをコピー）します。',
    step2: 'Unityのコンパイルを待ち、Consoleで不足している依存関係がないか確認します。',
    step3: '以下のコンポーネントを対象のGameObjectに追加します：{components}。',
    step4: '各コンポーネントのInspector項目を下記の表に従って設定し、公開前にClientSimまたはフレンドとテストしてください。',
    components: 'コンポーネント',
    componentIntro: '`{name}` が公開するInspector項目：',
    behaviourBadge: 'UdonSharpBehaviour',
    notBehaviourNote: '注：このクラスは `UdonSharpBehaviour` を継承していません（ユーティリティまたはデータクラス）。',
    colField: '項目',
    colType: '型',
    colDescription: '説明',
    colDefault: '既定値',
    noDescription: '—',
    noDefault: '—',
    rangeNote: '範囲 {min}〜{max}',
    noInspectorFields: 'このコンポーネントにInspector項目はありません。',
    syncedTitle: '同期変数',
    syncedIntro: '以下の変数はネットワーク同期されます（`[UdonSynced]`）。値はオブジェクトのオーナーからインスタンス内の全プレイヤーへ複製されます：',
    colVariable: '変数',
    colComponent: 'コンポーネント',
    colSyncMode: '同期モード',
    syncedNone: 'これらのスクリプトに同期変数は検出されませんでした。',
    syncManualNote: '注意：**Manual** 同期では、変更を反映するためにオーナーが `RequestSerialization()` を呼ぶ必要があります。',
    troubleshooting: 'トラブルシューティング',
    trouble1q: 'ゲーム内でbehaviourが動作しない',
    trouble1a: 'コンポーネントがアクティブなGameObject上にあり、必須のInspector参照（`None` の項目）がすべて設定されているか確認してください。',
    trouble2q: '他のプレイヤーや後から入ったプレイヤーの値がおかしい',
    trouble2a: '同期変数を変更できるのはオブジェクトのオーナーだけです。書き込む前にオーナーシップを移し、Manual同期では `RequestSerialization()` を呼んでください。',
    trouble3q: 'インポート後にUdonのコンパイルエラーが出る',
    trouble3a: 'SDKとUdonSharpのバージョンが前提条件と一致しているか確認し、スクリプトを再インポートしてください（右クリック → Reimport）。',
    generatedBy: 'VRC DevKit で生成 — https://frankkdarko.github.io/VRCDevKit/',
  },
};
