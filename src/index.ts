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
			const iframe = (eda as any)?.sys_IFrame;
			return {
				isClient: env?.isClient?.() ?? undefined,
				isWeb: env?.isWeb?.() ?? undefined,
				isOnlineMode: env?.isOnlineMode?.() ?? undefined,
				isHalfOfflineMode: env?.isHalfOfflineMode?.() ?? undefined,
				isOfflineMode: env?.isOfflineMode?.() ?? undefined,
				editorVersion: env?.getEditorCurrentVersion?.() ?? '',
				compiledDate: env?.getEditorCompliedDate?.() ?? '',
				openIFrameDeclaredParams: typeof iframe?.openIFrame === 'function' ? iframe.openIFrame.length : undefined,
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
				openIFrameDeclaredParams: undefined as number | undefined,
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
					indexAbsSlash: undefined as boolean | undefined,
					indexAbsNoSlash: undefined as boolean | undefined,
					appJs: undefined as boolean | undefined,
					styles: undefined as boolean | undefined,
				};
			}
			const [a, b, a2, b2, js, css] = await Promise.all([
				fsApi.getExtensionFile('/iframe/index.html').catch(() => undefined),
				fsApi.getExtensionFile('iframe/index.html').catch(() => undefined),
				fsApi.getExtensionFile('/iframe/index.abs.html').catch(() => undefined),
				fsApi.getExtensionFile('iframe/index.abs.html').catch(() => undefined),
				fsApi.getExtensionFile('/iframe/app.js').catch(() => undefined),
				fsApi.getExtensionFile('/iframe/styles.css').catch(() => undefined),
			]);
			return {
				indexSlash: Boolean(a),
				indexNoSlash: Boolean(b),
				indexAbsSlash: Boolean(a2),
				indexAbsNoSlash: Boolean(b2),
				appJs: Boolean(js),
				styles: Boolean(css),
			};
		} catch {
			return {
				indexSlash: undefined as boolean | undefined,
				indexNoSlash: undefined as boolean | undefined,
				indexAbsSlash: undefined as boolean | undefined,
				indexAbsNoSlash: undefined as boolean | undefined,
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

	// Keep props minimal for compatibility (some 3.2.91 builds seem to 500 on richer props).
	const props = { title: BOM_IFRAME_TITLE };

	const openAny = async (...args: any[]): Promise<boolean> => (eda as any).sys_IFrame.openIFrame(...args);

	const width = 1600;
	const height = 980;
	const htmlCandidates = ['/iframe/index.html', 'iframe/index.html', '/iframe/index.abs.html', 'iframe/index.abs.html'];

	// Prefer patterns that include a stable id, so we can close/retry without leaving orphan windows.
	const patterns: Array<{ label: string; makeArgs: (html: string) => any[] }> = [
		{ label: '4-args id', makeArgs: (html) => [html, width, height, BOM_IFRAME_ID] },
		{ label: '5-args id+props', makeArgs: (html) => [html, width, height, BOM_IFRAME_ID, props] },
		// Fallbacks for possible older signatures:
		{ label: '4-args props', makeArgs: (html) => [html, width, height, props] },
		{ label: '3-args', makeArgs: (html) => [html, width, height] },
	];

	const attempts: Array<{ label: string; run: () => Promise<boolean> }> = [];
	for (const html of htmlCandidates) {
		for (const p of patterns) {
			attempts.push({
				label: `${p.label} ${html}`,
				run: async () => openAny(...p.makeArgs(html)),
			});
		}
	}

	const isActuallyOpened = async (): Promise<boolean> => {
		try {
			if (typeof (eda as any)?.sys_IFrame?.hideIFrame !== 'function' || typeof (eda as any)?.sys_IFrame?.showIFrame !== 'function') {
				return false;
			}
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

	const waitForIframeBootTs = async (minTs: number, msTimeout: number) => {
		const start = Date.now();
		while (Date.now() - start < msTimeout) {
			try {
				const value = (eda as any)?.sys_Storage?.getExtensionUserConfig?.('bom-manager-last-boot-ts');
				const ts = typeof value === 'number' ? value : typeof value?.ts === 'number' ? value.ts : 0;
				if (ts && ts >= minTs) {
					return true;
				}
			} catch {}
			await new Promise((r) => setTimeout(r, 200));
		}
		return false;
	};

	let lastError: unknown = null;
	for (const attempt of attempts) {
		let requestTs = 0;
		try {
			await closeIfExists();
			requestTs = Date.now();
			try {
				await (eda as any)?.sys_Storage?.setExtensionUserConfig?.('bom-manager-open-request-ts', requestTs);
			} catch {}

			const ok = await attempt.run();

			// The openIFrame() boolean is not reliable on some client versions.
			// We consider it "success" only when the iframe app actually boots.
			const ready = waitForIframeReady(6000);
			const storageBootedPromise = waitForIframeBootTs(requestTs, 6000);
			const busBooted = await ready.promise;
			const storageBooted = await storageBootedPromise;
			ready.cancel();
			const booted = busBooted || storageBooted;

			if (booted) {
				try {
					eda.sys_Log?.add?.(
						`openBomManager ok via ${attempt.label} (ok=${String(ok)} busBooted=${String(busBooted)} storageBooted=${String(storageBooted)})`,
						'info' as any,
					);
				} catch {}
				return;
			}

			// If the window was created but the app didn't boot (e.g. 404 / script load failure),
			// close it to avoid leaving a blank window before the next attempt.
			try {
				if (await isActuallyOpened()) {
					await closeIfExists();
				}
			} catch {}

			lastError = new Error(`openIFrame did not boot (${attempt.label}, ok=${String(ok)})`);
			try {
				eda.sys_Log?.add?.(
					`openBomManager failed: iframe did not boot (${attempt.label}, ok=${String(ok)} busBooted=${String(busBooted)} storageBooted=${String(storageBooted)})`,
					'warn' as any,
				);
			} catch {}
		} catch (error) {
			lastError = error;
			// If an exception is thrown, still check whether the window got created.
			try {
				// Even if openIFrame threw, still consider it success only if the iframe app booted.
				if (requestTs > 0 && (await waitForIframeBootTs(requestTs, 1200))) {
					try {
						eda.sys_Log?.add?.(`openBomManager ok via ${attempt.label} (threw but booted)`, 'warn' as any);
					} catch {}
					return;
				}
			} catch {}
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

	eda.sys_Dialog.showInformationMessage(
		`打开插件窗口失败（IFrame 应用未能完成启动）。\n\n` +
			`环境：isClient=${String(envInfo.isClient)} isWeb=${String(envInfo.isWeb)}\n` +
			`模式：online=${String(envInfo.isOnlineMode)} halfOffline=${String(envInfo.isHalfOfflineMode)} offline=${String(envInfo.isOfflineMode)}\n` +
			`版本：${envInfo.editorVersion || '未知'}\n` +
			`编译日期：${envInfo.compiledDate || '未知'}\n` +
			`openIFrame 参数个数（声明）：${String(envInfo.openIFrameDeclaredParams)}\n` +
			`扩展资源：index(rel /)=${String(fileExists.indexSlash)} index(rel no/)=${String(fileExists.indexNoSlash)} index(abs /)=${String(fileExists.indexAbsSlash)} index(abs no/)=${String(fileExists.indexAbsNoSlash)}\n` +
			`扩展资源：app.js=${String(fileExists.appJs)} styles.css=${String(fileExists.styles)}\n\n` +
			`最后错误：${lastError instanceof Error ? lastError.message : String(lastError)}\n\n` +
			`iframe lastBoot：${lastBoot ? JSON.stringify(lastBoot) : 'none'}\n` +
			`iframe lastError：${lastErrorInfo ? JSON.stringify(lastErrorInfo) : 'none'}\n\n` +
			`说明：本插件本质不需要联网。当前失败更像是 EDA 版本对 openIFrame 的限制/缺陷。\n` +
			`建议：升级到更新版本的嘉立创 EDA 专业版后重试；或将这段信息发给我继续排查。`,
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
