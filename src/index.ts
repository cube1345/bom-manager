/**
 * 入口文件
 *
 * 本文件为默认扩展入口文件，如果你想要配置其它文件作为入口文件，
 * 请修改 `extension.json` 中的 `entry` 字段；
 *
 * 请在此处使用 `export`  导出所有你希望在 `headerMenus` 中引用的方法，
 * 方法通过方法名与 `headerMenus` 关联。
 *
 * 如需了解更多开发细节，请阅读：
 * https://prodocs.lceda.cn/cn/api/guide/
 */
import * as extensionConfig from '../extension.json';

const BOM_IFRAME_ID = 'bom-manager-main';
const BOM_IFRAME_TITLE = '物料管理助手';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function activate(status?: 'onStartupFinished', arg?: string): void {}

export async function openBomManager(): Promise<void> {
	const envInfo = (() => {
		try {
			const env = eda.sys_Environment;
			return {
				isClient: env?.isClient?.() ?? undefined,
				isWeb: env?.isWeb?.() ?? undefined,
				isOnlineMode: env?.isOnlineMode?.() ?? undefined,
				isHalfOfflineMode: env?.isHalfOfflineMode?.() ?? undefined,
				isOfflineMode: env?.isOfflineMode?.() ?? undefined,
				editorVersion: env?.getEditorCurrentVersion?.() ?? '',
				compiledDate: env?.getEditorCompliedDate?.() ?? '',
			};
		} catch {
			return {
				isClient: undefined,
				isWeb: undefined,
				isOnlineMode: undefined,
				isHalfOfflineMode: undefined,
				isOfflineMode: undefined,
				editorVersion: '',
				compiledDate: '',
			};
		}
	})();

	const iframeApi = (eda as any)?.sys_IFrame;
	if (!iframeApi || typeof iframeApi.openIFrame !== 'function') {
		eda.sys_Dialog.showInformationMessage(
			`当前 EDA 版本可能不支持 IFrame 插件窗口，无法打开。\n\n` +
				`环境：isClient=${String(envInfo.isClient)} isWeb=${String(envInfo.isWeb)}\n` +
				`版本：${envInfo.editorVersion || '未知'}\n` +
				`编译日期：${envInfo.compiledDate || '未知'}\n\n` +
				`请升级嘉立创 EDA 专业版后重试。`,
			BOM_IFRAME_TITLE,
		);
		return;
	}

	// In some clients openIFrame() returns false even when the dialog was created.
	// Boot receipt in sys_Storage is the most reliable signal for "rendered".
	const waitForIframeBootTs = async (minTs: number, msTimeout: number) => {
		const start = Date.now();
		while (Date.now() - start < msTimeout) {
			try {
				const value = (eda as any)?.sys_Storage?.getExtensionUserConfig?.('bom-manager-last-boot-ts');
				const ts = typeof value === 'number' ? value : typeof value?.ts === 'number' ? value.ts : 0;
				if (ts && ts >= minTs) return true;
			} catch {}
			await new Promise((r) => setTimeout(r, 120));
		}
		return false;
	};

	// Avoid opening multiple windows: only open the default page once.
	// If it still doesn't render after a while, ask the user before trying the compat page.
	const requestTs = Date.now();
	try {
		await (eda as any)?.sys_Storage?.setExtensionUserConfig?.('bom-manager-open-request-ts', requestTs);
	} catch {}

	let ok = false;
	try {
		ok = (await (eda as any).sys_IFrame.openIFrame('/iframe/index.html', 1600, 980)) === true;
	} catch {}
	if (ok) return;

	// If openIFrame returned false, give it more time to boot (some clients are slow) without opening another window.
	// This prevents the "one click opens two windows" issue.
	setTimeout(() => {
		void (async () => {
			try {
				const booted = await waitForIframeBootTs(requestTs, 6000);
				if (booted) return;

				eda.sys_Dialog.showConfirmationMessage(
					`插件窗口可能已打开但未能渲染完成。\n\n` +
						`是否改用兼容页面打开？（可能会再打开一个窗口）\n\n` +
						`环境：isClient=${String(envInfo.isClient)} isWeb=${String(envInfo.isWeb)}\n` +
						`版本：${envInfo.editorVersion || '未知'}\n` +
						`编译日期：${envInfo.compiledDate || '未知'}`,
					BOM_IFRAME_TITLE,
					'使用兼容页面',
					'取消',
					(mainClicked: boolean) => {
						if (!mainClicked) return;
						try {
							void (eda as any).sys_IFrame.openIFrame('/iframe/index.abs.html', 1600, 980);
						} catch {}
					},
				);
			} catch {}
		})();
	}, 1);

	// Return immediately so opening stays fast.
	return;

	eda.sys_Dialog.showInformationMessage(
		`打开插件窗口失败。\n\n` +
			`环境：isClient=${String(envInfo.isClient)} isWeb=${String(envInfo.isWeb)}\n` +
			`模式：online=${String(envInfo.isOnlineMode)} halfOffline=${String(envInfo.isHalfOfflineMode)} offline=${String(envInfo.isOfflineMode)}\n` +
			`版本：${envInfo.editorVersion || '未知'}\n` +
			`编译日期：${envInfo.compiledDate || '未知'}\n\n` +
			`建议：请先使用“环境自检”确认资源可读；若仍失败，建议升级 EDA 后重试。`,
		BOM_IFRAME_TITLE,
	);
}

