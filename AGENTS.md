# Notes for LLMs working on this repo

An Obsidian plugin that decides which list items start folded, based on the
bullet character (`-`, `*`, `+`) they were written with.

## The one idea worth knowing

CommonMark treats the three bullet characters as equivalent, so Obsidian's
parser throws the character away. Nothing downstream of the parser can tell a
`-` item from a `+` item.

So this plugin **reads the raw Markdown itself** and applies CodeMirror fold
ranges. Any change that tries to work from Obsidian's parsed tree instead will
fail for this reason, not because of a bug.

## Layout

```
src/fold.ts      findFoldRanges(lines, foldedBullets, foldedTaskBullets)
src/convert.ts   setBullet / convertLines — rewrite lines to a given bullet
src/settings.ts  settings shape, defaults, settings tab
src/i18n.ts      settings copy, keyed by Obsidian's getLanguage()
src/main.ts      commands, the file-open hook, CodeMirror plumbing
```

`fold.ts` and `convert.ts` are pure functions over an array of lines. They have
no Obsidian imports beyond a type, so they can be exercised with plain Node —
bundle a throwaway script with esbuild and run it. Do that before touching
anything else; most bugs live there and the round trip is seconds.

## Commands

```bash
npm run dev      # watch build
npm run build    # type-check, then produce a minified main.js
```

To test against a real vault, symlink the repository into its plugin folder:

```bash
ln -s "$(pwd)" /path/to/vault/.obsidian/plugins/fold-by-bullet
```

`obsidian plugin:reload id=fold-by-bullet` reloads it without restarting the
app, if the Obsidian CLI is set up.

## Conventions

- **No default hotkeys on the convert commands.** Which bullet means what is
  the user's own convention, so the binding should be theirs too.
- **Settings migrate on load.** `loadSettings()` fills in fields added by later
  versions from whatever the old shape implied, then saves. Never let an update
  silently change how someone's notes fold.
- **Translations fall back string by string**, not file by file, so a partial
  translation still reads as prose. English is the source of truth.
- Commands and settings use sentence case and never repeat the plugin name,
  per Obsidian's plugin guidelines.

## Gotchas

- `editor.cm` reaches CodeMirror through a **private API**. It is typed as
  optional and guarded, and it may break in a future Obsidian release.
- Obsidian restores its own saved fold state shortly after a file opens, so
  folds are applied after a short delay (`APPLY_DELAY_MS`). Removing the delay
  makes folding look intermittent.
- `getLanguage()` needs Obsidian 1.8.7, which is why `minAppVersion` sits
  there. It is wrapped in try/catch anyway.

## Releasing

Bump `manifest.json`, `package.json` and `versions.json`, write a `CHANGELOG.md`
entry, then push a bare version tag:

```bash
git tag 1.0.0 && git push origin 1.0.0
```

The release workflow builds and attaches `main.js` and `manifest.json`.
Obsidian reads the latest release's `manifest.json`, so no pull request is
needed for updates — only for the initial community listing.
