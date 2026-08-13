import { App, PluginSettingTab, Setting } from "obsidian";
import type FoldByBulletPlugin from "./main";

/** Bullet characters CommonMark treats as equivalent. */
export const BULLETS = ["-", "*", "+"] as const;
export type Bullet = (typeof BULLETS)[number];

export interface FoldByBulletSettings {
	/** Bullets whose list items start folded. Anything else stays open. */
	foldedBullets: Bullet[];
	/** Fold when a note is opened. */
	foldOnOpen: boolean;
	/** Also fold headings that are immediately followed by a folded bullet. */
	includeTasks: boolean;
	/** Folders excluded from automatic folding (one path prefix per line). */
	excludedFolders: string[];
}

export const DEFAULT_SETTINGS: FoldByBulletSettings = {
	foldedBullets: ["-"],
	foldOnOpen: true,
	includeTasks: true,
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
		containerEl.empty();

		new Setting(containerEl)
			.setName("Bullets that start folded")
			.setDesc(
				"List items using these characters are collapsed when a note opens. " +
					"Items using any other bullet stay expanded.",
			);

		for (const bullet of BULLETS) {
			new Setting(containerEl)
				.setName(`Fold "${bullet}" lists`)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.foldedBullets.includes(bullet))
						.onChange(async (value) => {
							const set = new Set(this.plugin.settings.foldedBullets);
							value ? set.add(bullet) : set.delete(bullet);
							this.plugin.settings.foldedBullets = [...set];
							await this.plugin.saveSettings();
						}),
				);
		}

		new Setting(containerEl).setName("Behaviour").setHeading();

		new Setting(containerEl)
			.setName("Fold when a note is opened")
			.setDesc(
				"Turn this off to fold only on demand, using the “Fold by bullet” command.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.foldOnOpen)
					.onChange(async (value) => {
						this.plugin.settings.foldOnOpen = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Include task list items")
			.setDesc('Treat "- [ ] task" the same as a plain "-" item.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.includeTasks)
					.onChange(async (value) => {
						this.plugin.settings.includeTasks = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Excluded folders")
			.setDesc("One folder path per line. Notes inside them are never folded.")
			.addTextArea((text) =>
				text
					.setPlaceholder("Daily notes\nArchive/2024")
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
}
