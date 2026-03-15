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

const DESIGN_PULSE_IFRAME_ID = 'design-pulse-main';
const DESIGN_PULSE_IFRAME_TITLE = '工程脉搏';
const DESIGN_PULSE_IFRAME_STATE_KEY = 'design-pulse-window-state';
const LEGACY_IFRAME_STATE_KEY = 'bom-manager-window-state';
const DESIGN_PULSE_IFRAME_SIZE_HINT_KEY = 'design-pulse-window-size-hint';
const LEGACY_IFRAME_SIZE_HINT_KEY = 'bom-manager-window-size-hint';
const DESIGN_PULSE_IFRAME_DEFAULT_SIZE = { width: 1920, height: 1200 };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function activate(status?: 'onStartupFinished', arg?: string): void {}

function normalizeWindowState(value: unknown): 'normal' | 'maximized' | 'minimized' | 'closed' {
	return value === 'normal' || value === 'maximized' || value === 'minimized' || value === 'closed' ? value : 'closed';
}

function normalizeWindowSize(input: unknown): { width: number; height: number } {
	const raw = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
	const width = Number(raw.width);
	const height = Number(raw.height);
	return {
		width: Number.isFinite(width) && width >= 1200 ? Math.round(width) : DESIGN_PULSE_IFRAME_DEFAULT_SIZE.width,
		height: Number.isFinite(height) && height >= 760 ? Math.round(height) : DESIGN_PULSE_IFRAME_DEFAULT_SIZE.height,
	};
}

function getRuntimeWindowSizeHint(): { width: number; height: number } | null {
	try {
		const runtimeScreen = (globalThis as any)?.screen;
		const screenWidth = Number(runtimeScreen?.availWidth || runtimeScreen?.width || 0);
		const screenHeight = Number(runtimeScreen?.availHeight || runtimeScreen?.height || 0);
		if (!Number.isFinite(screenWidth) || !Number.isFinite(screenHeight) || screenWidth <= 0 || screenHeight <= 0) return null;
		return {
			width: Math.max(1280, Math.round(screenWidth - 72)),
			height: Math.max(760, Math.round(screenHeight - 120)),
		};
	} catch {
		return null;
	}
}

function readConfig(storageApi: any, primaryKey: string, legacyKey?: string): unknown {
	try {
		const primary = storageApi?.getExtensionUserConfig?.(primaryKey);
		if (typeof primary !== 'undefined' && primary !== null) return primary;
		if (legacyKey) return storageApi?.getExtensionUserConfig?.(legacyKey);
		return undefined;
	} catch {
		return undefined;
	}
}

function getPreferredWindowSize(storageApi: any): { width: number; height: number } {
	const runtimeHint = getRuntimeWindowSizeHint();
	if (runtimeHint) return runtimeHint;
	try {
		return normalizeWindowSize(readConfig(storageApi, DESIGN_PULSE_IFRAME_SIZE_HINT_KEY, LEGACY_IFRAME_SIZE_HINT_KEY));
	} catch {
		return DESIGN_PULSE_IFRAME_DEFAULT_SIZE;
	}
}

