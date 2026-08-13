# Fold by Bullet

An [Obsidian](https://obsidian.md) plugin that decides which list items start folded, based on the bullet character you typed.

```markdown
- Reference                 ← starts folded
    - RFC 5545
    - RFC 3339

+ Today's plan              ← stays open
    + Ship the release
    + Review the PR
```

Markdown treats `-`, `*` and `+` as the same thing, so the choice is normally cosmetic. This plugin gives it a meaning: one character for "detail I rarely need", another for "keep this in front of me".

## Why

Long notes accumulate reference material that you want to keep but not look at. Obsidian can fold a list, but the fold is a per-session gesture, not a property of the note. You end up refolding the same sections every time you come back.

Existing solutions ask you to annotate the note — `%% fold %%` markers, callouts, `<details>` blocks. That works, but it adds syntax to text you have to read and edit for the rest of its life.

This plugin uses something already in your notes: the bullet you happened to type. Change one character and the section's default state changes with it.

## How it works

Obsidian's parser discards the bullet character, because CommonMark defines the three markers as equivalent. So the plugin reads the raw Markdown instead, finds list items written with the configured characters, and applies CodeMirror fold ranges to them when the note opens.

## Installation

### From Obsidian

Open **Settings → Community plugins → Browse**, search for **Fold by Bullet**, then install and enable it.

### Manually

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/psephopaiktes/obsidian-fold-by-bullet/releases/latest).
2. Create a folder called `fold-by-bullet` inside `<your vault>/.obsidian/plugins/`.
3. Copy the files into it.
4. Reload Obsidian and enable the plugin under **Settings → Community plugins**.

### With BRAT

Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) and add this repository.

## Settings

| Setting | Default | What it does |
| --- | --- | --- |
| Fold `-` lists | on | Items written with `-` collapse when the note opens |
| Fold `*` lists | off | Same, for `*` |
| Fold `+` lists | off | Same, for `+` |
| Fold when a note is opened | on | Turn off to fold only via the command |
| Include task list items | on | Treat `- [ ] task` like a plain `-` item |
| Excluded folders | empty | One path per line. Notes inside are never folded automatically |

Turn on every bullet and the plugin becomes "fold all lists on open". Turn on none and nothing happens.

## Commands

- **Fold by bullet** — apply the rules to the current note. Ignores the folder exclusion list, since you asked for it explicitly.
- **Unfold everything in this note** — expand all folds.

Bind them under **Settings → Hotkeys**.

## Limitations

- **Editing view only.** Reading view renders its own DOM and does not expose fold state. Notes opened in Reading view are unaffected.
- **Obsidian's saved folds win on conflict.** Obsidian restores its own per-file fold state when a note opens. The plugin applies its folds shortly afterwards, which means a section you deliberately expanded last session collapses again. Turn off *Fold when a note is opened* and use the command if you would rather keep Obsidian's memory.
- **Bullet changes need a reopen.** Editing `-` to `+` does not unfold the section on the spot. Reopen the note or run the command.
- **Uses a private API.** Reaching CodeMirror through `editor.cm` is not part of Obsidian's public plugin API and may break in a future release.

## Development

```bash
npm install
npm run dev     # watch build
npm run build   # type-check and produce a minified main.js
```

To test against a real vault, symlink the repository into its plugin folder:

```bash
ln -s "$(pwd)" /path/to/vault/.obsidian/plugins/fold-by-bullet
```

The fold detection in `src/fold.ts` is a pure function over an array of lines, so it can be exercised without Obsidian running.

## License

[MIT](LICENSE)
