import type { Bullet } from "./settings";

/** A line that owns indented content below it. */
export interface FoldRange {
	/** 0-based line index of the parent item. */
	from: number;
	/** 0-based line index of the last child line. */
	to: number;
}

const BULLET_RE = /^(\s*)([-*+])(\s+)(\[[ xX]\]\s+)?/;
const FENCE_RE = /^\s*(```|~~~)/;

/** Width of a tab when measuring indentation. Matches Obsidian's default. */
const TAB_WIDTH = 4;

function indentWidth(raw: string): number {
	let width = 0;
	for (const char of raw) {
		width += char === "\t" ? TAB_WIDTH - (width % TAB_WIDTH) : 1;
	}
	return width;
}

/**
 * Find every list item that starts folded and has at least one line of nested
 * content underneath it.
 *
 * A checkbox is looked up in `foldedTaskBullets` and a plain item in
 * `foldedBullets`, so `- [ ]` and `-` can be set independently.
 *
 * The parser walks raw Markdown rather than the rendered tree on purpose: the
 * bullet character is discarded during parsing, since CommonMark treats `-`,
 * `*` and `+` as equivalent.
 */
export function findFoldRanges(
	lines: string[],
	foldedBullets: readonly Bullet[],
	foldedTaskBullets: readonly Bullet[],
): FoldRange[] {
	if (foldedBullets.length === 0 && foldedTaskBullets.length === 0) return [];

	const plain = new Set<string>(foldedBullets);
	const tasks = new Set<string>(foldedTaskBullets);
	const ranges: FoldRange[] = [];
	/** Open candidates, innermost last. */
	const stack: { line: number; indent: number }[] = [];
	let inFence = false;

	const close = (upto: number, lastContent: number) => {
		while (stack.length > 0 && stack[stack.length - 1].indent >= upto) {
			const item = stack.pop();
			if (item && lastContent > item.line) {
				ranges.push({ from: item.line, to: lastContent });
			}
		}
	};

	let lastContentLine = -1;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (FENCE_RE.test(line)) {
			inFence = !inFence;
			lastContentLine = i;
			continue;
		}
		if (inFence) {
			lastContentLine = i;
			continue;
		}
		if (line.trim().length === 0) continue;

		const match = BULLET_RE.exec(line);
		const indent = indentWidth(/^\s*/.exec(line)?.[0] ?? "");

		if (match) {
			const [, rawIndent, bullet, , task] = match;
			const width = indentWidth(rawIndent);
			close(width, lastContentLine);
			if (task ? tasks.has(bullet) : plain.has(bullet)) {
				stack.push({ line: i, indent: width });
			}
			lastContentLine = i;
			continue;
		}

		// Paragraph continuation or embedded block. It belongs to the closest
		// item only when it is indented past that item's marker.
		if (stack.length > 0 && indent > stack[stack.length - 1].indent) {
			lastContentLine = i;
			continue;
		}

		close(indent, lastContentLine);
		lastContentLine = i;
	}

	close(0, lastContentLine);
	close(-1, lastContentLine);

	return ranges.sort((a, b) => a.from - b.from);
}

/** True when the note lives under one of the excluded folder prefixes. */
export function isExcluded(path: string, excluded: readonly string[]): boolean {
	return excluded.some(
		(folder) => path === folder || path.startsWith(`${folder}/`),
	);
}
