import type { Bullet } from "./settings";

/** Block markers that can sit in front of a line's real content. */
const MARKER_RE = /^(?:#{1,6}[ \t]+|>[ \t]?|[-*+][ \t]+|\d+[.)][ \t]+)/;
const FENCE_RE = /^\s*(```|~~~)/;
const THEMATIC_BREAK_RE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const INDENT_RE = /^([\t ]*)([\s\S]*)$/;

export interface LineEdit {
	/** 0-based line index. */
	line: number;
	text: string;
}

/**
 * Rewrite a single line so that it becomes a list item using `bullet`.
 *
 * Any existing block marker is stripped first, so a heading, quote, ordered
 * item or differently-bulleted item all end up in the same shape. A task
 * marker (`[ ]`) is content rather than a block marker, so it survives.
 *
 * An empty line yields a bare marker, which is what you want when you press
 * Enter and then reach for the command before typing anything.
 */
export function setBullet(line: string, bullet: Bullet): string {
	const [, indent, body] = INDENT_RE.exec(line) as RegExpExecArray;

	let rest = body;
	let previous: string;
	do {
		previous = rest;
		rest = rest.replace(MARKER_RE, "");
	} while (rest !== previous);

	return rest.length === 0 ? `${indent}${bullet} ` : `${indent}${bullet} ${rest}`;
}

/**
 * Work out which of `targets` need rewriting.
 *
 * Thematic breaks and anything inside a fenced code block are left alone; a
 * bullet there would corrupt the note rather than restructure it. Fences are
 * tracked from the top of the document, because a line only counts as code
 * when an unclosed fence precedes it.
 *
 * Blank lines depend on how many lines are in play. Sweeping a selection
 * across a note should not litter its blank lines with markers, but a cursor
 * sitting alone on an empty line is someone asking for a new item — that is
 * the normal way to start one.
 */
export function convertLines(
	lines: string[],
	targets: Iterable<number>,
	bullet: Bullet,
): LineEdit[] {
	const wanted = new Set(targets);
	if (wanted.size === 0) return [];
	const keepBlank = wanted.size === 1;

	const last = Math.max(...wanted);
	const edits: LineEdit[] = [];
	let fence: string | null = null;

	for (let index = 0; index <= last && index < lines.length; index++) {
		const line = lines[index];

		const fenceMatch = FENCE_RE.exec(line);
		if (fenceMatch) {
			fence = fence === fenceMatch[1] ? null : (fence ?? fenceMatch[1]);
			continue;
		}
		if (fence || !wanted.has(index)) continue;
		if (THEMATIC_BREAK_RE.test(line)) continue;
		if (!keepBlank && line.trim().length === 0) continue;

		const text = setBullet(line, bullet);
		if (text !== line) edits.push({ line: index, text });
	}

	return edits;
}
