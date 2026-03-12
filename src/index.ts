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
			'物料管理助手',
		);
		return;
	}

	const fileExists = await (async () => {
		try {
			const fsApi = (eda as any)?.sys_FileSystem;
			if (!fsApi || typeof fsApi.getExtensionFile !== 'function') {
				return {
					indexSlash: undefined as boolean | undefined,
					indexNoSlash: undefined as boolean | undefined,
					appJs: undefined as boolean | undefined,
					styles: undefined as boolean | undefined,
				};
			}
			const [a, b, js, css] = await Promise.all([
				fsApi.getExtensionFile('/iframe/index.html').catch(() => undefined),
				fsApi.getExtensionFile('iframe/index.html').catch(() => undefined),
				fsApi.getExtensionFile('/iframe/app.js').catch(() => undefined),
				fsApi.getExtensionFile('/iframe/styles.css').catch(() => undefined),
			]);
			return { indexSlash: Boolean(a), indexNoSlash: Boolean(b), appJs: Boolean(js), styles: Boolean(css) };
		} catch {
			return {
				indexSlash: undefined as boolean | undefined,
				indexNoSlash: undefined as boolean | undefined,
				appJs: undefined as boolean | undefined,
				styles: undefined as boolean | undefined,
			};
		}
	})();

	const closeIfExists = async () => {
		try {
			if (typeof (eda as any)?.sys_IFrame?.closeIFrame === 'function') {
				await (eda as any).sys_IFrame.closeIFrame(BOM_IFRAME_ID);
			}
		} catch {}
	};

	const attempts: Array<{ label: string; run: () => Promise<boolean> }> = [
		{
			label: 'large/props',
			run: async () =>
				eda.sys_IFrame.openIFrame('/iframe/index.html', 1600, 980, BOM_IFRAME_ID, {
					maximizeButton: true,
					minimizeButton: true,
					grayscaleMask: true,
				}),
		},
		{
			label: 'large/no-props',
			run: async () => eda.sys_IFrame.openIFrame('/iframe/index.html', 1600, 980, BOM_IFRAME_ID),
		},
		{
			label: 'mid/props',
			run: async () =>
				eda.sys_IFrame.openIFrame('/iframe/index.html', 1200, 820, BOM_IFRAME_ID, {
					maximizeButton: true,
					minimizeButton: true,
					grayscaleMask: true,
				}),
		},
		{
			label: 'doc-example-500',
			run: async () => eda.sys_IFrame.openIFrame('/iframe/index.html', 500, 500, BOM_IFRAME_ID),
		},
	];

	const isActuallyOpened = async (): Promise<boolean> => {
		try {
			const hidden = await eda.sys_IFrame.hideIFrame(BOM_IFRAME_ID);
			if (!hidden) {
				return false;
			}
			await eda.sys_IFrame.showIFrame(BOM_IFRAME_ID);
			return true;
		} catch {
			return false;
		}
	};

	const waitForIframeReady = (msTimeout: number) => {
		let cancel = () => {};
		const promise = new Promise<boolean>((resolve) => {
			let settled = false;
			try {
				const bus = (eda as any)?.sys_MessageBus;
				if (!bus || typeof bus.subscribeOnce !== 'function') {
					resolve(false);
					return;
				}
				const task = bus.subscribeOnce('bom-manager-ready', () => {
					if (settled) return;
					settled = true;
					resolve(true);
				});
				cancel = () => {
					try {
						task?.cancel?.();
					} catch {}
				};
				setTimeout(() => {
					if (settled) return;
					settled = true;
					cancel();
					resolve(false);
				}, msTimeout);
			} catch {
				resolve(false);
			}
		});
		return { promise, cancel };
	};

	let lastError: unknown = null;
	for (const attempt of attempts) {
		try {
			await closeIfExists();
			const ready = waitForIframeReady(2500);
			const ok = await attempt.run();
			const opened = ok || (ok === false && (await isActuallyOpened()));
			const booted = opened ? true : await ready.promise;
			ready.cancel();

			if (opened || booted) {
				try {
					eda.sys_Log?.add?.(
						`openBomManager ok via ${attempt.label} (ok=${String(ok)} opened=${String(opened)} booted=${String(booted)})`,
						'info' as any,
					);
				} catch {}
				return;
			}
			lastError = new Error(`openIFrame returned false (${attempt.label})`);
			try {
				eda.sys_Log?.add?.(`openBomManager failed: openIFrame returned false (${attempt.label})`, 'warn' as any);
			} catch {}
		} catch (error) {
			lastError = error;
			// If an exception is thrown, still check whether the window got created.
			if (await isActuallyOpened()) {
				try {
					eda.sys_Log?.add?.(`openBomManager ok via ${attempt.label} (threw but opened)`, 'warn' as any);
				} catch {}
				return;
			}
			try {
				eda.sys_Log?.add?.(
					`openBomManager failed (${attempt.label}): ${
						error instanceof Error ? `${error.name}: ${error.message}` : String(error)
					}`,
					'error' as any,
				);
			} catch {}
		}
	}

	eda.sys_Dialog.showInformationMessage(
		`打开插件窗口失败（openIFrame 始终返回 false）。\n\n` +
			`环境：isClient=${String(envInfo.isClient)} isWeb=${String(envInfo.isWeb)}\n` +
			`模式：online=${String(envInfo.isOnlineMode)} halfOffline=${String(envInfo.isHalfOfflineMode)} offline=${String(envInfo.isOfflineMode)}\n` +
			`版本：${envInfo.editorVersion || '未知'}\n` +
			`编译日期：${envInfo.compiledDate || '未知'}\n` +
			`扩展资源：index(/)=${String(fileExists.indexSlash)} index(no/)=${String(fileExists.indexNoSlash)}\n\n` +
			`最后错误：${lastError instanceof Error ? lastError.message : String(lastError)}\n\n` +
			`说明：本插件本质不需要联网。当前失败更像是 EDA 版本对 openIFrame 的限制/缺陷。\n` +
			`建议：升级到更新版本的嘉立创 EDA 专业版后重试；或将这段信息发给我继续排查。`,
		'物料管理助手',
	);
}

export function about(): void {
	eda.sys_Dialog.showInformationMessage(
		`物料管理助手 v${extensionConfig.version}\n\n已迁移为嘉立创 EDA 插件内联应用，可在插件窗口中管理类型、元器件、采购记录、项目、PCB 与 BOM。`,
		'关于物料管理助手',
	);
}
