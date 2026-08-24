import { App, PluginSettingTab, Setting } from "obsidian";
import type FoldByBulletPlugin from "./main";
import { translate } from "./i18n";

/** Bullet characters CommonMark treats as equivalent. */
export const BULLETS = ["-", "*", "+"] as const;
export type Bullet = (typeof BULLETS)[number];

export interface FoldByBulletSettings {
	/** Bullets whose plain list items start folded. */
	foldedBullets: Bullet[];
	/**
	 * Bullets whose task items start folded.
	 *
	 * Kept apart from `foldedBullets` because a checkbox reads as a different
	 * kind of thing from a plain item, even when the two share a bullet.
	 */
	foldedTaskBullets: Bullet[];
	/** Fold when a note is opened. */
	foldOnOpen: boolean;
	/** Folders excluded from automatic folding (one path prefix per line). */
	excludedFolders: string[];
}

export const DEFAULT_SETTINGS: FoldByBulletSettings = {
	foldedBullets: ["-"],
	foldedTaskBullets: ["-"],
	foldOnOpen: true,
	excludedFolders: [],
};

export class FoldByBulletSettingTab extends PluginSettingTab {
	plugin: FoldByBulletPlugin;

	constructor(app: App, plugin: FoldByBulletPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const text = translate();
		containerEl.empty();

		new Setting(containerEl)
			.setName(text.bulletsHeading)
			.setDesc(text.bulletsDesc);
		this.addBulletToggles(containerEl, "foldedBullets", text.foldBullet);

		new Setting(containerEl).setName(text.tasksHeading).setDesc(text.tasksDesc);
		this.addBulletToggles(containerEl, "foldedTaskBullets", text.foldTask);

		new Setting(containerEl).setName(text.behaviourHeading).setHeading();

		new Setting(containerEl)
			.setName(text.foldOnOpen)
			.setDesc(text.foldOnOpenDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.foldOnOpen)
					.onChange(async (value) => {
						this.plugin.settings.foldOnOpen = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(text.excludedFolders)
			.setDesc(text.excludedFoldersDesc)
			.addTextArea((area) =>
				area
					.setPlaceholder(text.excludedFoldersPlaceholder)
					.setValue(this.plugin.settings.excludedFolders.join("\n"))
					.onChange(async (value) => {
						this.plugin.settings.excludedFolders = value
							.split("\n")
							.map((line) => line.trim())
							.filter((line) => line.length > 0);
						await this.plugin.saveSettings();
					}),
			);
	}

	/** One toggle per bullet, writing into the given list of bullets. */
	private addBulletToggles(
		containerEl: HTMLElement,
		key: "foldedBullets" | "foldedTaskBullets",
		label: (bullet: string) => string,
	): void {
		for (const bullet of BULLETS) {
			new Setting(containerEl).setName(label(bullet)).addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings[key].includes(bullet))
					.onChange(async (value) => {
						const chosen = new Set(this.plugin.settings[key]);
						value ? chosen.add(bullet) : chosen.delete(bullet);
						this.plugin.settings[key] = BULLETS.filter((b) => chosen.has(b));
						await this.plugin.saveSettings();
					}),
			);
		}
	}
}