async function writeWindowState(storageApi: any, state: 'normal' | 'maximized' | 'minimized' | 'closed'): Promise<void> {
	try {
		await storageApi?.setExtensionUserConfig?.(DESIGN_PULSE_IFRAME_STATE_KEY, state);
		await storageApi?.setExtensionUserConfig?.(LEGACY_IFRAME_STATE_KEY, state);
	} catch {}
}

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
	const storageApi = (eda as any)?.sys_Storage;
	if (!iframeApi || typeof iframeApi.openIFrame !== 'function') {
		eda.sys_Dialog.showInformationMessage(
			`当前 EDA 版本可能不支持 IFrame 插件窗口，无法打开。\n\n` +
				`环境：isClient=${String(envInfo.isClient)} isWeb=${String(envInfo.isWeb)}\n` +
				`版本：${envInfo.editorVersion || '未知'}\n` +
				`编译日期：${envInfo.compiledDate || '未知'}\n\n` +
				`请升级嘉立创 EDA 专业版后重试。`,
			DESIGN_PULSE_IFRAME_TITLE,
		);
		return;
	}

	// Your client (3.2.91) can open the compat page reliably, while the default page may fail to render.
	// So we only open the compat page by default to avoid duplicate windows and blank renders.
	const requestTs = Date.now();
	const windowState = normalizeWindowState(readConfig(storageApi, DESIGN_PULSE_IFRAME_STATE_KEY, LEGACY_IFRAME_STATE_KEY));
	const preferredSize = getPreferredWindowSize(storageApi);
	try {
		await storageApi?.setExtensionUserConfig?.('design-pulse-open-request-ts', requestTs);
	} catch {}

	try {
		if (windowState !== 'minimized' && typeof iframeApi.showIFrame === 'function') {
			const restored = await iframeApi.showIFrame(DESIGN_PULSE_IFRAME_ID);
			if (restored) return;
		}
	} catch {}

	try {
		if (typeof iframeApi.closeIFrame === 'function') {
			await iframeApi.closeIFrame(DESIGN_PULSE_IFRAME_ID).catch(() => false);
		}

		// NOTE: some builds return false even when the window opens. We don't treat false as failure.
		void iframeApi.openIFrame('/iframe/index.abs.html', preferredSize.width, preferredSize.height, DESIGN_PULSE_IFRAME_ID, {
			maximizeButton: true,
			minimizeButton: true,
			buttonCallbackFn: (button) => {
				const nextState = button === 'minimize' ? 'minimized' : button === 'maximize' ? 'maximized' : 'closed';
				void writeWindowState(storageApi, nextState);
			},
		});
		void writeWindowState(storageApi, 'normal');
	} catch (error) {
		try {
			void iframeApi.openIFrame('/iframe/index.abs.html', preferredSize.width, preferredSize.height);
			void writeWindowState(storageApi, 'normal');
		} catch (fallbackError) {
			void writeWindowState(storageApi, 'closed');
			const finalError = fallbackError instanceof Error ? fallbackError : error;
			eda.sys_Dialog.showInformationMessage(
				`打开插件窗口失败。\n\n` +
					`环境：isClient=${String(envInfo.isClient)} isWeb=${String(envInfo.isWeb)}\n` +
					`模式：online=${String(envInfo.isOnlineMode)} halfOffline=${String(envInfo.isHalfOfflineMode)} offline=${String(envInfo.isOfflineMode)}\n` +
					`版本：${envInfo.editorVersion || '未知'}\n` +
					`编译日期：${envInfo.compiledDate || '未知'}\n\n` +
					`错误：${finalError instanceof Error ? `${finalError.name}: ${finalError.message}` : String(finalError)}\n\n` +
					`建议：请先使用“环境自检”确认资源可读；若仍失败，建议升级 EDA 后重试。`,
				DESIGN_PULSE_IFRAME_TITLE,
			);
		}
	}

	// Return immediately so opening stays fast.
	return;
}

