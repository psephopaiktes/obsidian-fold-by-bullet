# Changelog

## 0.2.0

- Add three commands — **Convert to `-` list**, **Convert to `*` list** and
  **Convert to `+` list** — that rewrite the lines under the cursor or
  selection into list items using that bullet. Headings, quotes, ordered items
  and plain paragraphs are all accepted; task markers are preserved, and blank
  lines, thematic breaks and fenced code are skipped.
- The new commands ship without default hotkeys. Which bullet means what is
  your convention, so the binding should be yours too.

## 0.1.0

First release.

- Fold list items on open, chosen by their bullet character (`-`, `*`, `+`).
- Commands to fold on demand and to unfold a note.
- Settings for which bullets fold, whether to fold on open, whether task items
  count, and which folders to leave alone.
