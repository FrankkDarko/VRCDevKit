import { describe, expect, it } from 'vitest';
import { parseCSharpFile, stripComments } from '../parser/csharp';
import { generateMarkdown, markdownToPlainText } from '../parser/markdown';

const SAMPLE = `
using UdonSharp;
using UnityEngine;
using VRC.SDKBase;

namespace My.Asset
{
    // A door controller. class NotAClass in a comment.
    [UdonBehaviourSyncMode(BehaviourSyncMode.Manual)]
    public class SyncedDoor : UdonSharpBehaviour
    {
        [Header("References")]
        [Tooltip("The door mesh to rotate, with commas [and brackets] inside.")]
        public GameObject doorMesh;

        [SerializeField, Tooltip("Sound played when opening")]
        private AudioSource openSound;

        [Header("Tuning")]
        [Range(0.5f, 10f)]
        [Tooltip("Opening speed in degrees per second")]
        public float openSpeed = 2.5f;

        public string[] passwords = new string[] { "a", "b" };

        [UdonSynced(UdonSyncMode.None), HideInInspector]
        public bool isOpen = false;

        [UdonSynced]
        [Tooltip("Angle réplication /* not a comment */")]
        public float angle = 0f;

        private int internalCounter; // not serialized, not synced -> ignored
        public static int instances; // static -> ignored
        public const string VERSION = "1.0"; // const -> ignored

        public float Progress => angle / 90f; // expression-bodied -> ignored
        public bool IsMoving { get; private set; } // property -> ignored

        public void Interact()
        {
            string s = "a string with a } brace and a \\" quote";
            if (isOpen) { angle = 0f; }
        }
    }

    class Helper
    {
        public int notABehaviourField = 3;
    }
}
`;

describe('stripComments', () => {
  it('removes line and block comments but keeps strings', () => {
    const out = stripComments('int a = 1; // c1\n/* c2 */ string s = "// not";');
    expect(out).not.toContain('c1');
    expect(out).not.toContain('c2');
    expect(out).toContain('"// not"');
  });
});

describe('parseCSharpFile', () => {
  const result = parseCSharpFile('SyncedDoor.cs', SAMPLE);
  const door = result.classes.find((c) => c.name === 'SyncedDoor')!;

  it('finds both classes and detects UdonSharpBehaviour inheritance', () => {
    expect(result.classes.map((c) => c.name)).toEqual(['SyncedDoor', 'Helper']);
    expect(door.isUdonSharpBehaviour).toBe(true);
    expect(result.classes[1].isUdonSharpBehaviour).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it('extracts public fields and private [SerializeField] fields only', () => {
    const names = door.fields.map((f) => f.name);
    expect(names).toContain('doorMesh');
    expect(names).toContain('openSound');
    expect(names).toContain('openSpeed');
    expect(names).toContain('passwords');
    expect(names).not.toContain('internalCounter');
    expect(names).not.toContain('instances');
    expect(names).not.toContain('VERSION');
    expect(names).not.toContain('Progress');
    expect(names).not.toContain('IsMoving');
  });

  it('reads tooltips, headers, range, defaults and sync attributes', () => {
    const speed = door.fields.find((f) => f.name === 'openSpeed')!;
    expect(speed.tooltip).toBe('Opening speed in degrees per second');
    expect(speed.header).toBe('Tuning');
    expect(speed.range).toEqual(['0.5f', '10f']);
    expect(speed.defaultValue).toBe('2.5f');
    expect(speed.type).toBe('float');

    const mesh = door.fields.find((f) => f.name === 'doorMesh')!;
    expect(mesh.tooltip).toContain('commas [and brackets]');
    expect(mesh.header).toBe('References');

    const sound = door.fields.find((f) => f.name === 'openSound')!;
    expect(sound.visibility).toBe('serializedPrivate');

    const open = door.fields.find((f) => f.name === 'isOpen')!;
    expect(open.synced).toBe(true);
    expect(open.hidden).toBe(true);
    expect(open.syncMode).toBe('None');

    const angle = door.fields.find((f) => f.name === 'angle')!;
    expect(angle.synced).toBe(true);
    expect(angle.tooltip).toContain('not a comment');

    const pw = door.fields.find((f) => f.name === 'passwords')!;
    expect(pw.type).toBe('string[]');
    expect(pw.defaultValue).toContain('new string[]');
  });

  it('does not crash on broken input and reports warnings', () => {
    const broken = parseCSharpFile('Broken.cs', 'public class Oops { public int x = ;;; \n unbalanced {{{');
    expect(broken.classes.length).toBeGreaterThanOrEqual(1);
    expect(broken.warnings.some((w) => w.code === 'unbalanced-braces')).toBe(true);

    const empty = parseCSharpFile('Empty.cs', 'int x = 3; // no class here');
    expect(empty.classes).toHaveLength(0);
    expect(empty.warnings.some((w) => w.code === 'no-class-found')).toBe(true);
  });
});

describe('generateMarkdown', () => {
  const result = parseCSharpFile('SyncedDoor.cs', SAMPLE);

  it('produces the full guide structure in each language', () => {
    for (const [lang, probe] of [
      ['en', 'Installation guide'],
      ['fr', "Guide d'installation"],
      ['jp', 'インストールガイド'],
    ] as const) {
      const md = generateMarkdown([result], lang);
      expect(md).toContain(probe);
      expect(md).toContain('SyncedDoor');
      expect(md).toContain('`openSpeed`');
      expect(md).toContain('Opening speed in degrees per second'); // tooltips stay verbatim
      expect(md).toContain('| ---');
    }
  });

  it('lists synced variables including hidden ones', () => {
    const md = generateMarkdown([result], 'en');
    const syncedSection = md.slice(md.indexOf('## Synced variables'));
    expect(syncedSection).toContain('isOpen');
    expect(syncedSection).toContain('angle');
    // hidden field must not be in the inspector tables before that section
    expect(md.slice(0, md.indexOf('## Synced variables'))).not.toContain('`isOpen`');
  });

  it('converts to readable plain text', () => {
    const txt = markdownToPlainText(generateMarkdown([result], 'en'));
    expect(txt).not.toContain('###');
    expect(txt).not.toContain('**');
    expect(txt).not.toContain('| ---');
    expect(txt).toContain('openSpeed');
  });
});
