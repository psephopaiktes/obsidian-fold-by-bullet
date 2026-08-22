# Changelog

## 0.3.1

- Leave the cursor after the marker instead of in front of it. Converting an
  empty line put the cursor where it had been, which is before the marker the
  command had just written — you had to press the right arrow twice before
  typing.

## 0.3.0

- The convert commands now act on an empty line when it is the only line in
  play. Pressing Enter and reaching for the command before typing is the
  normal way to start an item, and it previously did nothing. Sweeping a
  selection across a note still leaves its blank lines alone.
- A list item with a marker but no text (`- `) is converted too, instead of
  being left as it was.

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
