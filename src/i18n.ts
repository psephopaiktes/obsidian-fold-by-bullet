import { getLanguage } from "obsidian";

/**
 * Settings copy, translated.
 *
 * Obsidian has no i18n facility for plugins, so this is a plain lookup keyed
 * by the app's own language. Anything missing falls back to English rather
 * than to a key name, so a partial translation still reads as prose.
 */
export interface Strings {
	bulletsHeading: string;
	bulletsDesc: string;
	foldBullet: (bullet: string) => string;
	tasksHeading: string;
	tasksDesc: string;
	foldTask: (bullet: string) => string;
	behaviourHeading: string;
	foldOnOpen: string;
	foldOnOpenDesc: string;
	excludedFolders: string;
	excludedFoldersDesc: string;
	excludedFoldersPlaceholder: string;
}

const en: Strings = {
	bulletsHeading: "Bullets that start folded",
	bulletsDesc:
		"List items using these characters are collapsed when a note opens. " +
		"Items using any other bullet stay expanded.",
	foldBullet: (bullet) => `Fold "${bullet}" lists`,
	tasksHeading: "Task items that start folded",
	tasksDesc:
		"Checkboxes are configured separately, so a task can behave differently " +
		"from a plain item written with the same bullet.",
	foldTask: (bullet) => `Fold "${bullet} [ ]" tasks`,
	behaviourHeading: "Behaviour",
	foldOnOpen: "Fold when a note is opened",
	foldOnOpenDesc:
		"Turn this off to fold only on demand, using the “Fold by bullet” command.",
	excludedFolders: "Excluded folders",
	excludedFoldersDesc:
		"One folder path per line. Notes inside them are never folded.",
	excludedFoldersPlaceholder: "Daily notes\nArchive/2024",
};

const ja: Partial<Strings> = {
	bulletsHeading: "折りたたんで開くリスト記号",
	bulletsDesc:
		"この記号で書かれたリスト項目は、ノートを開いたときに折りたたまれます。" +
		"ほかの記号の項目は開いたままです。",
	foldBullet: (bullet) => `「${bullet}」のリストを折りたたむ`,
	tasksHeading: "折りたたんで開くタスク",
	tasksDesc:
		"チェックボックスは別に設定できます。同じ記号でも、タスクだけ違う扱いにできます。",
	foldTask: (bullet) => `「${bullet} [ ]」のタスクを折りたたむ`,
	behaviourHeading: "動作",
	foldOnOpen: "ノートを開いたときに折りたたむ",
	foldOnOpenDesc:
		"オフにすると、「Fold by bullet」コマンドを実行したときだけ折りたたみます。",
	excludedFolders: "除外するフォルダ",
	excludedFoldersDesc:
		"1行に1つ、フォルダのパスを書きます。その中のノートは自動で折りたたまれません。",
};

const zh: Partial<Strings> = {
	bulletsHeading: "默认折叠的列表符号",
	bulletsDesc:
		"使用这些符号的列表项会在打开笔记时折叠。使用其他符号的列表项保持展开。",
	foldBullet: (bullet) => `折叠「${bullet}」列表`,
	tasksHeading: "默认折叠的任务",
	tasksDesc: "复选框单独设置，因此即使符号相同，任务也可以有不同的行为。",
	foldTask: (bullet) => `折叠「${bullet} [ ]」任务`,
	behaviourHeading: "行为",
	foldOnOpen: "打开笔记时折叠",
	foldOnOpenDesc: "关闭后，仅在执行「Fold by bullet」命令时折叠。",
	excludedFolders: "排除的文件夹",
	excludedFoldersDesc: "每行一个文件夹路径。其中的笔记不会被自动折叠。",
};

const es: Partial<Strings> = {
	bulletsHeading: "Viñetas que empiezan plegadas",
	bulletsDesc:
		"Los elementos de lista que usan estos caracteres se pliegan al abrir una " +
		"nota. Los que usan otra viñeta permanecen desplegados.",
	foldBullet: (bullet) => `Plegar listas con «${bullet}»`,
	tasksHeading: "Tareas que empiezan plegadas",
	tasksDesc:
		"Las casillas se configuran aparte, así que una tarea puede comportarse " +
		"de forma distinta a un elemento normal con la misma viñeta.",
	foldTask: (bullet) => `Plegar tareas con «${bullet} [ ]»`,
	behaviourHeading: "Comportamiento",
	foldOnOpen: "Plegar al abrir una nota",
	foldOnOpenDesc:
		"Desactívalo para plegar solo con el comando «Fold by bullet».",
	excludedFolders: "Carpetas excluidas",
	excludedFoldersDesc:
		"Una ruta de carpeta por línea. Las notas que contienen nunca se pliegan.",
};

const TRANSLATIONS: Record<string, Partial<Strings>> = { ja, zh, es };

/**
 * Obsidian reports Simplified Chinese as `zh`, `zh-CN` or `zh_cn` depending on
 * where the value came from, and Traditional as `zh-TW`. Only Simplified is
 * translated here, so Traditional falls through to English.
 */
function normalize(language: string): string {
	const code = language.toLowerCase().replace("_", "-");
	if (code.startsWith("zh") && !code.startsWith("zh-tw")) return "zh";
	return code.split("-")[0];
}

export function translate(): Strings {
	let language = "en";
	try {
		language = getLanguage() || "en";
	} catch {
		// getLanguage() arrived in 1.8.7; older apps just get English.
	}
	return { ...en, ...TRANSLATIONS[normalize(language)] };
}