export async function selfCheck(): Promise<void> {
	const envInfo = (() => {
		try {
			const env = (eda as any)?.sys_Environment;
			return {
				isClient: env?.isClient?.() ?? undefined,
				isWeb: env?.isWeb?.() ?? undefined,
				isOnlineMode: env?.isOnlineMode?.() ?? undefined,
				isHalfOfflineMode: env?.isHalfOfflineMode?.() ?? undefined,
				isOfflineMode: env?.isOfflineMode?.() ?? undefined,
				editorVersion: env?.getEditorCurrentVersion?.() ?? '',
				compiledDate: env?.getEditorCompliedDate?.() ?? '',
			};
		} catch {
			return {
				isClient: undefined,
				isWeb: undefined,
				isOnlineMode: undefined,
				isHalfOfflineMode: undefined,
				isOfflineMode: undefined,
				editorVersion: '',
				compiledDate: '',
			};
		}
	})();

	const has = (value: unknown) => (value ? 'yes' : 'no');

	const apiInfo = (() => {
		const fsApi = (eda as any)?.sys_FileSystem;
		const iframeApi = (eda as any)?.sys_IFrame;
		const storageApi = (eda as any)?.sys_Storage;
		const logApi = (eda as any)?.sys_Log;
		const dialogApi = (eda as any)?.sys_Dialog;
		return {
			sys_FileSystem: has(fsApi),
			getExtensionFile: has(fsApi && typeof fsApi.getExtensionFile === 'function'),
			openReadFileDialog: has(fsApi && typeof fsApi.openReadFileDialog === 'function'),
			saveFile: has(fsApi && typeof fsApi.saveFile === 'function'),
			sys_IFrame: has(iframeApi),
			openIFrame: has(iframeApi && typeof iframeApi.openIFrame === 'function'),
			closeIFrame: has(iframeApi && typeof iframeApi.closeIFrame === 'function'),
			hideIFrame: has(iframeApi && typeof iframeApi.hideIFrame === 'function'),
			showIFrame: has(iframeApi && typeof iframeApi.showIFrame === 'function'),
			sys_Storage: has(storageApi),
			getExtensionUserConfig: has(storageApi && typeof storageApi.getExtensionUserConfig === 'function'),
			setExtensionUserConfig: has(storageApi && typeof storageApi.setExtensionUserConfig === 'function'),
			sys_Log: has(logApi),
			sys_Dialog: has(dialogApi),
		};
	})();

	const fileChecks = await (async () => {
		const fsApi = (eda as any)?.sys_FileSystem;
		if (!fsApi || typeof fsApi.getExtensionFile !== 'function') {
			return {
				'/iframe/index.html': 'n/a',
				'/iframe/index.abs.html': 'n/a',
				'/iframe/app.js': 'n/a',
				'/iframe/styles.css': 'n/a',
				'/dist/index.js': 'n/a',
			} as Record<string, string>;
		}
		const targets = ['/iframe/index.html', '/iframe/index.abs.html', '/iframe/app.js', '/iframe/styles.css', '/dist/index.js'] as const;
		const results = await Promise.all(
			targets.map(async (uri) => {
				try {
					const file = await fsApi.getExtensionFile(uri);
					return [uri, file ? 'ok' : 'missing'] as const;
				} catch (e) {
					return [uri, `error(${e instanceof Error ? e.message : String(e)})`] as const;
				}
			}),
		);
		return Object.fromEntries(results) as Record<(typeof targets)[number], string>;
	})();

	const lastBoot = (() => {
		try {
			return (eda as any)?.sys_Storage?.getExtensionUserConfig?.('bom-manager-last-boot');
		} catch {
			return undefined;
		}
	})();
	const lastErrorInfo = (() => {
		try {
			return (eda as any)?.sys_Storage?.getExtensionUserConfig?.('bom-manager-last-error');
		} catch {
			return undefined;
		}
	})();

	const lines: string[] = [];
	lines.push(`[物料管理助手 SelfCheck] v${extensionConfig.version}`);
	lines.push(`env: isClient=${String(envInfo.isClient)} isWeb=${String(envInfo.isWeb)}`);
	lines.push(
		`mode: online=${String(envInfo.isOnlineMode)} halfOffline=${String(envInfo.isHalfOfflineMode)} offline=${String(envInfo.isOfflineMode)}`,
	);
	lines.push(`eda: version=${envInfo.editorVersion || '未知'} compiledDate=${envInfo.compiledDate || '未知'}`);
	lines.push('api:');
	for (const [k, v] of Object.entries(apiInfo)) lines.push(`  - ${k}: ${v}`);
	lines.push('resources:');
	for (const [k, v] of Object.entries(fileChecks)) lines.push(`  - ${k}: ${v}`);
	lines.push('iframe:');
	lines.push(`  - lastBoot: ${lastBoot ? JSON.stringify(lastBoot) : 'none'}`);
	lines.push(`  - lastError: ${lastErrorInfo ? JSON.stringify(lastErrorInfo) : 'none'}`);

	const report = lines.join('\n');
	try {
		eda.sys_Log?.add?.(report, 'info' as any);
	} catch {}

	eda.sys_Dialog.showInformationMessage(
		`${report}\n\n说明：\n- resources=missing 通常表示打包时未包含该文件（或路径解析不兼容）。\n- 若 openIFrame=yes 但仍无法渲染，多数是宿主版本兼容性问题，建议升级 EDA 后再测。`,
		'环境自检',
	);
}

export function about(): void {
	eda.sys_Dialog.showInformationMessage(
		`物料管理助手 v${extensionConfig.version}\n\n已迁移为嘉立创 EDA 插件内联应用，可在插件窗口中管理类型、元器件、采购记录、项目、PCB 与 BOM。`,
		'关于物料管理助手',
	);
}