export async function openDesignPulse(): Promise<void> {
	return openBomManager();
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
		const projectApi = (eda as any)?.dmt_Project;
		const pcbTreeApi = (eda as any)?.dmt_Pcb;
		const boardApi = (eda as any)?.dmt_Board;
		const editorControlApi = (eda as any)?.dmt_EditorControl;
		const selectControlApi = (eda as any)?.dmt_SelectControl;
		const teamApi = (eda as any)?.dmt_Team;
		const workspaceApi = (eda as any)?.dmt_Workspace;
		const pcbManufactureApi = (eda as any)?.pcb_ManufactureData;
		const schManufactureApi = (eda as any)?.sch_ManufactureData;
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
			dmt_Project: has(projectApi),
			getCurrentProjectInfo: has(projectApi && typeof projectApi.getCurrentProjectInfo === 'function'),
			dmt_Pcb: has(pcbTreeApi),
			getCurrentPcbInfo: has(pcbTreeApi && typeof pcbTreeApi.getCurrentPcbInfo === 'function'),
			getAllPcbsInfo: has(pcbTreeApi && typeof pcbTreeApi.getAllPcbsInfo === 'function'),
			dmt_Board: has(boardApi),
			getCurrentBoardInfo: has(boardApi && typeof boardApi.getCurrentBoardInfo === 'function'),
			getAllBoardsInfo: has(boardApi && typeof boardApi.getAllBoardsInfo === 'function'),
			dmt_EditorControl: has(editorControlApi),
			openDocument: has(editorControlApi && typeof editorControlApi.openDocument === 'function'),
			activateDocument: has(editorControlApi && typeof editorControlApi.activateDocument === 'function'),
			closeDocument: has(editorControlApi && typeof editorControlApi.closeDocument === 'function'),
			getSplitScreenTree: has(editorControlApi && typeof editorControlApi.getSplitScreenTree === 'function'),
			getCurrentRenderedAreaImage: has(editorControlApi && typeof editorControlApi.getCurrentRenderedAreaImage === 'function'),
			zoomToAllPrimitives: has(editorControlApi && typeof editorControlApi.zoomToAllPrimitives === 'function'),
			zoomToSelectedPrimitives: has(editorControlApi && typeof editorControlApi.zoomToSelectedPrimitives === 'function'),
			generateIndicatorMarkers: has(editorControlApi && typeof editorControlApi.generateIndicatorMarkers === 'function'),
			removeIndicatorMarkers: has(editorControlApi && typeof editorControlApi.removeIndicatorMarkers === 'function'),
			dmt_SelectControl: has(selectControlApi),
			getCurrentDocumentInfo: has(selectControlApi && typeof selectControlApi.getCurrentDocumentInfo === 'function'),
			dmt_Team: has(teamApi),
			getCurrentTeamInfo: has(teamApi && typeof teamApi.getCurrentTeamInfo === 'function'),
			dmt_Workspace: has(workspaceApi),
			getCurrentWorkspaceInfo: has(workspaceApi && typeof workspaceApi.getCurrentWorkspaceInfo === 'function'),
			pcb_ManufactureData: has(pcbManufactureApi),
			pcbGetBomFile: has(pcbManufactureApi && typeof pcbManufactureApi.getBomFile === 'function'),
			pcbGetGerberFile: has(pcbManufactureApi && typeof pcbManufactureApi.getGerberFile === 'function'),
			pcbGetPickAndPlaceFile: has(pcbManufactureApi && typeof pcbManufactureApi.getPickAndPlaceFile === 'function'),
			pcbGet3DFile: has(pcbManufactureApi && typeof pcbManufactureApi.get3DFile === 'function'),
			pcbGetTestPointFile: has(pcbManufactureApi && typeof pcbManufactureApi.getTestPointFile === 'function'),
			pcbGetNetlistFile: has(pcbManufactureApi && typeof pcbManufactureApi.getNetlistFile === 'function'),
			sch_ManufactureData: has(schManufactureApi),
			schGetBomFile: has(schManufactureApi && typeof schManufactureApi.getBomFile === 'function'),
			schGetNetlistFile: has(schManufactureApi && typeof schManufactureApi.getNetlistFile === 'function'),
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
			return readConfig((eda as any)?.sys_Storage, 'design-pulse-last-boot', 'bom-manager-last-boot');
		} catch {
			return undefined;
		}
	})();
	const lastErrorInfo = (() => {
		try {
			return readConfig((eda as any)?.sys_Storage, 'design-pulse-last-error', 'bom-manager-last-error');
		} catch {
			return undefined;
		}
	})();

	const lines: string[] = [];
	lines.push(`[工程脉搏 SelfCheck] v${extensionConfig.version}`);
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
		`${report}\n\n说明：\n- resources=missing 通常表示打包时未包含该文件（或路径解析不兼容）。\n- 若 getCurrentRenderedAreaImage / zoomToSelectedPrimitives / generateIndicatorMarkers 缺失，则画布截图与框选能力会受限。\n- 若 pcbGetGerberFile / pcbGetPickAndPlaceFile / pcbGet3DFile 缺失，则制造导出中心会按可用接口降级。\n- 若 openIFrame=yes 但仍无法渲染，多数是宿主版本兼容性问题，建议升级 EDA 后再测。`,
		'环境自检',
	);
}

export function about(): void {
	eda.sys_Dialog.showInformationMessage(
		`工程脉搏 v${extensionConfig.version}\n\n面向嘉立创 EDA 的工程快照、制造导出、画布快照与 BOM 协作助手。\n\n核心能力：\n- 当前工程/文档/团队/工作区快照\n- BOM / Gerber / Pick&Place / 3D / Netlist / Test Point 导出\n- 画布适应、框选与截图历史留档`,
		'关于工程脉搏',
	);
}
