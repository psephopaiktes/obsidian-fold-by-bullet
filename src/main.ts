import { Editor, MarkdownView, Notice, Plugin, TFile } from "obsidian";
import { foldEffect, unfoldAll } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";

import { convertLines, type LineEdit } from "./convert";
import { findFoldRanges, isExcluded } from "./fold";
import {
	BULLETS,
	DEFAULT_SETTINGS,
	FoldByBulletSettingTab,
	type Bullet,
	type FoldByBulletSettings,
} from "./settings";

/** Command id fragments, since the bullet characters themselves are not usable. */
const BULLET_SLUGS: Record<Bullet, string> = {
	"-": "hyphen",
	"*": "asterisk",
	"+": "plus",
};

/**
 * Obsidian restores its own saved fold state shortly after a file opens.
 * Waiting a tick keeps our folds from being overwritten by that restore.
 */
const APPLY_DELAY_MS = 60;

export default class FoldByBulletPlugin extends Plugin {
	settings: FoldByBulletSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new FoldByBulletSettingTab(this.app, this));

		this.addCommand({
			id: "fold-by-bullet",
			name: "Fold by bullet",
			editorCallback: (_editor, ctx) => {
				const view = ctx instanceof MarkdownView ? ctx : null;
				if (view) this.applyFolds(view, { force: true });
			},
		});

		this.addCommand({
			id: "unfold-all",
			name: "Unfold everything in this note",
			editorCallback: (editor) => {
				const cm = this.getEditorView(editor);
				if (cm) unfoldAll(cm);
			},
		});

		// Deliberately shipped without default hotkeys: which bullet means what
		// is the user's convention, so the binding should be too.
		for (const bullet of BULLETS) {
			this.addCommand({
				id: `convert-to-${BULLET_SLUGS[bullet]}-list`,
				name: `Convert to "${bullet}" list`,
				editorCallback: (editor) => this.convertToBullet(editor, bullet),
			});
		}

		this.registerEvent(
			this.app.workspace.on("file-open", (file) => {
				if (!this.settings.foldOnOpen || !file) return;
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) {
					window.setTimeout(
						() => this.applyFolds(view, { file }),
						APPLY_DELAY_MS,
					);
				}
			}),
		);
	}

	/**
	 * Rewrite every line the cursor or selection touches into a list item
	 * using `bullet`.
	 *
	 * Edits are applied bottom-up so that earlier replacements cannot shift
	 * the positions of the ones still queued.
	 */
	private convertToBullet(editor: Editor, bullet: Bullet): void {
		const selections = editor.listSelections();
		const targets = new Set<number>();
		for (const selection of selections) {
			const from = Math.min(selection.anchor.line, selection.head.line);
			const to = Math.max(selection.anchor.line, selection.head.line);
			for (let line = from; line <= to; line++) targets.add(line);
		}

		const lines = editor.getValue().split("\n");
		const edits = convertLines(lines, targets, bullet);
		if (edits.length === 0) return;

		for (const edit of [...edits].reverse()) {
			editor.replaceRange(
				edit.text,
				{ line: edit.line, ch: 0 },
				{ line: edit.line, ch: lines[edit.line].length },
			);
		}

		this.restoreCursor(editor, selections, lines, edits);
	}

	/**
	 * Keep a lone cursor where the writer expects it.
	 *
	 * Replacing the whole line leaves the cursor at the same offset, which on
	 * an empty line means sitting in front of the marker that was just added.
	 * Shift it by however much the line grew, and never let it end up inside
	 * or before the marker.
	 */
	private restoreCursor(
		editor: Editor,
		selections: ReturnType<Editor["listSelections"]>,
		before: string[],
		edits: LineEdit[],
	): void {
		if (selections.length !== 1) return;
		const { anchor, head } = selections[0];
		if (anchor.line !== head.line || anchor.ch !== head.ch) return;

		const edit = edits.find((candidate) => candidate.line === head.line);
		if (!edit) return;

		const marker = /^[\t ]*[-*+] /.exec(edit.text);
		const floor = marker ? marker[0].length : 0;
		const shifted = head.ch + edit.text.length - before[edit.line].length;

		editor.setCursor({
			line: edit.line,
			ch: Math.min(edit.text.length, Math.max(floor, shifted)),
		});
	}

	/**
	 * Collapse every qualifying list item in the given view.
	 *
	 * `force` bypasses the folder exclusion list, so the command still works
	 * when it is invoked deliberately.
	 */
	private applyFolds(
		view: MarkdownView,
		options: { file?: TFile; force?: boolean } = {},
	): void {
		const file = options.file ?? view.file;
		if (
			!options.force &&
			file &&
			isExcluded(file.path, this.settings.excludedFolders)
		) {
			return;
		}

		const cm = this.getEditorView(view.editor);
		if (!cm) {
			if (options.force) {
				new Notice("Fold by Bullet: could not reach the editor.");
			}
			return;
		}

		const lines = view.editor.getValue().split("\n");
		const ranges = findFoldRanges(
			lines,
			this.settings.foldedBullets,
			this.settings.foldedTaskBullets,
		);
		if (ranges.length === 0) return;

		const doc = cm.state.doc;
		const effects = [];

		for (const range of ranges) {
			if (range.to >= doc.lines) continue;
			const head = doc.line(range.from + 1);
			const tail = doc.line(range.to + 1);
			// CodeMirror folds the span between the end of the header line and
			// the end of the block, leaving the header itself visible.
			if (tail.to > head.to) {
				effects.push(foldEffect.of({ from: head.to, to: tail.to }));
			}
		}

		if (effects.length > 0) {
			cm.dispatch({ effects });
		}
	}

	/** Obsidian exposes the CodeMirror instance, but not in the public typings. */
	private getEditorView(editor: unknown): EditorView | null {
		const cm = (editor as { cm?: EditorView })?.cm;
		return cm && typeof cm.dispatch === "function" ? cm : null;
	}

	async loadSettings(): Promise<void> {
		const saved = ((await this.loadData()) ?? {}) as Partial<FoldByBulletSettings> & {
			includeTasks?: boolean;
		};
		this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);

		// Before 1.0.0 a single `includeTasks` flag decided whether checkboxes
		// followed the plain bullet settings. Carry that choice over so nobody
		// finds their notes folding differently after an update.
		if (saved.foldedTaskBullets === undefined) {
			this.settings.foldedTaskBullets =
				saved.includeTasks === false ? [] : [...this.settings.foldedBullets];
			await this.saveSettings();
		}
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
