// Iframe app (TypeScript)
// Compiled to iframe/app.js by config/esbuild.iframe.ts

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

/* eslint-disable */
(function () {
	const app = document.getElementById('app');
	const edaApi = window.eda || (window.parent && window.parent.eda) || (window.top && window.top.eda);
	const DB_KEY = 'design-pulse-db';
	const LEGACY_DB_KEY = 'bom-manager-db';
	const PREFS_KEY = 'design-pulse-prefs';
	const LEGACY_PREFS_KEY = 'bom-manager-prefs';
	const REPORT_HISTORY_KEY = 'design-pulse-report-history';
	const EXPORT_PREFS_KEY = 'design-pulse-export-prefs';
	const WINDOW_STATE_KEY = 'design-pulse-window-state';
	const LEGACY_WINDOW_STATE_KEY = 'bom-manager-window-state';
	const WINDOW_SIZE_HINT_KEY = 'design-pulse-window-size-hint';
	const LEGACY_WINDOW_SIZE_HINT_KEY = 'bom-manager-window-size-hint';
	const LAST_ERROR_KEY = 'design-pulse-last-error';
	const LEGACY_LAST_ERROR_KEY = 'bom-manager-last-error';
	const LAST_BOOT_KEY = 'design-pulse-last-boot';
	const LEGACY_LAST_BOOT_KEY = 'bom-manager-last-boot';
	const LAST_BOOT_TS_KEY = 'design-pulse-last-boot-ts';
	const LEGACY_LAST_BOOT_TS_KEY = 'bom-manager-last-boot-ts';

	if (!app) return;
	if (!edaApi) {
		app.innerHTML = '<div class="fatal-state">未检测到嘉立创插件运行环境（IFrame 内未注入 eda API）。</div>';
		return;
	}

	let persistWindowHintTimer = 0;

	function currentWindowSizeHint() {
		const screenWidth = Number(window?.screen?.availWidth || window?.screen?.width || window.innerWidth || 0);
		const screenHeight = Number(window?.screen?.availHeight || window?.screen?.height || window.innerHeight || 0);
		return {
			width: Math.max(1280, Math.round(screenWidth - 72)),
			height: Math.max(760, Math.round(screenHeight - 120)),
			viewportWidth: Math.max(0, Math.round(window.innerWidth || 0)),
			viewportHeight: Math.max(0, Math.round(window.innerHeight || 0)),
			measuredAt: new Date().toISOString(),
		};
	}

	function persistWindowSizeHint() {
		try {
			if (edaApi.sys_Storage && typeof edaApi.sys_Storage.setExtensionUserConfig === 'function') {
				const hint = currentWindowSizeHint();
				void edaApi.sys_Storage.setExtensionUserConfig(WINDOW_SIZE_HINT_KEY, hint);
				void edaApi.sys_Storage.setExtensionUserConfig(LEGACY_WINDOW_SIZE_HINT_KEY, hint);
			}
		} catch (_e) {}
	}

	try {
		const now = Date.now();

		// Capture runtime errors for offline debugging. These are written into extension user config,
		// so the entry script can show them when openIFrame fails/blank.
			const writeLastError = (payload) => {
			try {
				if (edaApi.sys_Storage && typeof edaApi.sys_Storage.setExtensionUserConfig === 'function') {
					void edaApi.sys_Storage.setExtensionUserConfig(LAST_ERROR_KEY, payload);
					void edaApi.sys_Storage.setExtensionUserConfig(LEGACY_LAST_ERROR_KEY, payload);
				}
			} catch (_e) {}
		};

		window.addEventListener('error', (event) => {
			try {
				const err = event && event.error instanceof Error ? event.error : null;
				writeLastError({
					ts: Date.now(),
					type: 'error',
					message: String(event?.message || err?.message || 'unknown'),
					filename: String(event?.filename || ''),
					lineno: Number(event?.lineno || 0),
					colno: Number(event?.colno || 0),
					stack: err?.stack ? String(err.stack) : '',
				});
			} catch (_e) {}
		});

		window.addEventListener('unhandledrejection', (event) => {
			try {
				const reason = event && event.reason ? event.reason : null;
				const msg =
					reason instanceof Error
						? `${reason.name}: ${reason.message}`
						: typeof reason === 'string'
							? reason
							: reason
								? (() => {
										try {
											return JSON.stringify(reason);
										} catch (_e) {
											return String(reason);
										}
									})()
								: 'unknown';
				writeLastError({
					ts: Date.now(),
					type: 'unhandledrejection',
					message: msg,
					stack: reason instanceof Error && reason.stack ? String(reason.stack) : '',
				});
			} catch (_e) {}
		});

		// Notify the extension entry that the iframe app has booted.
		// Storage is more reliable than MessageBus across some client builds.
		if (edaApi.sys_Storage && typeof edaApi.sys_Storage.setExtensionUserConfig === 'function') {
			const bootInfo = {
				ts: now,
				href: String(location?.href || ''),
				baseURI: String(document?.baseURI || ''),
				userAgent: String(navigator?.userAgent || ''),
				viewportWidth: Math.max(0, Math.round(window.innerWidth || 0)),
				viewportHeight: Math.max(0, Math.round(window.innerHeight || 0)),
			};
			void edaApi.sys_Storage.setExtensionUserConfig(LAST_BOOT_TS_KEY, now);
			void edaApi.sys_Storage.setExtensionUserConfig(LEGACY_LAST_BOOT_TS_KEY, now);
			void edaApi.sys_Storage.setExtensionUserConfig(LAST_BOOT_KEY, bootInfo);
			void edaApi.sys_Storage.setExtensionUserConfig(LEGACY_LAST_BOOT_KEY, bootInfo);
			void edaApi.sys_Storage.setExtensionUserConfig(WINDOW_STATE_KEY, 'normal');
			void edaApi.sys_Storage.setExtensionUserConfig(LEGACY_WINDOW_STATE_KEY, 'normal');
			persistWindowSizeHint();
		}

		if (edaApi.sys_MessageBus && typeof edaApi.sys_MessageBus.publish === 'function') {
			edaApi.sys_MessageBus.publish('design-pulse-ready', { ts: now });
		}

		// Also log boot info when possible (helps when users only have log panel).
		try {
			edaApi.sys_Log?.add?.(
				`[design-pulse iframe] boot ok ts=${now} baseURI=${String(document?.baseURI || '')}`,
				'info',
			);
		} catch (_e) {}
	} catch (_error) {}

	window.addEventListener('resize', () => {
		if (persistWindowHintTimer) window.clearTimeout(persistWindowHintTimer);
		persistWindowHintTimer = window.setTimeout(() => {
			persistWindowSizeHint();
		}, 180);
	});

	window.addEventListener('pagehide', () => {
		try {
			if (edaApi.sys_Storage && typeof edaApi.sys_Storage.setExtensionUserConfig === 'function') {
				void edaApi.sys_Storage.setExtensionUserConfig(WINDOW_STATE_KEY, 'closed');
				void edaApi.sys_Storage.setExtensionUserConfig(LEGACY_WINDOW_STATE_KEY, 'closed');
			}
		} catch (_e) {}
	});

	const state = {
		view: 'dashboard',
		status: '',
		statusKind: 'info',
		prefs: loadPrefs(),
		exportPrefs: loadExportPrefs(),
		db: loadDb(),
		reportHistory: loadReportHistory(),
		componentFilter: { keyword: '', typeId: 'all', warningOnly: false },
		projectFilter: 'all',
		purchase: {
			scope: 'project', // 'project' | 'pcb'
			projectId: 'all',
			pcbId: 'all',
			shortageOnly: true,
		},
		editingTypeId: null,
		editingComponentId: null,
		editingProjectId: null,
		editingPcbId: null,
		editingStoreId: null,
		modal: null,
		edaSnapshot: null,
		edaSnapshotLoading: false,
	};

	function id() {
		return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}
	function iso() {
		return new Date().toISOString();
	}
	function loadUserConfig(primaryKey, legacyKey, fallbackValue) {
		try {
			const primary = edaApi.sys_Storage.getExtensionUserConfig(primaryKey);
			if (typeof primary !== 'undefined' && primary !== null) return primary;
			if (legacyKey) {
				const legacy = edaApi.sys_Storage.getExtensionUserConfig(legacyKey);
				if (typeof legacy !== 'undefined' && legacy !== null) return legacy;
			}
		} catch (_error) {}
		return fallbackValue;
	}
	function t(zh, en) {
		return state.prefs.lang === 'en' ? en : zh;
	}
	function locale() {
		return state.prefs.lang === 'en' ? 'en-US' : 'zh-CN';
	}
	function e(value) {
		return String(value ?? '')
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#39;');
	}
	function time(value) {
		return value ? new Date(value).toLocaleString(locale(), { hour12: false }) : '-';
	}
	function sort(list, getter) {
		return [...list].sort((a, b) => getter(a).localeCompare(getter(b), locale()));
	}
	function setStatus(kind, message) {
		state.statusKind = kind;
		state.status = message;
		try {
			edaApi.sys_Message.showToastMessage(message, kind === 'error' ? 'error' : 'success', 3);
		} catch (_error) {}
	}

	function defaultDb() {
		const now = iso();
		return {
			types: [
				{ id: id(), name: '电阻', primaryName: '电阻', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '电容', primaryName: '电容', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '电感', primaryName: '电感', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '磁珠', primaryName: '磁珠', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '晶振', primaryName: '晶振', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '电位器', primaryName: '电位器', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '滤波器', primaryName: '滤波器', secondaryName: '', createdAt: now, updatedAt: now },

				{ id: id(), name: '二极管', primaryName: '二极管', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '稳压二极管', primaryName: '稳压二极管', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '三极管', primaryName: '三极管', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: 'MOSFET', primaryName: 'MOSFET', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '整流桥', primaryName: '整流桥', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '光耦', primaryName: '光耦', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: 'LED', primaryName: 'LED', secondaryName: '', createdAt: now, updatedAt: now },

				{ id: id(), name: 'MCU', primaryName: 'MCU', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '逻辑IC', primaryName: '逻辑IC', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '存储器', primaryName: '存储器', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '运放', primaryName: '运放', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '比较器', primaryName: '比较器', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: 'ADC-DAC', primaryName: 'ADC-DAC', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '接口转换', primaryName: '接口转换', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '驱动器', primaryName: '驱动器', secondaryName: '', createdAt: now, updatedAt: now },

				{ id: id(), name: 'PMIC', primaryName: 'PMIC', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: 'LDO', primaryName: 'LDO', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: 'DC-DC', primaryName: 'DC-DC', secondaryName: '', createdAt: now, updatedAt: now },

				{ id: id(), name: 'TVS-ESD', primaryName: 'TVS-ESD', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '保险丝', primaryName: '保险丝', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '自恢复保险丝', primaryName: '自恢复保险丝', secondaryName: '', createdAt: now, updatedAt: now },

				{ id: id(), name: '排针排母', primaryName: '排针排母', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '端子台', primaryName: '端子台', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: 'USB', primaryName: 'USB', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: 'Type-C', primaryName: 'Type-C', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: 'FFC-FPC', primaryName: 'FFC-FPC', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '射频(SMA)', primaryName: '射频(SMA)', secondaryName: '', createdAt: now, updatedAt: now },

				{ id: id(), name: '按键', primaryName: '按键', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '拨码', primaryName: '拨码', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '旋转编码器', primaryName: '旋转编码器', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '继电器', primaryName: '继电器', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '蜂鸣器', primaryName: '蜂鸣器', secondaryName: '', createdAt: now, updatedAt: now },

				{ id: id(), name: '温度传感器', primaryName: '温度传感器', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '加速度-陀螺仪', primaryName: '加速度-陀螺仪', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: '光学传感器', primaryName: '光学传感器', secondaryName: '', createdAt: now, updatedAt: now },

				{ id: id(), name: '无线模块(WiFi-BT)', primaryName: '无线模块(WiFi-BT)', secondaryName: '', createdAt: now, updatedAt: now },
				{ id: id(), name: 'GNSS', primaryName: 'GNSS', secondaryName: '', createdAt: now, updatedAt: now },
			],
			components: [],
			projects: [],
			pcbs: [],
			stores: [],
		};
	}

	function emptyDb() {
		return { types: [], components: [], projects: [], pcbs: [], stores: [] };
	}
	function nType(input) {
		const primary = String(input.primaryName || input.name || '').split('/')[0].trim();
		const secondary = String(input.secondaryName || String(input.name || '').split('/')[1] || '').trim();
		return { id: input.id || id(), name: secondary ? `${primary}/${secondary}` : primary, primaryName: primary, secondaryName: secondary, createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
	}
	function nRecord(input) {
		return { id: input.id || id(), storeId: input.storeId ? String(input.storeId).trim() : undefined, platform: String(input.platform || '').trim(), link: String(input.link || '').trim(), quantity: Number(input.quantity || 0), pricePerUnit: Number(input.pricePerUnit || 0), purchasedAt: input.purchasedAt || iso(), createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
	}
	function nComponent(input) {
		const records = (input.records || []).map(nRecord);
		const totalQuantity = records.reduce((sum, item) => sum + item.quantity, 0);
		const lowestPrice = records.length ? records.reduce((min, item) => Math.min(min, item.pricePerUnit), records[0].pricePerUnit) : null;
		return { id: input.id || id(), typeId: input.typeId || '', model: String(input.model || '').trim(), auxInfo: String(input.auxInfo || '').trim(), note: String(input.note || '').trim(), warningThreshold: Number(input.warningThreshold || 0), records, totalQuantity, lowestPrice, createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
	}
	function nProject(input) {
		return {
			id: input.id || id(),
			name: String(input.name || '').trim(),
			note: String(input.note || '').trim(),
			sourceKind: input.sourceKind ? String(input.sourceKind).trim() : undefined,
			sourceProjectUuid: input.sourceProjectUuid ? String(input.sourceProjectUuid).trim() : undefined,
			sourceProjectName: input.sourceProjectName ? String(input.sourceProjectName).trim() : undefined,
			sourceProjectFriendlyName: input.sourceProjectFriendlyName ? String(input.sourceProjectFriendlyName).trim() : undefined,
			sourceImportedAt: input.sourceImportedAt ? String(input.sourceImportedAt).trim() : undefined,
			createdAt: input.createdAt || iso(),
			updatedAt: input.updatedAt || iso(),
		};
	}
	function nBomItem(input) {
		return { id: input.id || id(), componentId: input.componentId || '', quantityPerBoard: Number(input.quantityPerBoard || 0), createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
	}
	function nPcb(input) {
		return {
			id: input.id || id(),
			projectId: input.projectId || '',
			name: String(input.name || '').trim(),
			version: String(input.version || '').trim(),
			boardQuantity: Number(input.boardQuantity || 1),
			note: String(input.note || '').trim(),
			sourceKind: input.sourceKind ? String(input.sourceKind).trim() : undefined,
			sourceProjectUuid: input.sourceProjectUuid ? String(input.sourceProjectUuid).trim() : undefined,
			sourcePcbUuid: input.sourcePcbUuid ? String(input.sourcePcbUuid).trim() : undefined,
			sourcePcbName: input.sourcePcbName ? String(input.sourcePcbName).trim() : undefined,
			sourceBoardName: input.sourceBoardName ? String(input.sourceBoardName).trim() : undefined,
			sourceImportedAt: input.sourceImportedAt ? String(input.sourceImportedAt).trim() : undefined,
			items: (input.items || []).map(nBomItem),
			createdAt: input.createdAt || iso(),
			updatedAt: input.updatedAt || iso(),
		};
	}
	function nStore(input) {
		return { id: input.id || id(), platform: String(input.platform || '').trim(), shopName: String(input.shopName || '').trim(), qualityScore: Number(input.qualityScore || 0), shippingFee: Number(input.shippingFee || 0), priceScore: Number(input.priceScore || 0), referencePrice: Number(input.referencePrice || 0), mainProducts: String(input.mainProducts || '').trim(), note: String(input.note || '').trim(), createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
	}
	function nDb(input) {
		const db = input && typeof input === 'object' ? input : defaultDb();
		return { types: (db.types || []).map(nType), components: (db.components || []).map(nComponent), projects: (db.projects || []).map(nProject), pcbs: (db.pcbs || []).map(nPcb), stores: (db.stores || []).map(nStore) };
	}

	function defaultFeatureFlags() {
		return {
			showEdaSnapshot: true,
			enableCurrentPcbImport: true,
			enableProjectBatchImport: true,
			enableOpenSourcePcb: true,
			enablePurchaseView: true,
			enableStoresView: true,
			enableReportsView: true,
			enableExportHub: true,
			enableCanvasTools: true,
			autoLoadEdaSnapshot: false,
		};
	}
	function defaultExportPrefs() {
		return {
			bomFileType: 'xlsx',
			pickPlaceFileType: 'xlsx',
			modelFileType: 'step',
			modelMode: 'Outfit',
			gerberColorSilkscreen: false,
			autoGenerateModels: true,
			reportHistoryLimit: 8,
		};
	}
	function normalizePrefs(input) {
		const raw = input && typeof input === 'object' ? input : {};
		const rawFeatures = raw.features && typeof raw.features === 'object' ? raw.features : {};
		const defaults = defaultFeatureFlags();
		const features = {};
		for (const [key, defaultValue] of Object.entries(defaults)) {
			features[key] = typeof rawFeatures[key] === 'boolean' ? rawFeatures[key] : defaultValue;
		}
		return {
			lang: raw?.lang === 'en' ? 'en' : 'zh',
			theme: raw?.theme === 'dark' ? 'dark' : 'light',
			features,
		};
	}
	function normalizeExportPrefs(input) {
		const raw = input && typeof input === 'object' ? input : {};
		const defaults = defaultExportPrefs();
		return {
			bomFileType: raw?.bomFileType === 'csv' ? 'csv' : defaults.bomFileType,
			pickPlaceFileType: raw?.pickPlaceFileType === 'csv' ? 'csv' : defaults.pickPlaceFileType,
			modelFileType: raw?.modelFileType === 'obj' ? 'obj' : defaults.modelFileType,
			modelMode: raw?.modelMode === 'Parts' ? 'Parts' : defaults.modelMode,
			gerberColorSilkscreen: typeof raw?.gerberColorSilkscreen === 'boolean' ? raw.gerberColorSilkscreen : defaults.gerberColorSilkscreen,
			autoGenerateModels: typeof raw?.autoGenerateModels === 'boolean' ? raw.autoGenerateModels : defaults.autoGenerateModels,
			reportHistoryLimit: Number.isFinite(Number(raw?.reportHistoryLimit)) ? Math.max(3, Math.min(20, Number(raw.reportHistoryLimit))) : defaults.reportHistoryLimit,
		};
	}
	function normalizeReportHistory(input) {
		return Array.isArray(input) ? input.filter((item) => item && typeof item === 'object') : [];
	}

	function loadPrefs() {
		try {
			return normalizePrefs(loadUserConfig(PREFS_KEY, LEGACY_PREFS_KEY));
		} catch (_error) {
			return normalizePrefs();
		}
	}
	function loadExportPrefs() {
		try {
			return normalizeExportPrefs(loadUserConfig(EXPORT_PREFS_KEY, null));
		} catch (_error) {
			return normalizeExportPrefs();
		}
	}
	function loadDb() {
		try {
			return nDb(loadUserConfig(DB_KEY, LEGACY_DB_KEY, defaultDb()) || defaultDb());
		} catch (_error) {
			return defaultDb();
		}
	}
	function loadReportHistory() {
		try {
			return normalizeReportHistory(loadUserConfig(REPORT_HISTORY_KEY, null, []));
		} catch (_error) {
			return [];
		}
	}
	async function savePrefs() {
		await edaApi.sys_Storage.setExtensionUserConfig(PREFS_KEY, state.prefs);
	}
	async function saveExportPrefs() {
		state.exportPrefs = normalizeExportPrefs(state.exportPrefs);
		await edaApi.sys_Storage.setExtensionUserConfig(EXPORT_PREFS_KEY, state.exportPrefs);
	}
	async function saveDb() {
		state.db = nDb(state.db);
		await edaApi.sys_Storage.setExtensionUserConfig(DB_KEY, state.db);
	}
	async function saveReportHistory() {
		const limit = Number(state.exportPrefs?.reportHistoryLimit || defaultExportPrefs().reportHistoryLimit);
		state.reportHistory = normalizeReportHistory(state.reportHistory).slice(0, limit);
		await edaApi.sys_Storage.setExtensionUserConfig(REPORT_HISTORY_KEY, state.reportHistory);
	}
	async function pushReport(entry) {
		state.reportHistory = [
			{
				id: entry.id || id(),
				createdAt: entry.createdAt || iso(),
				...entry,
			},
			...normalizeReportHistory(state.reportHistory),
		].slice(0, Number(state.exportPrefs?.reportHistoryLimit || defaultExportPrefs().reportHistoryLimit));
		await saveReportHistory();
	}

	function projectDisplayNameFromSnapshot(snapshot) {
		return String(snapshot?.projectFriendlyName || snapshot?.projectName || '').trim();
	}
	function pcbDisplayNameFromSnapshot(snapshot) {
		return String(snapshot?.pcbName || snapshot?.boardName || snapshot?.parentBoardName || '').trim();
	}
	function boardDisplayNameFromSnapshot(snapshot) {
		return String(snapshot?.boardName || snapshot?.parentBoardName || '').trim();
	}
	async function readCurrentEdaSnapshot() {
		const projectApi = edaApi?.dmt_Project;
		const pcbApi = edaApi?.dmt_Pcb;
		const boardApi = edaApi?.dmt_Board;
		const selectApi = edaApi?.dmt_SelectControl;
		const teamApi = edaApi?.dmt_Team;
		const workspaceApi = edaApi?.dmt_Workspace;
		const call = async (owner, method) => {
			if (!owner || typeof owner[method] !== 'function') return undefined;
			try {
				return await owner[method]();
			} catch (_error) {
				return undefined;
			}
		};
		const [project, pcb, board, documentInfo, teamInfo, workspaceInfo] = await Promise.all([
			call(projectApi, 'getCurrentProjectInfo'),
			call(pcbApi, 'getCurrentPcbInfo'),
			call(boardApi, 'getCurrentBoardInfo'),
			call(selectApi, 'getCurrentDocumentInfo'),
			call(teamApi, 'getCurrentTeamInfo'),
			call(workspaceApi, 'getCurrentWorkspaceInfo'),
		]);
		if (!project && !pcb && !board && !documentInfo) {
			throw new Error(
				t(
					'未读取到当前工程上下文。请先切换到已打开的原理图或 PCB 画布后重试；若仍失败，请在“环境自检”中确认 dmt_Project / dmt_Pcb / dmt_Board / dmt_SelectControl 可用。',
					'Cannot read the current design context. Focus an opened schematic or PCB canvas and retry. If it still fails, verify dmt_Project / dmt_Pcb / dmt_Board / dmt_SelectControl in SelfCheck.',
				),
			);
		}
		return {
			fetchedAt: iso(),
			projectUuid: String(project?.uuid || pcb?.parentProjectUuid || board?.parentProjectUuid || '').trim(),
			projectFriendlyName: String(project?.friendlyName || '').trim(),
			projectName: String(project?.name || '').trim(),
			projectDescription: String(project?.description || '').trim(),
			projectDataCount: Array.isArray(project?.data) ? project.data.length : 0,
			pcbUuid: String(pcb?.uuid || board?.pcb?.uuid || '').trim(),
			pcbName: String(pcb?.name || board?.pcb?.name || '').trim(),
			parentBoardName: String(pcb?.parentBoardName || '').trim(),
			boardName: String(board?.name || '').trim(),
			schematicUuid: String(board?.schematic?.uuid || '').trim(),
			schematicName: String(board?.schematic?.name || '').trim(),
			currentDocumentType: String(documentInfo?.documentType || '').trim(),
			currentDocumentUuid: String(documentInfo?.uuid || '').trim(),
			currentTabId: String(documentInfo?.tabId || '').trim(),
			currentDocumentProjectUuid: String(documentInfo?.parentProjectUuid || '').trim(),
			teamName: String(teamInfo?.name || '').trim(),
			teamUuid: String(teamInfo?.uuid || '').trim(),
			teamIdentity: Number.isFinite(Number(teamInfo?.identity)) ? Number(teamInfo.identity) : '',
			workspaceName: String(workspaceInfo?.name || '').trim(),
			workspaceUuid: String(workspaceInfo?.uuid || '').trim(),
		};
	}
	async function refreshCurrentEdaSnapshot(options) {
		const silent = Boolean(options?.silent);
		state.edaSnapshotLoading = true;
		render();
		try {
			const snapshot = await readCurrentEdaSnapshot();
			state.edaSnapshot = snapshot;
			if (!silent) setStatus('success', t('已读取当前工程快照。', 'Current design snapshot loaded.'));
			return snapshot;
		} finally {
			state.edaSnapshotLoading = false;
			render();
		}
	}
	function safeFilePart(value, fallbackValue) {
		const normalized = String(value || '')
			.replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')
			.trim();
		return normalized || fallbackValue;
	}
	function makeTimestampToken() {
		return iso().replaceAll(':', '').replaceAll('.', '').replace('T', '-').replace('Z', '');
	}
	async function ensureSnapshot() {
		if (state.edaSnapshot) return state.edaSnapshot;
		return refreshCurrentEdaSnapshot({ silent: true });
	}
	async function getCurrentDocumentInfoSafe() {
		const selectApi = edaApi?.dmt_SelectControl;
		if (!selectApi || typeof selectApi.getCurrentDocumentInfo !== 'function') return null;
		return (await selectApi.getCurrentDocumentInfo().catch(() => undefined)) || null;
	}
	function reportCounts() {
		return {
			types: state.db.types.length,
			components: state.db.components.length,
			warnings: state.db.components.filter(warning).length,
			projects: state.db.projects.length,
			pcbs: state.db.pcbs.length,
			bomItems: state.db.pcbs.reduce((sum, item) => sum + item.items.length, 0),
		};
	}
	function reportTitle(kind, snapshot, extra) {
		const projectLabel = projectDisplayNameFromSnapshot(snapshot) || t('当前工程', 'Current Design');
		if (extra?.title) return extra.title;
		if (kind === 'context') return t(`工程快照报告 · ${projectLabel}`, `Context Report · ${projectLabel}`);
		if (kind === 'capture') return t(`画布快照 · ${projectLabel}`, `Canvas Capture · ${projectLabel}`);
		if (kind === 'export') return t(`制造导出 · ${projectLabel}`, `Manufacture Export · ${projectLabel}`);
		return t(`设计记录 · ${projectLabel}`, `Design Record · ${projectLabel}`);
	}
	function buildContextReport(kind, extra) {
		const snapshot = extra?.snapshot || state.edaSnapshot || null;
		return {
			id: id(),
			kind,
			title: reportTitle(kind, snapshot, extra),
			createdAt: iso(),
			snapshot,
			counts: reportCounts(),
			exportKind: extra?.exportKind || '',
			fileName: extra?.fileName || '',
			captureStrategy: extra?.captureStrategy || '',
			notes: extra?.notes || '',
			region: extra?.region || null,
		};
	}
	function reportKindText(kind) {
		if (kind === 'export') return t('制造导出', 'Manufacture Export');
		if (kind === 'capture') return t('画布快照', 'Canvas Capture');
		return t('工程报告', 'Design Report');
	}
	function reportHtml(report) {
		const snapshot = report?.snapshot || {};
		const counts = report?.counts || {};
		const rows = [
			[t('工程', 'Project'), projectDisplayNameFromSnapshot(snapshot) || '-'],
			[t('当前 PCB', 'Current PCB'), pcbDisplayNameFromSnapshot(snapshot) || '-'],
			[t('当前板子', 'Current Board'), boardDisplayNameFromSnapshot(snapshot) || '-'],
			[t('当前文档类型', 'Document Type'), snapshot?.currentDocumentType || '-'],
			[t('团队', 'Team'), snapshot?.teamName || '-'],
			[t('工作区', 'Workspace'), snapshot?.workspaceName || '-'],
			[t('元器件', 'Components'), counts.components ?? 0],
			[t('库存预警', 'Warnings'), counts.warnings ?? 0],
			[t('项目数', 'Projects'), counts.projects ?? 0],
			[t('PCB 数', 'PCBs'), counts.pcbs ?? 0],
			[t('BOM 明细', 'BOM Items'), counts.bomItems ?? 0],
			[t('文件名', 'File Name'), report?.fileName || '-'],
			[t('备注', 'Notes'), report?.notes || '-'],
		];
		return `<!doctype html><html><head><meta charset="utf-8" /><title>${e(report?.title || 'Design Pulse Report')}</title><style>body{font-family:"Segoe UI","Microsoft YaHei",sans-serif;padding:24px;color:#182334}h1{margin:0 0 8px}p{color:#5b6b84}table{border-collapse:collapse;width:100%;margin-top:18px}th,td{border:1px solid #dbe3f0;padding:8px 10px;text-align:left}th{width:220px;background:#f5f8ff}pre{margin-top:18px;padding:14px;background:#f6f8fb;border:1px solid #dbe3f0;border-radius:12px;white-space:pre-wrap;word-break:break-word}</style></head><body><h1>${e(report?.title || 'Design Pulse Report')}</h1><p>${e(`${reportKindText(report?.kind)} · ${time(report?.createdAt)}`)}</p><table>${rows.map((row) => `<tr><th>${e(row[0])}</th><td>${e(row[1])}</td></tr>`).join('')}</table><pre>${e(JSON.stringify(report, null, 2))}</pre></body></html>`;
	}
	async function saveBlobFile(fileData, fileName) {
		await edaApi.sys_FileSystem.saveFile(fileData, fileName);
	}
	function snapshotStem(snapshot, suffix) {
		return [
			safeFilePart(projectDisplayNameFromSnapshot(snapshot), 'project'),
			safeFilePart(pcbDisplayNameFromSnapshot(snapshot), 'pcb'),
			safeFilePart(suffix, 'asset'),
			makeTimestampToken(),
		].join('_');
	}
	async function exportStoredReport(reportId, format) {
		const report = state.reportHistory.find((item) => item.id === reportId) || null;
		if (!report) throw new Error(t('未找到报告记录。', 'Report entry not found.'));
		if (format === 'html') {
			await saveBlobFile(new Blob([reportHtml(report)], { type: 'text/html;charset=utf-8' }), `${safeFilePart(report.title, 'design-pulse-report')}.html`);
		} else {
			await saveBlobFile(new Blob([`${JSON.stringify(report, null, 2)}\n`], { type: 'application/json;charset=utf-8' }), `${safeFilePart(report.title, 'design-pulse-report')}.json`);
		}
		setStatus('success', t('已导出报告文件。', 'Report exported.'));
	}
	async function generateContextReport() {
		const snapshot = await ensureSnapshot();
		const report = buildContextReport('context', {
			snapshot,
			notes: t('基于当前工程、当前文档、团队与工作区生成。', 'Generated from current design, document, team, and workspace context.'),
		});
		await pushReport(report);
		setStatus('success', t('已生成工程快照报告。', 'Context report generated.'));
		render();
	}
	function regionMarker(region) {
		return [
			{
				type: 'rectangle',
				left: Number(region?.left || 0),
				right: Number(region?.right || 0),
				top: Number(region?.top || 0),
				bottom: Number(region?.bottom || 0),
			},
		];
	}
	async function zoomCanvas(strategy) {
		const editorApi = edaApi?.dmt_EditorControl;
		const documentInfo = await getCurrentDocumentInfoSafe();
		if (!editorApi || !documentInfo) throw new Error(t('当前没有可操作的画布文档。', 'No active canvas document.'));
		const action =
			strategy === 'selected'
				? editorApi.zoomToSelectedPrimitives?.bind(editorApi)
				: editorApi.zoomToAllPrimitives?.bind(editorApi);
		if (!action) throw new Error(t('当前 EDA 版本不支持该画布缩放接口。', 'Canvas zoom API is unavailable.'));
		const region = await action(documentInfo.tabId);
		if (!region) {
			throw new Error(
				strategy === 'selected'
					? t('当前没有可缩放的选中图元。', 'No selected primitives to focus.')
					: t('当前没有可缩放的图元。', 'No primitives available to focus.'),
			);
		}
		return { documentInfo, region };
	}
	async function focusCanvas(strategy) {
		await zoomCanvas(strategy);
		setStatus('success', strategy === 'selected' ? t('已适应当前选区。', 'Selection focused.') : t('已适应全部图元。', 'All primitives focused.'));
	}
	async function showCanvasMarker(strategy) {
		const editorApi = edaApi?.dmt_EditorControl;
		if (!editorApi || typeof editorApi.generateIndicatorMarkers !== 'function') {
			throw new Error(t('当前 EDA 版本不支持指示标记接口。', 'Indicator marker API is unavailable.'));
		}
		const { documentInfo, region } = await zoomCanvas(strategy);
		const ok = await editorApi.generateIndicatorMarkers(
			regionMarker(region),
			{ r: 22, g: 93, b: 255, alpha: 0.9 },
			12,
			true,
			documentInfo.tabId,
		);
		if (!ok) throw new Error(t('指示标记生成失败。', 'Failed to create indicator markers.'));
		setStatus('success', strategy === 'selected' ? t('已框选当前选区。', 'Current selection marked.') : t('已框选当前画布范围。', 'Current canvas area marked.'));
	}
	async function clearCanvasMarkers() {
		const editorApi = edaApi?.dmt_EditorControl;
		const documentInfo = await getCurrentDocumentInfoSafe();
		if (!editorApi || typeof editorApi.removeIndicatorMarkers !== 'function' || !documentInfo) {
			throw new Error(t('当前 EDA 版本不支持清理指示标记。', 'Cannot clear indicator markers in this EDA build.'));
		}
		await editorApi.removeIndicatorMarkers(documentInfo.tabId);
		setStatus('success', t('已清除画布指示标记。', 'Canvas markers cleared.'));
	}
	async function captureCanvas(strategy) {
		const editorApi = edaApi?.dmt_EditorControl;
		const documentInfo = await getCurrentDocumentInfoSafe();
		if (!editorApi || typeof editorApi.getCurrentRenderedAreaImage !== 'function' || !documentInfo) {
			throw new Error(t('当前 EDA 版本不支持画布截图接口。', 'Canvas capture API is unavailable.'));
		}
		let region = null;
		if (strategy === 'all' || strategy === 'selected') {
			const zoomed = await zoomCanvas(strategy);
			region = zoomed.region;
		}
		const blob = await editorApi.getCurrentRenderedAreaImage(documentInfo.tabId);
		if (!blob) throw new Error(t('未获取到画布图像。', 'No canvas image returned.'));
		const snapshot = await ensureSnapshot();
		const suffix =
			strategy === 'selected'
				? t('selected-capture', 'selected-capture')
				: strategy === 'all'
					? t('full-capture', 'full-capture')
					: t('current-view', 'current-view');
		const fileName = `${snapshotStem(snapshot, suffix)}.png`;
		await saveBlobFile(blob, fileName);
		await pushReport(
			buildContextReport('capture', {
				snapshot,
				fileName,
				captureStrategy: strategy,
				region,
				notes:
					strategy === 'selected'
						? t('已按当前选区适应并截图。', 'Captured after fitting current selection.')
						: strategy === 'all'
							? t('已按全部图元适应并截图。', 'Captured after fitting all primitives.')
							: t('已截图当前可视区域。', 'Captured current visible area.'),
			}),
		);
		setStatus('success', t(`已导出画布截图：${fileName}`, `Canvas capture exported: ${fileName}`));
		render();
	}
	async function exportManufactureAsset(kind) {
		const snapshot = await ensureSnapshot();
		const pcbApi = edaApi?.pcb_ManufactureData;
		const schApi = edaApi?.sch_ManufactureData;
		const stem = snapshotStem(snapshot, kind);
		let file = null;
		if (kind === 'bom') {
			const fn =
				pcbApi && typeof pcbApi.getBomFile === 'function'
					? pcbApi.getBomFile.bind(pcbApi)
					: schApi && typeof schApi.getBomFile === 'function'
						? schApi.getBomFile.bind(schApi)
						: null;
			if (!fn) throw new Error(t('当前 EDA 版本不支持 BOM 导出接口。', 'BOM export API is unavailable.'));
			file = await fn(stem, state.exportPrefs.bomFileType);
		} else if (kind === 'gerber') {
			if (!pcbApi || typeof pcbApi.getGerberFile !== 'function') throw new Error(t('当前 EDA 版本不支持 Gerber 导出接口。', 'Gerber export API is unavailable.'));
			file = await pcbApi.getGerberFile(stem, state.exportPrefs.gerberColorSilkscreen);
		} else if (kind === 'pickplace') {
			if (!pcbApi || typeof pcbApi.getPickAndPlaceFile !== 'function') throw new Error(t('当前 EDA 版本不支持坐标文件导出接口。', 'Pick&Place export API is unavailable.'));
			file = await pcbApi.getPickAndPlaceFile(stem, state.exportPrefs.pickPlaceFileType);
		} else if (kind === 'model3d') {
			if (!pcbApi || typeof pcbApi.get3DFile !== 'function') throw new Error(t('当前 EDA 版本不支持 3D 导出接口。', '3D export API is unavailable.'));
			file = await pcbApi.get3DFile(
				stem,
				state.exportPrefs.modelFileType,
				['Component Model', 'Via', 'Silkscreen', 'Wire In Signal Layer'],
				state.exportPrefs.modelMode,
				state.exportPrefs.autoGenerateModels,
			);
		} else if (kind === 'testpoint') {
			if (!pcbApi || typeof pcbApi.getTestPointFile !== 'function') throw new Error(t('当前 EDA 版本不支持测试点报告导出接口。', 'Test point export API is unavailable.'));
			file = await pcbApi.getTestPointFile(stem, state.exportPrefs.pickPlaceFileType);
		} else if (kind === 'netlist') {
			const fn =
				pcbApi && typeof pcbApi.getNetlistFile === 'function'
					? pcbApi.getNetlistFile.bind(pcbApi)
					: schApi && typeof schApi.getNetlistFile === 'function'
						? schApi.getNetlistFile.bind(schApi)
						: null;
			if (!fn) throw new Error(t('当前 EDA 版本不支持网表导出接口。', 'Netlist export API is unavailable.'));
			file = await fn(stem);
		}
		if (!file) throw new Error(t('未获取到导出文件。请确认当前工程和画布上下文可用。', 'No file returned. Confirm the current design context is available.'));
		await saveBlobFile(file, file.name || `${stem}`);
		await pushReport(
			buildContextReport('export', {
				snapshot,
				fileName: file.name || stem,
				exportKind: kind,
				notes: t(`已导出 ${kind} 资料。`, `${kind} asset exported.`),
			}),
		);
		setStatus('success', t(`已导出制造资料：${file.name || stem}`, `Manufacture asset exported: ${file.name || stem}`));
		render();
	}
	async function clearReportHistory() {
		if (!window.confirm(t('确认清空全部报告历史？', 'Clear all report history?'))) return;
		state.reportHistory = [];
		await saveReportHistory();
		setStatus('success', t('报告历史已清空。', 'Report history cleared.'));
		render();
	}

	function typeMap() {
		return new Map(state.db.types.map((item) => [item.id, item]));
	}
	function projectMap() {
		return new Map(state.db.projects.map((item) => [item.id, item]));
	}
	function storeMap() {
		return new Map(state.db.stores.map((item) => [item.id, item]));
	}
	function featureEnabled(key) {
		return Boolean(state.prefs?.features?.[key]);
	}
	function hasAnyEdaEntryEnabled() {
		return (
			featureEnabled('showEdaSnapshot') ||
			featureEnabled('enableCurrentPcbImport') ||
			featureEnabled('enableProjectBatchImport') ||
			featureEnabled('enableReportsView') ||
			featureEnabled('enableExportHub') ||
			featureEnabled('enableCanvasTools')
		);
	}
	function normalizeActiveView() {
		if (state.view === 'purchase' && !featureEnabled('enablePurchaseView')) state.view = 'dashboard';
		if (state.view === 'stores' && !featureEnabled('enableStoresView')) state.view = 'dashboard';
		if (state.view === 'reports' && !featureEnabled('enableReportsView')) state.view = 'dashboard';
		if (state.view === 'exports' && !featureEnabled('enableExportHub')) state.view = 'dashboard';
	}
	function warning(component) {
		return component.warningThreshold > 0 && component.totalQuantity <= component.warningThreshold;
	}
	function active(name, idValue) {
		return idValue ? state.db[name].find((item) => item.id === idValue) || null : null;
	}
	function header() {
		const actionButtons = [
			`<button class="ghost-button" data-action="import">${e(t('导入', 'Import'))}</button>`,
			featureEnabled('enableCanvasTools') ? `<button class="ghost-button" data-action="capture-canvas-current">${e(t('截图当前视图', 'Capture View'))}</button>` : '',
			featureEnabled('enableReportsView') ? `<button class="ghost-button" data-action="view" data-view="reports">${e(t('工程报告', 'Reports'))}</button>` : '',
			featureEnabled('enableExportHub') ? `<button class="ghost-button" data-action="view" data-view="exports">${e(t('导出中心', 'Export Hub'))}</button>` : '',
			featureEnabled('enableCurrentPcbImport')
				? `<button class="ghost-button" data-action="import-eda-bom">${e(t('从当前工程导入 BOM', 'Import BOM from EDA'))}</button>`
				: '',
			featureEnabled('enableProjectBatchImport')
				? `<button class="ghost-button" data-action="import-eda-project-bom">${e(t('整工程批量导入', 'Batch Import Project'))}</button>`
				: '',
			`<button class="ghost-button" data-action="export-json">${e(t('导出 JSON', 'Export JSON'))}</button>`,
			`<button class="ghost-button" data-action="export-xlsx">${e(t('导出 Excel(.xlsx)', 'Export Excel (.xlsx)'))}</button>`,
		]
			.filter(Boolean)
			.join('');
		return `<header class="app-header"><div><p class="eyebrow">JLCEDA Plugin</p><h1>${e(t('工程脉搏', 'Design Pulse'))}</h1><p class="hero-copy">${e(t('围绕当前工程上下文、制造导出、画布快照与 BOM 协作，提供一套贴近嘉立创 EDA 工作流的工程助手。', 'A workflow-focused plugin for current design context, manufacture exports, canvas capture, and BOM collaboration in JLCEDA Pro.'))}</p></div><div class="header-actions">${actionButtons}</div></header>`;
	}
	function nav() {
		const items = [
			['dashboard', '概览', 'Overview'],
			featureEnabled('enableReportsView') ? ['reports', '报告', 'Reports'] : null,
			featureEnabled('enableExportHub') ? ['exports', '导出中心', 'Export Hub'] : null,
			['components', '元器件', 'Components'],
			['types', '类型', 'Types'],
			['projects', '项目/PCB', 'Projects/PCB'],
			featureEnabled('enablePurchaseView') ? ['purchase', '采购清单', 'Purchase'] : null,
			featureEnabled('enableStoresView') ? ['stores', '店铺', 'Stores'] : null,
			['settings', '设置', 'Settings'],
		].filter(Boolean);
		return `<nav class="nav-strip">${items.map(([idValue, zh, en]) => `<button class="nav-link ${state.view === idValue ? 'active' : ''}" data-action="view" data-view="${idValue}">${e(t(zh, en))}</button>`).join('')}</nav>`;
	}
	function status() {
		return state.status ? `<div class="status-banner status-${e(state.statusKind)}">${e(state.status)}</div>` : '';
	}
	function currentEdaSnapshotCard() {
		if (!featureEnabled('showEdaSnapshot')) return '';
		const snapshot = state.edaSnapshot;
		const projectLabel = projectDisplayNameFromSnapshot(snapshot);
		const pcbLabel = pcbDisplayNameFromSnapshot(snapshot);
		const boardLabel = boardDisplayNameFromSnapshot(snapshot);
		const refreshLabel = snapshot ? t('刷新当前工程快照', 'Refresh Snapshot') : t('读取当前工程快照', 'Load Snapshot');
		const subtitle = state.edaSnapshotLoading
			? t('正在读取当前工程上下文...', 'Reading current design context...')
			: snapshot
				? t(`上次读取：${time(snapshot.fetchedAt)}`, `Last loaded: ${time(snapshot.fetchedAt)}`)
				: t('尚未读取当前工程上下文。', 'Current design context has not been loaded yet.');
		const details = snapshot
			? `<div class="meta-grid"><div><span>${e(t('工程', 'Project'))}</span><strong>${e(projectLabel || '-')}</strong></div><div><span>${e(t('当前 PCB', 'Current PCB'))}</span><strong>${e(pcbLabel || '-')}</strong></div><div><span>${e(t('当前板子', 'Current Board'))}</span><strong>${e(boardLabel || '-')}</strong></div><div><span>${e(t('工程条目', 'Project Items'))}</span><strong>${snapshot.projectDataCount || 0}</strong></div><div><span>${e(t('当前文档', 'Current Document'))}</span><strong>${e(snapshot.currentDocumentType || '-')}</strong></div><div><span>${e(t('团队/工作区', 'Team/Workspace'))}</span><strong>${e(`${snapshot.teamName || '-'} / ${snapshot.workspaceName || '-'}`)}</strong></div></div>${snapshot.projectDescription ? `<p class="support-text">${e(snapshot.projectDescription)}</p>` : ''}<ul class="info-list">${projectLabel && snapshot.projectName && snapshot.projectName !== projectLabel ? `<li>${e(t(`工程链接名：${snapshot.projectName}`, `Project slug: ${snapshot.projectName}`))}</li>` : ''}${snapshot.schematicName ? `<li>${e(t(`当前原理图：${snapshot.schematicName}`, `Current schematic: ${snapshot.schematicName}`))}</li>` : ''}${snapshot.currentDocumentUuid ? `<li>${e(t(`当前文档 UUID：${snapshot.currentDocumentUuid}`, `Document UUID: ${snapshot.currentDocumentUuid}`))}</li>` : ''}${snapshot.currentTabId ? `<li>${e(t(`当前标签页 ID：${snapshot.currentTabId}`, `Current Tab ID: ${snapshot.currentTabId}`))}</li>` : ''}${snapshot.teamIdentity !== '' ? `<li>${e(t(`团队身份 ID：${snapshot.teamIdentity}`, `Team identity: ${snapshot.teamIdentity}`))}</li>` : ''}${snapshot.workspaceUuid ? `<li>${e(t(`工作区 UUID：${snapshot.workspaceUuid}`, `Workspace UUID: ${snapshot.workspaceUuid}`))}</li>` : ''}${snapshot.projectUuid ? `<li>${e(`Project UUID: ${snapshot.projectUuid}`)}</li>` : ''}</ul>`
			: `<p class="empty-state">${e(t('切换到已打开的工程后点击“读取当前工程快照”，插件会读取当前工程、PCB 与板子信息。', 'Open a design and click "Load Snapshot" to read the current project, PCB and board context.'))}</p>`;
		const buttons = [
			`<button class="ghost-button" type="button" data-action="refresh-eda-snapshot" ${state.edaSnapshotLoading ? 'disabled' : ''}>${e(refreshLabel)}</button>`,
			featureEnabled('enableReportsView') ? `<button class="ghost-button" type="button" data-action="generate-context-report">${e(t('生成报告', 'Generate Report'))}</button>` : '',
			featureEnabled('enableReportsView') ? `<button class="ghost-button" type="button" data-action="view" data-view="reports">${e(t('查看报告', 'Open Reports'))}</button>` : '',
			featureEnabled('enableExportHub') ? `<button class="ghost-button" type="button" data-action="view" data-view="exports">${e(t('制造导出', 'Open Exports'))}</button>` : '',
			featureEnabled('enableProjectBatchImport')
				? `<button class="ghost-button" type="button" data-action="import-eda-project-bom">${e(t('整工程批量导入', 'Batch Import Project'))}</button>`
				: '',
			featureEnabled('enableCurrentPcbImport')
				? `<button class="primary-button" type="button" data-action="import-eda-bom">${e(t('导入当前 PCB BOM', 'Import Current PCB BOM'))}</button>`
				: '',
		]
			.filter(Boolean)
			.join('');
		return `<article class="panel-card"><div class="section-head"><h2>${e(t('当前工程快照', 'Current Design Snapshot'))}</h2><div class="inline-actions">${buttons}</div></div><p class="support-text">${e(subtitle)}</p>${details}</article>`;
	}

	function render() {
		normalizeActiveView();
		document.documentElement.setAttribute('data-theme', state.prefs.theme);
		app.innerHTML = `<div class="app-shell">${header()}${nav()}${status()}<main class="page-content">${view()}</main>${modal()}</div>`;
	}

	function view() {
		if (state.view === 'reports') return reportsView();
		if (state.view === 'exports') return exportsView();
		if (state.view === 'types') return typesView();
		if (state.view === 'components') return componentsView();
		if (state.view === 'projects') return projectsView();
		if (state.view === 'purchase') return purchaseView();
		if (state.view === 'stores') return storesView();
		if (state.view === 'settings') return settingsView();
		return dashboardView();
	}

	function dashboardView() {
		const warningCount = state.db.components.filter(warning).length;
		const recordCount = state.db.components.reduce((sum, item) => sum + item.records.length, 0);
		const bomCount = state.db.pcbs.reduce((sum, item) => sum + item.items.length, 0);
		const reportCount = state.reportHistory.length;
		const quickActions = [
			featureEnabled('enableReportsView') ? `<button class="primary-button" data-action="generate-context-report">${e(t('生成工程报告', 'Generate Report'))}</button>` : `<button class="primary-button" data-action="view" data-view="components">${e(t('新增元器件', 'Add Component'))}</button>`,
			featureEnabled('enableExportHub') ? `<button class="ghost-button" data-action="view" data-view="exports">${e(t('打开导出中心', 'Open Export Hub'))}</button>` : '',
			featureEnabled('enableReportsView') ? `<button class="ghost-button" data-action="view" data-view="reports">${e(t('查看报告历史', 'Open Report History'))}</button>` : '',
			`<button class="ghost-button" data-action="view" data-view="projects">${e(t('维护项目/PCB', 'Manage Projects/PCB'))}</button>`,
			featureEnabled('enableStoresView') ? `<button class="ghost-button" data-action="view" data-view="stores">${e(t('维护店铺', 'Manage Stores'))}</button>` : '',
			featureEnabled('enablePurchaseView') ? `<button class="ghost-button" data-action="view" data-view="purchase">${e(t('查看采购清单', 'Open Purchase List'))}</button>` : '',
		]
			.filter(Boolean)
			.join('');
		const snapshotCard = currentEdaSnapshotCard();
		return `<section class="card-grid summary-grid"><article class="summary-card accent-blue"><span>${e(t('元器件', 'Components'))}</span><strong>${state.db.components.length}</strong></article><article class="summary-card accent-gold"><span>${e(t('库存预警', 'Warnings'))}</span><strong>${warningCount}</strong></article><article class="summary-card accent-green"><span>${e(t('报告历史', 'Reports'))}</span><strong>${reportCount}</strong></article><article class="summary-card accent-red"><span>${e(t('BOM 明细', 'BOM Items'))}</span><strong>${bomCount}</strong></article></section><section class="card-grid two-col"><article class="panel-card"><h2>${e(t('快速入口', 'Quick Actions'))}</h2><div class="quick-actions">${quickActions}</div><div class="quick-actions">${featureEnabled('enableExportHub') ? `<button class="ghost-button" data-action="export-manufacture" data-kind="bom">${e(t('快速导出 BOM', 'Quick Export BOM'))}</button>` : ''}${featureEnabled('enableExportHub') ? `<button class="ghost-button" data-action="export-manufacture" data-kind="gerber">${e(t('快速导出 Gerber', 'Quick Export Gerber'))}</button>` : ''}${featureEnabled('enableCanvasTools') ? `<button class="ghost-button" data-action="capture-canvas-current">${e(t('截图当前视图', 'Capture Current View'))}</button>` : ''}${featureEnabled('enableCanvasTools') ? `<button class="ghost-button" data-action="capture-canvas-selected">${e(t('截图当前选区', 'Capture Selection'))}</button>` : ''}${featureEnabled('enableCanvasTools') ? `<button class="ghost-button" data-action="mark-canvas-selected">${e(t('框选当前选区', 'Mark Selection'))}</button>` : ''}</div></article>${snapshotCard}</section><section class="panel-card"><h2>${e(t('使用提示', 'Tips'))}</h2><ul class="info-list"><li>${e(t('建议在“报告”页定期生成工程快照，便于回看当前画布、团队和工作区上下文。', 'Generate context reports regularly in Reports for quick traceability of current design, team, and workspace context.'))}</li><li>${e(t('制造导出集中在“导出中心”里，适合做 Gerber、坐标、3D、网表和测试点资料的统一导出。', 'Use Export Hub to keep Gerber, Pick&Place, 3D, netlist, and test point exports in one place.'))}</li><li>${e(t('窗口标题栏现在支持最大化与最小化；如窗口被最小化，再次点击插件菜单即可恢复显示。', 'The iframe window now supports maximize and minimize. If it is minimized, click the plugin menu again to restore it.'))}</li><li>${e(t('需要导入当前工程 BOM 时，先读取工程快照可以更直观看到将要写入的工程/PCB 来源。', 'Load the design snapshot first if you want to confirm the project/PCB source before importing the current BOM.'))}</li></ul></section>`;
	}
	function reportsView() {
		const snapshot = state.edaSnapshot;
		const contextPanel = `<section class="panel-card"><div class="section-head"><h2>${e(t('工程报告', 'Engineering Reports'))}</h2><div class="inline-actions"><button class="primary-button" type="button" data-action="generate-context-report">${e(t('生成快照报告', 'Generate Context Report'))}</button><button class="ghost-button" type="button" data-action="refresh-eda-snapshot">${e(t('刷新上下文', 'Refresh Context'))}</button></div></div><p class="support-text">${e(snapshot ? t(`当前文档：${snapshot.currentDocumentType || '-'}，团队：${snapshot.teamName || '-'}，工作区：${snapshot.workspaceName || '-'}`, `Current document: ${snapshot.currentDocumentType || '-'}, team: ${snapshot.teamName || '-'}, workspace: ${snapshot.workspaceName || '-'}`) : t('先读取当前工程快照，再生成报告。', 'Load the current design snapshot before generating reports.'))}</p><div class="meta-grid"><div><span>${e(t('工程', 'Project'))}</span><strong>${e(projectDisplayNameFromSnapshot(snapshot) || '-')}</strong></div><div><span>${e(t('PCB', 'PCB'))}</span><strong>${e(pcbDisplayNameFromSnapshot(snapshot) || '-')}</strong></div><div><span>${e(t('板子', 'Board'))}</span><strong>${e(boardDisplayNameFromSnapshot(snapshot) || '-')}</strong></div><div><span>${e(t('文档类型', 'Document Type'))}</span><strong>${e(snapshot?.currentDocumentType || '-')}</strong></div><div><span>${e(t('文档 UUID', 'Document UUID'))}</span><strong>${e(snapshot?.currentDocumentUuid || '-')}</strong></div><div><span>${e(t('标签页 ID', 'Tab ID'))}</span><strong>${e(snapshot?.currentTabId || '-')}</strong></div><div><span>${e(t('团队', 'Team'))}</span><strong>${e(snapshot?.teamName || '-')}</strong></div><div><span>${e(t('团队身份', 'Team Identity'))}</span><strong>${e(snapshot?.teamIdentity !== '' ? snapshot?.teamIdentity : '-')}</strong></div><div><span>${e(t('工作区', 'Workspace'))}</span><strong>${e(snapshot?.workspaceName || '-')}</strong></div><div><span>${e(t('工作区 UUID', 'Workspace UUID'))}</span><strong>${e(snapshot?.workspaceUuid || '-')}</strong></div><div><span>${e(t('项目 UUID', 'Project UUID'))}</span><strong>${e(snapshot?.currentDocumentProjectUuid || snapshot?.projectUuid || '-')}</strong></div></div></section>`;
		const canvasButtons = featureEnabled('enableCanvasTools')
			? `<section class="panel-card"><div class="section-head"><h2>${e(t('画布工具', 'Canvas Tools'))}</h2><div class="inline-actions"><button class="ghost-button" type="button" data-action="clear-canvas-markers">${e(t('清除标记', 'Clear Markers'))}</button></div></div><div class="quick-actions"><button class="ghost-button" type="button" data-action="zoom-canvas-all">${e(t('适应全部', 'Fit All'))}</button><button class="ghost-button" type="button" data-action="zoom-canvas-selected">${e(t('适应选中', 'Fit Selected'))}</button><button class="ghost-button" type="button" data-action="mark-canvas-all">${e(t('框选全部范围', 'Mark All'))}</button><button class="ghost-button" type="button" data-action="mark-canvas-selected">${e(t('框选当前选区', 'Mark Selected'))}</button><button class="primary-button" type="button" data-action="capture-canvas-current">${e(t('截图当前视图', 'Capture Current View'))}</button><button class="primary-button" type="button" data-action="capture-canvas-all">${e(t('截图全部图元', 'Capture All'))}</button><button class="primary-button" type="button" data-action="capture-canvas-selected">${e(t('截图当前选区', 'Capture Selection'))}</button></div><p class="support-text">${e(t('适合在 PCB/原理图排查时快速框选、截图并写入报告历史。', 'Use these tools to frame, capture, and record canvas context while reviewing PCB or schematic documents.'))}</p></section>`
			: '';
		const historyItems = state.reportHistory
			.map((item) => {
				const extraPills = [
					item.captureStrategy ? `<span class="pill">${e(t(`截图:${item.captureStrategy}`, `Capture:${item.captureStrategy}`))}</span>` : '',
					item.exportKind ? `<span class="pill">${e(t(`导出:${item.exportKind}`, `Export:${item.exportKind}`))}</span>` : '',
				]
					.filter(Boolean)
					.join('');
				const regionText = item.region ? `${item.region.left}, ${item.region.top}, ${item.region.right}, ${item.region.bottom}` : '-';
				return `<article class="entity-card"><header class="entity-header"><div><h3>${e(item.title || reportKindText(item.kind))}</h3><p>${e(`${reportKindText(item.kind)} · ${time(item.createdAt)}`)}</p></div><div class="inline-actions">${extraPills}<button class="ghost-button" type="button" data-action="export-report-json" data-report-id="${item.id}">${e(t('导出 JSON', 'Export JSON'))}</button><button class="ghost-button" type="button" data-action="export-report-html" data-report-id="${item.id}">${e(t('导出 HTML', 'Export HTML'))}</button><button class="danger-button" type="button" data-action="delete-report" data-report-id="${item.id}">${e(t('删除', 'Delete'))}</button></div></header><div class="meta-grid"><div><span>${e(t('工程', 'Project'))}</span><strong>${e(projectDisplayNameFromSnapshot(item.snapshot) || '-')}</strong></div><div><span>${e(t('文档类型', 'Document Type'))}</span><strong>${e(item.snapshot?.currentDocumentType || '-')}</strong></div><div><span>${e(t('文件', 'File'))}</span><strong>${e(item.fileName || '-')}</strong></div><div><span>${e(t('区域', 'Region'))}</span><strong>${e(regionText)}</strong></div><div><span>${e(t('备注', 'Notes'))}</span><strong>${e(item.notes || '-')}</strong></div></div></article>`;
			})
			.join('');
		const latestReport = state.reportHistory[0] || null;
		const historyPanel = `<section class="panel-card"><div class="section-head"><h2>${e(t('报告历史', 'Report History'))}</h2><div class="inline-actions"><span class="pill">${e(t(`保留最近 ${state.exportPrefs.reportHistoryLimit} 条`, `Keep latest ${state.exportPrefs.reportHistoryLimit}`))}</span>${latestReport ? `<button class="ghost-button" type="button" data-action="export-report-json" data-report-id="${latestReport.id}">${e(t('导出最近 JSON', 'Latest JSON'))}</button>` : ''}${latestReport ? `<button class="ghost-button" type="button" data-action="export-report-html" data-report-id="${latestReport.id}">${e(t('导出最近 HTML', 'Latest HTML'))}</button>` : ''}<button class="ghost-button" type="button" data-action="clear-report-history">${e(t('清空历史', 'Clear History'))}</button></div></div>${historyItems || `<p class="empty-state">${e(t('尚无报告历史。生成工程报告或导出/截图后会自动记录。', 'No report history yet. Reports, exports, and captures will appear here automatically.'))}</p>`}</section>`;
		return `${contextPanel}${canvasButtons}${historyPanel}`;
	}
	function exportsView() {
		const snapshot = state.edaSnapshot;
		const exportCards = [
			['bom', t('BOM 文件', 'BOM File'), t('按当前文档自动选择 PCB / 原理图导出 BOM。', 'Export BOM from the current PCB or schematic context.')],
			['gerber', t('Gerber 制版', 'Gerber Package'), t('导出当前 PCB 的制版文件。', 'Export Gerber manufacturing package for the current PCB.')],
			['pickplace', t('贴片坐标', 'Pick&Place'), t('导出当前 PCB 的坐标文件。', 'Export pick-and-place coordinates for the current PCB.')],
			['model3d', t('3D 模型', '3D Model'), t('导出 STEP/OBJ 3D 模型。', 'Export STEP/OBJ 3D model files.')],
			['testpoint', t('测试点报告', 'Test Point'), t('导出测试点报告用于测试夹具准备。', 'Export test point files for test-fixture preparation.')],
			['netlist', t('网表文件', 'Netlist'), t('按当前文档导出网表文件。', 'Export netlist from the current document context.')],
		];
		const presetSummary = (kind) => {
			if (kind === 'bom') return `BOM=${state.exportPrefs.bomFileType.toUpperCase()}`;
			if (kind === 'pickplace' || kind === 'testpoint') return `P&P=${state.exportPrefs.pickPlaceFileType.toUpperCase()}`;
			if (kind === 'model3d') return `3D=${state.exportPrefs.modelFileType.toUpperCase()} / ${state.exportPrefs.modelMode}`;
			if (kind === 'gerber') return state.exportPrefs.gerberColorSilkscreen ? t('彩色丝印已开', 'Color Silkscreen On') : t('彩色丝印已关', 'Color Silkscreen Off');
			return t('跟随当前文档', 'Follow Current Doc');
		};
		return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(t('导出预设', 'Export Presets'))}</h2><form id="export-prefs-form" class="stack-form"><label><span>${e(t('BOM 格式', 'BOM Format'))}</span><select name="bomFileType"><option value="xlsx" ${state.exportPrefs.bomFileType === 'xlsx' ? 'selected' : ''}>XLSX</option><option value="csv" ${state.exportPrefs.bomFileType === 'csv' ? 'selected' : ''}>CSV</option></select></label><label><span>${e(t('坐标格式', 'Pick&Place Format'))}</span><select name="pickPlaceFileType"><option value="xlsx" ${state.exportPrefs.pickPlaceFileType === 'xlsx' ? 'selected' : ''}>XLSX</option><option value="csv" ${state.exportPrefs.pickPlaceFileType === 'csv' ? 'selected' : ''}>CSV</option></select></label><label><span>${e(t('3D 格式', '3D Format'))}</span><select name="modelFileType"><option value="step" ${state.exportPrefs.modelFileType === 'step' ? 'selected' : ''}>STEP</option><option value="obj" ${state.exportPrefs.modelFileType === 'obj' ? 'selected' : ''}>OBJ</option></select></label><label><span>${e(t('3D 模式', '3D Mode'))}</span><select name="modelMode"><option value="Outfit" ${state.exportPrefs.modelMode === 'Outfit' ? 'selected' : ''}>Outfit</option><option value="Parts" ${state.exportPrefs.modelMode === 'Parts' ? 'selected' : ''}>Parts</option></select></label><label><span>${e(t('报告历史条数', 'Report History Limit'))}</span><input name="reportHistoryLimit" type="number" min="3" max="20" step="1" value="${e(state.exportPrefs.reportHistoryLimit)}" /></label><label class="checkbox-row"><input type="checkbox" name="gerberColorSilkscreen" ${state.exportPrefs.gerberColorSilkscreen ? 'checked' : ''} /><span>${e(t('Gerber 启用彩色丝印', 'Use color silkscreen for Gerber'))}</span></label><label class="checkbox-row"><input type="checkbox" name="autoGenerateModels" ${state.exportPrefs.autoGenerateModels ? 'checked' : ''} /><span>${e(t('3D 自动补全未绑定模型', 'Auto-generate missing 3D models'))}</span></label><button class="primary-button" type="submit">${e(t('保存预设', 'Save Presets'))}</button></form></article><article class="panel-card"><div class="section-head"><h2>${e(t('导出说明', 'Export Notes'))}</h2><div class="inline-actions"><button class="ghost-button" type="button" data-action="generate-context-report">${e(t('导前生成报告', 'Snapshot Before Export'))}</button></div></div><p class="support-text">${e(snapshot ? t(`当前上下文：${projectDisplayNameFromSnapshot(snapshot) || '-'} / ${pcbDisplayNameFromSnapshot(snapshot) || '-'}`, `Current context: ${projectDisplayNameFromSnapshot(snapshot) || '-'} / ${pcbDisplayNameFromSnapshot(snapshot) || '-'}`) : t('建议先读取工程快照，再进行制造导出。', 'Load the current design snapshot before exporting.'))}</p><ul class="info-list"><li>${e(t('BOM 和网表会优先按当前画布上下文选择 PCB 或原理图接口。', 'BOM and netlist prefer the active PCB or schematic context automatically.'))}</li><li>${e(t('Gerber、坐标、3D、测试点资料依赖当前 PCB 文档。', 'Gerber, Pick&Place, 3D, and test point exports require an active PCB document.'))}</li><li>${e(t('每次导出都会自动写入“报告历史”，便于回看导出时间和工程上下文。', 'Each export is recorded in Report History for later traceability.'))}</li></ul></article></section><section class="panel-card"><div class="section-head"><h2>${e(t('制造导出中心', 'Manufacture Export Hub'))}</h2><div class="inline-actions"><button class="ghost-button" type="button" data-action="refresh-eda-snapshot">${e(t('刷新上下文', 'Refresh Context'))}</button></div></div><div class="export-grid">${exportCards.map(([kind, title, desc]) => `<article class="export-card"><div class="section-head"><h3>${e(title)}</h3><span class="pill">${e(presetSummary(kind))}</span></div><p>${e(desc)}</p><button class="primary-button" type="button" data-action="export-manufacture" data-kind="${kind}">${e(t('立即导出', 'Export Now'))}</button></article>`).join('')}</div></section>`;
	}

	function typesView() {
		const current = active('types', state.editingTypeId);
		const grouped = new Map();
		sort(state.db.types, (item) => item.name).forEach((item) => { const key = item.primaryName || t('未分类', 'Uncategorized'); if (!grouped.has(key)) grouped.set(key, []); grouped.get(key).push(item); });
		return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(current ? t('编辑类型', 'Edit Type') : t('新增类型', 'New Type'))}</h2><form id="type-form" class="stack-form"><input type="hidden" name="typeId" value="${e(current?.id || '')}" /><label><span>${e(t('一级类型', 'Primary Type'))}</span><input name="primaryName" required value="${e(current?.primaryName || '')}" /></label><label><span>${e(t('二级类型', 'Secondary Type'))}</span><input name="secondaryName" value="${e(current?.secondaryName || '')}" /></label><div class="inline-actions"><button class="primary-button" type="submit">${e(current ? t('更新', 'Update') : t('新增', 'Create'))}</button>${current ? `<button class="ghost-button" type="button" data-action="cancel-type">${e(t('取消', 'Cancel'))}</button>` : ''}</div></form></article><article class="panel-card"><h2>${e(t('类型列表', 'Type List'))}</h2><div class="stack-list">${Array.from(grouped.entries()).map(([name, items]) => `<section class="nested-section"><h3>${e(name)}</h3>${items.map((item) => `<div class="list-row"><div><strong>${e(item.name)}</strong><p>${e(time(item.updatedAt))}</p></div><div class="inline-actions"><button class="ghost-button" type="button" data-action="edit-type" data-id="${item.id}">${e(t('编辑', 'Edit'))}</button><button class="danger-button" type="button" data-action="delete-type" data-id="${item.id}">${e(t('删除', 'Delete'))}</button></div></div>`).join('')}</section>`).join('') || `<p class="empty-state">${e(t('暂无类型数据。', 'No type data.'))}</p>`}</div></article></section>`;
	}

	function componentsView() {
		const current = active('components', state.editingComponentId);
		const tMap = typeMap();
		const pMap = projectMap();
		const sMap = storeMap();
		const usage = new Map();
		state.db.pcbs.forEach((pcb) => pcb.items.forEach((item) => { if (!usage.has(item.componentId)) usage.set(item.componentId, { total: 0, names: new Set() }); const row = usage.get(item.componentId); row.total += item.quantityPerBoard * pcb.boardQuantity; row.names.add(`${pMap.get(pcb.projectId)?.name || t('未知项目', 'Unknown Project')}/${pcb.name}${pcb.version ? `(${pcb.version})` : ''}`); }));
		const list = sort(state.db.components, (item) => item.model).filter((item) => { const keyword = state.componentFilter.keyword.trim().toLowerCase(); const typeName = tMap.get(item.typeId)?.name || ''; const hit = !keyword || [item.model, item.auxInfo, item.note, typeName].join(' ').toLowerCase().includes(keyword); const hitType = state.componentFilter.typeId === 'all' || state.componentFilter.typeId === item.typeId; const hitWarning = !state.componentFilter.warningOnly || warning(item); return hit && hitType && hitWarning; });
		return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(current ? t('编辑元器件', 'Edit Component') : t('新增元器件', 'New Component'))}</h2><form id="component-form" class="stack-form"><input type="hidden" name="componentId" value="${e(current?.id || '')}" /><label><span>${e(t('类型', 'Type'))}</span><select name="typeId" required><option value="">${e(t('请选择类型', 'Select type'))}</option>${sort(state.db.types, (item) => item.name).map((item) => `<option value="${item.id}" ${current?.typeId === item.id ? 'selected' : ''}>${e(item.name)}</option>`).join('')}</select></label><label><span>${e(t('型号', 'Model'))}</span><input name="model" required value="${e(current?.model || '')}" /></label><label><span>${e(t('预警阈值', 'Warning Threshold'))}</span><input name="warningThreshold" type="number" min="0" step="1" value="${e(current?.warningThreshold || 0)}" /></label><label><span>${e(t('辅助信息', 'Aux Info'))}</span><textarea name="auxInfo">${e(current?.auxInfo || '')}</textarea></label><label><span>${e(t('备注', 'Note'))}</span><textarea name="note">${e(current?.note || '')}</textarea></label><div class="inline-actions"><button class="primary-button" type="submit">${e(current ? t('更新', 'Update') : t('新增', 'Create'))}</button>${current ? `<button class="ghost-button" type="button" data-action="cancel-component">${e(t('取消', 'Cancel'))}</button>` : ''}</div></form></article><article class="panel-card"><h2>${e(t('搜索与筛选', 'Filter'))}</h2><div class="stack-form"><label><span>${e(t('关键词', 'Keyword'))}</span><input data-filter="component-keyword" value="${e(state.componentFilter.keyword)}" placeholder="${e(t('型号/备注/类型', 'Model/note/type'))}" /></label><label><span>${e(t('类型筛选', 'Type Filter'))}</span><select data-filter="component-type"><option value="all">${e(t('全部类型', 'All Types'))}</option>${sort(state.db.types, (item) => item.name).map((item) => `<option value="${item.id}" ${state.componentFilter.typeId === item.id ? 'selected' : ''}>${e(item.name)}</option>`).join('')}</select></label><label class="checkbox-row"><input data-filter="component-warning" type="checkbox" ${state.componentFilter.warningOnly ? 'checked' : ''} /><span>${e(t('仅显示库存预警', 'Only warnings'))}</span></label></div></article></section><section class="panel-card"><h2>${e(t('元器件列表', 'Component List'))}</h2><div class="stack-list">${list.map((item) => `<article class="entity-card ${warning(item) ? 'warning-entity' : ''}"><header class="entity-header"><div><h3>${e(item.model)}</h3><p>${e(tMap.get(item.typeId)?.name || t('未知类型', 'Unknown Type'))}</p></div><div class="inline-actions">${warning(item) ? `<span class="pill pill-warning">${e(t('库存预警', 'Low Stock'))}</span>` : ''}<button class="ghost-button" type="button" data-action="edit-component" data-id="${item.id}">${e(t('编辑', 'Edit'))}</button><button class="danger-button" type="button" data-action="delete-component" data-id="${item.id}">${e(t('删除', 'Delete'))}</button></div></header><div class="meta-grid"><div><span>${e(t('总库存', 'Total'))}</span><strong>${item.totalQuantity}</strong></div><div><span>${e(t('最低价格', 'Lowest'))}</span><strong>${item.lowestPrice === null ? '-' : `¥${item.lowestPrice.toFixed(2)}`}</strong></div><div><span>${e(t('PCB 需求', 'PCB Demand'))}</span><strong>${usage.get(item.id)?.total || 0}</strong></div></div>${item.auxInfo ? `<p class="support-text">${e(item.auxInfo)}</p>` : ''}<div class="subsection-head"><h4>${e(t('采购记录', 'Purchase Records'))} (${item.records.length})</h4><button class="primary-button" type="button" data-action="record-modal" data-component-id="${item.id}">${e(t('新增记录', 'Add Record'))}</button></div><div class="table-wrap"><table><thead><tr><th>${e(t('店铺', 'Store'))}</th><th>${e(t('平台', 'Platform'))}</th><th>${e(t('数量', 'Qty'))}</th><th>${e(t('单价', 'Price'))}</th><th>${e(t('时间', 'Time'))}</th><th>${e(t('操作', 'Actions'))}</th></tr></thead><tbody>${sort(item.records, (record) => `${record.platform}-${record.purchasedAt}`).map((record) => `<tr><td>${e(record.storeId ? `${sMap.get(record.storeId)?.platform || ''}/${sMap.get(record.storeId)?.shopName || ''}` : '-')}</td><td>${e(record.platform)}</td><td>${record.quantity}</td><td>${e(`¥${record.pricePerUnit.toFixed(2)}`)}</td><td>${e(time(record.purchasedAt))}</td><td><div class="inline-actions"><a class="text-link" href="${e(record.link)}" target="_blank" rel="noreferrer">${e(t('打开', 'Open'))}</a><button class="ghost-button" type="button" data-action="record-modal" data-component-id="${item.id}" data-record-id="${record.id}">${e(t('编辑', 'Edit'))}</button><button class="danger-button" type="button" data-action="delete-record" data-component-id="${item.id}" data-record-id="${record.id}">${e(t('删除', 'Delete'))}</button></div></td></tr>`).join('') || `<tr><td colspan="6" class="empty-state">${e(t('暂无采购记录。', 'No records.'))}</td></tr>`}</tbody></table></div></article>`).join('') || `<p class="empty-state">${e(t('暂无元器件数据。', 'No component data.'))}</p>`}</div></section>`;
	}

	function projectsView() {
		const currentProject = active('projects', state.editingProjectId);
		const currentPcb = active('pcbs', state.editingPcbId);
		const tMap = typeMap();
		const cMap = new Map(state.db.components.map((item) => [item.id, item]));
		const pMap = projectMap();
		const pcbs = state.projectFilter === 'all' ? state.db.pcbs : state.db.pcbs.filter((item) => item.projectId === state.projectFilter);
		const summary = new Map();
		pcbs.forEach((pcb) => pcb.items.forEach((item) => { if (!summary.has(item.componentId)) summary.set(item.componentId, { total: 0, names: new Set() }); const row = summary.get(item.componentId); row.total += item.quantityPerBoard * pcb.boardQuantity; row.names.add(`${pMap.get(pcb.projectId)?.name || ''}/${pcb.name}`); }));
		return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(currentProject ? t('编辑项目', 'Edit Project') : t('新增项目', 'New Project'))}</h2><form id="project-form" class="stack-form"><input type="hidden" name="projectId" value="${e(currentProject?.id || '')}" /><label><span>${e(t('项目名称', 'Project Name'))}</span><input name="name" required value="${e(currentProject?.name || '')}" /></label><label><span>${e(t('备注', 'Note'))}</span><textarea name="note">${e(currentProject?.note || '')}</textarea></label><div class="inline-actions"><button class="primary-button" type="submit">${e(currentProject ? t('更新', 'Update') : t('新增', 'Create'))}</button>${currentProject ? `<button class="ghost-button" type="button" data-action="cancel-project">${e(t('取消', 'Cancel'))}</button>` : ''}</div></form></article><article class="panel-card"><h2>${e(currentPcb ? t('编辑 PCB', 'Edit PCB') : t('新增 PCB', 'New PCB'))}</h2><form id="pcb-form" class="stack-form"><input type="hidden" name="pcbId" value="${e(currentPcb?.id || '')}" /><label><span>${e(t('所属项目', 'Project'))}</span><select name="projectId" required><option value="">${e(t('请选择项目', 'Select project'))}</option>${sort(state.db.projects, (item) => item.name).map((item) => `<option value="${item.id}" ${currentPcb?.projectId === item.id ? 'selected' : ''}>${e(item.name)}</option>`).join('')}</select></label><label><span>${e(t('PCB 名称', 'PCB Name'))}</span><input name="name" required value="${e(currentPcb?.name || '')}" /></label><label><span>${e(t('版本号', 'Version'))}</span><input name="version" value="${e(currentPcb?.version || '')}" /></label><label><span>${e(t('项目用板数量', 'Board Qty'))}</span><input name="boardQuantity" type="number" min="1" step="1" value="${e(currentPcb?.boardQuantity || 1)}" /></label><label><span>${e(t('备注', 'Note'))}</span><textarea name="note">${e(currentPcb?.note || '')}</textarea></label><div class="inline-actions"><button class="primary-button" type="submit">${e(currentPcb ? t('更新', 'Update') : t('新增', 'Create'))}</button>${currentPcb ? `<button class="ghost-button" type="button" data-action="cancel-pcb">${e(t('取消', 'Cancel'))}</button>` : ''}</div></form></article></section><section class="panel-card"><div class="section-head"><h2>${e(t('需求统计', 'Requirement Summary'))}</h2><div class="inline-actions">${featureEnabled('enableProjectBatchImport') ? `<button class="ghost-button" type="button" data-action="import-eda-project-bom">${e(t('同步当前工程全部 PCB', 'Sync All PCB from Current Project'))}</button>` : ''}<select data-filter="project-filter"><option value="all">${e(t('全部项目', 'All Projects'))}</option>${sort(state.db.projects, (item) => item.name).map((item) => `<option value="${item.id}" ${state.projectFilter === item.id ? 'selected' : ''}>${e(item.name)}</option>`).join('')}</select></div></div><div class="table-wrap"><table><thead><tr><th>${e(t('类型', 'Type'))}</th><th>${e(t('型号', 'Model'))}</th><th>${e(t('总需求', 'Demand'))}</th><th>${e(t('涉及 PCB', 'PCB'))}</th></tr></thead><tbody>${Array.from(summary.entries()).sort((a, b) => (cMap.get(a[0])?.model || '').localeCompare(cMap.get(b[0])?.model || '', locale())).map(([componentId, info]) => `<tr><td>${e(tMap.get(cMap.get(componentId)?.typeId)?.name || t('未知类型', 'Unknown Type'))}</td><td>${e(cMap.get(componentId)?.model || t('未知元器件', 'Unknown Component'))}</td><td>${info.total}</td><td>${e(Array.from(info.names).join(t('，', ', ')))}</td></tr>`).join('') || `<tr><td colspan="4" class="empty-state">${e(t('暂无统计数据。', 'No summary data.'))}</td></tr>`}</tbody></table></div></section><section class="panel-card"><h2>${e(t('项目与 PCB', 'Projects and PCB'))}</h2><div class="stack-list">${sort(state.db.projects.filter((item) => state.projectFilter === 'all' || item.id === state.projectFilter), (item) => item.name).map((project) => `<article class="entity-card"><header class="entity-header"><div><h3>${e(project.name)}</h3><p>${e(project.note || t('无项目备注', 'No note'))}</p></div><div class="inline-actions"><button class="ghost-button" type="button" data-action="edit-project" data-id="${project.id}">${e(t('编辑', 'Edit'))}</button><button class="danger-button" type="button" data-action="delete-project" data-id="${project.id}">${e(t('删除', 'Delete'))}</button></div></header><div class="stack-list nested-list">${sort(state.db.pcbs.filter((item) => item.projectId === project.id), (item) => `${item.name}${item.version}`).map((pcb) => `<div class="list-row"><div><strong>${e(`${pcb.name}${pcb.version ? ` (${pcb.version})` : ''}`)}</strong><p>${e(t(`项目数量 ${pcb.boardQuantity} / BOM ${pcb.items.length}`, `Qty ${pcb.boardQuantity} / BOM ${pcb.items.length}`))}</p>${pcb.sourcePcbUuid ? `<p class="support-text">${e(`${t('关联 EDA PCB', 'Linked EDA PCB')}: ${pcb.sourceBoardName ? `${pcb.sourceBoardName} / ` : ''}${pcb.sourcePcbName || pcb.name}`)}</p>` : ''}</div><div class="inline-actions"><button class="primary-button" type="button" data-action="bom-modal" data-pcb-id="${pcb.id}">${e(t('维护 BOM', 'Manage BOM'))}</button>${featureEnabled('enableOpenSourcePcb') && pcb.sourcePcbUuid ? `<button class="ghost-button" type="button" data-action="open-source-pcb" data-pcb-id="${pcb.id}">${e(t('打开对应 PCB', 'Open Source PCB'))}</button>` : ''}<button class="ghost-button" type="button" data-action="edit-pcb" data-id="${pcb.id}">${e(t('编辑', 'Edit'))}</button><button class="danger-button" type="button" data-action="delete-pcb" data-id="${pcb.id}">${e(t('删除', 'Delete'))}</button></div></div>`).join('') || `<p class="empty-state">${e(t('暂无 PCB。', 'No PCB.'))}</p>`}</div></article>`).join('') || `<p class="empty-state">${e(t('暂无项目数据。', 'No project data.'))}</p>`}</div></section>`;
	}
	

	function purchaseView() {
		const tMap = typeMap();
		const pMap = projectMap();
		const cMap = new Map(state.db.components.map((item) => [item.id, item]));

		const scope = state.purchase.scope === 'pcb' ? 'pcb' : 'project';
		const projectId = state.purchase.projectId || 'all';
		const pcbId = state.purchase.pcbId || 'all';
		const shortageOnly = Boolean(state.purchase.shortageOnly);

		const pcbsByProject =
			projectId === 'all' ? state.db.pcbs : state.db.pcbs.filter((item) => item.projectId === projectId);

		const pcbsForCalc = (() => {
			if (scope === 'pcb') {
				if (pcbId === 'all') return pcbsByProject;
				return pcbsByProject.filter((item) => item.id === pcbId);
			}
			// project scope
			return pcbsByProject;
		})();

		const required = new Map();
		const usedBy = new Map();
		for (const pcb of pcbsForCalc) {
			const pcbLabel = `${pMap.get(pcb.projectId)?.name || t('未知项目', 'Unknown Project')}/${pcb.name}${pcb.version ? `(${pcb.version})` : ''}`;
			for (const item of pcb.items) {
				const qty = Number(item.quantityPerBoard || 0) * Number(pcb.boardQuantity || 1);
				if (!required.has(item.componentId)) required.set(item.componentId, 0);
				required.set(item.componentId, required.get(item.componentId) + qty);
				if (!usedBy.has(item.componentId)) usedBy.set(item.componentId, new Set());
				usedBy.get(item.componentId).add(pcbLabel);
			}
		}

		const lines = Array.from(required.entries())
			.map(([componentId, req]) => {
				const component = cMap.get(componentId) || null;
				const inStock = component ? Number(component.totalQuantity || 0) : 0;
				const shortage = Math.max(0, Number(req || 0) - inStock);
				const unit = component && typeof component.lowestPrice === 'number' ? component.lowestPrice : null;
				return {
					componentId,
					typeName: component ? tMap.get(component.typeId)?.name || t('未知类型', 'Unknown Type') : t('未知类型', 'Unknown Type'),
					model: component ? component.model : t('未知元器件', 'Unknown Component'),
					required: Number(req || 0),
					inStock,
					shortage,
					unitPrice: unit,
					amount: unit === null ? null : unit * shortage,
					pcbs: Array.from(usedBy.get(componentId) || []),
				};
			})
			.filter((row) => (shortageOnly ? row.shortage > 0 : true))
			.sort((a, b) => a.model.localeCompare(b.model, locale()));

		const totalRequired = lines.reduce((sum, row) => sum + row.required, 0);
		const totalShortage = lines.reduce((sum, row) => sum + row.shortage, 0);
		const totalAmount = lines.reduce((sum, row) => sum + (row.amount || 0), 0);

		const projectOptions = `<option value="all">${e(t('全部项目', 'All Projects'))}</option>` +
			sort(state.db.projects, (item) => item.name)
				.map((item) => `<option value="${item.id}" ${projectId === item.id ? 'selected' : ''}>${e(item.name)}</option>`)
				.join('');

		const pcbOptions = `<option value="all">${e(scope === 'pcb' ? t('全部 PCB（当前项目过滤）', 'All PCBs (project filter)') : t('全部 PCB', 'All PCBs'))}</option>` +
			sort(pcbsByProject, (item) => `${pMap.get(item.projectId)?.name || ''}${item.name}${item.version}`)
				.map((item) => {
					const label = `${pMap.get(item.projectId)?.name || t('未知项目', 'Unknown Project')}/${item.name}${item.version ? ` (${item.version})` : ''}`;
					return `<option value="${item.id}" ${pcbId === item.id ? 'selected' : ''}>${e(label)}</option>`;
				})
				.join('');

		const head = `<section class="panel-card"><div class="section-head"><h2>${e(t('采购清单', 'Purchase List'))}</h2><div class="inline-actions"><button class="ghost-button" type="button" data-action="purchase-export-json">${e(t('导出 JSON', 'Export JSON'))}</button><button class="ghost-button" type="button" data-action="purchase-export-csv">${e(t('导出 CSV', 'Export CSV'))}</button></div></div><div class="card-grid two-col"><div class="stack-form"><label><span>${e(t('范围', 'Scope'))}</span><select data-filter="purchase-scope"><option value="project" ${scope === 'project' ? 'selected' : ''}>${e(t('按项目汇总', 'By Project'))}</option><option value="pcb" ${scope === 'pcb' ? 'selected' : ''}>${e(t('按 PCB', 'By PCB'))}</option></select></label><label><span>${e(t('项目筛选', 'Project Filter'))}</span><select data-filter="purchase-project">${projectOptions}</select></label><label><span>${e(t('PCB 筛选', 'PCB Filter'))}</span><select data-filter="purchase-pcb" ${scope === 'project' ? 'disabled' : ''}>${pcbOptions}</select></label><label class="checkbox-row"><input data-filter="purchase-shortage-only" type="checkbox" ${shortageOnly ? 'checked' : ''} /><span>${e(t('仅显示缺口', 'Shortage only'))}</span></label></div><div class="stack-form"><label><span>${e(t('统计', 'Summary'))}</span><div class="meta-grid"><div><span>${e(t('需求合计', 'Total Required'))}</span><strong>${totalRequired}</strong></div><div><span>${e(t('缺口合计', 'Total Shortage'))}</span><strong>${totalShortage}</strong></div><div><span>${e(t('预计金额', 'Est. Amount'))}</span><strong>${lines.some((r) => r.amount !== null) ? `¥${totalAmount.toFixed(2)}` : '-'}</strong></div></div></label><p class="support-text">${e(t('说明：缺口=需求-库存(小于0按0计)；预计金额使用“最低单价”估算。', 'Note: shortage = required - in-stock (min 0). Estimated amount uses lowest unit price.'))}</p></div></div></section>`;

		const table = `<section class="panel-card"><h2>${e(t('清单明细', 'Line Items'))}</h2><div class="table-wrap"><table><thead><tr><th>${e(t('类型', 'Type'))}</th><th>${e(t('型号', 'Model'))}</th><th>${e(t('需求', 'Required'))}</th><th>${e(t('库存', 'In Stock'))}</th><th>${e(t('缺口', 'Shortage'))}</th><th>${e(t('最低单价', 'Unit'))}</th><th>${e(t('预计金额', 'Amount'))}</th><th>${e(t('涉及 PCB', 'PCBs'))}</th></tr></thead><tbody>${lines.map((row) => `<tr><td>${e(row.typeName)}</td><td>${e(row.model)}</td><td>${row.required}</td><td>${row.inStock}</td><td><strong>${row.shortage}</strong></td><td>${row.unitPrice === null ? '-' : `¥${row.unitPrice.toFixed(2)}`}</td><td>${row.amount === null ? '-' : `¥${row.amount.toFixed(2)}`}</td><td>${e(row.pcbs.join(t('，', ', ')))}</td></tr>`).join('') || `<tr><td colspan="8" class="empty-state">${e(t('当前范围内没有可生成的采购清单。', 'No purchase lines for current scope.'))}</td></tr>`}</tbody></table></div></section>`;

		return head + table;
	}

	function storesView() {
		const current = active('stores', state.editingStoreId);
		return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(current ? t('编辑店铺', 'Edit Store') : t('新增店铺', 'New Store'))}</h2><form id="store-form" class="stack-form"><input type="hidden" name="storeId" value="${e(current?.id || '')}" /><label><span>${e(t('平台', 'Platform'))}</span><input name="platform" required value="${e(current?.platform || '')}" /></label><label><span>${e(t('店铺名称', 'Store Name'))}</span><input name="shopName" required value="${e(current?.shopName || '')}" /></label><label><span>${e(t('质量评分', 'Quality'))}</span><input name="qualityScore" type="number" min="0" max="5" step="0.1" value="${e(current?.qualityScore || 5)}" /></label><label><span>${e(t('价格评分', 'Price'))}</span><input name="priceScore" type="number" min="0" max="5" step="0.1" value="${e(current?.priceScore || 5)}" /></label><label><span>${e(t('邮费', 'Shipping'))}</span><input name="shippingFee" type="number" min="0" step="0.01" value="${e(current?.shippingFee || 0)}" /></label><label><span>${e(t('参考价格', 'Reference Price'))}</span><input name="referencePrice" type="number" min="0" step="0.01" value="${e(current?.referencePrice || 0)}" /></label><label><span>${e(t('主卖品', 'Products'))}</span><textarea name="mainProducts">${e(current?.mainProducts || '')}</textarea></label><label><span>${e(t('备注', 'Note'))}</span><textarea name="note">${e(current?.note || '')}</textarea></label><div class="inline-actions"><button class="primary-button" type="submit">${e(current ? t('更新', 'Update') : t('新增', 'Create'))}</button>${current ? `<button class="ghost-button" type="button" data-action="cancel-store">${e(t('取消', 'Cancel'))}</button>` : ''}</div></form></article><article class="panel-card"><h2>${e(t('店铺列表', 'Store List'))}</h2><div class="stack-list">${sort(state.db.stores, (item) => `${item.platform}${item.shopName}`).map((item) => `<div class="list-row"><div><strong>${e(`${item.platform} / ${item.shopName}`)}</strong><p>${e(`Q ${item.qualityScore.toFixed(1)} / P ${item.priceScore.toFixed(1)} / ¥${item.referencePrice.toFixed(2)}`)}</p>${item.mainProducts ? `<p>${e(item.mainProducts)}</p>` : ''}</div><div class="inline-actions"><button class="ghost-button" type="button" data-action="edit-store" data-id="${item.id}">${e(t('编辑', 'Edit'))}</button><button class="danger-button" type="button" data-action="delete-store" data-id="${item.id}">${e(t('删除', 'Delete'))}</button></div></div>`).join('') || `<p class="empty-state">${e(t('暂无店铺数据。', 'No store data.'))}</p>`}</div></article></section>`;
	}

	function settingsView() {
		const features = { ...defaultFeatureFlags(), ...(state.prefs.features || {}) };
		const toggleRow = (name, labelZh, labelEn, descZh, descEn) => `<div class="stack-list"><label class="checkbox-row"><input type="checkbox" name="${name}" ${features[name] ? 'checked' : ''} /><span>${e(t(labelZh, labelEn))}</span></label><p class="support-text">${e(t(descZh, descEn))}</p></div>`;
		return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(t('界面偏好', 'Preferences'))}</h2><form id="prefs-form" class="stack-form"><label><span>${e(t('语言', 'Language'))}</span><select name="lang"><option value="zh" ${state.prefs.lang === 'zh' ? 'selected' : ''}>中文</option><option value="en" ${state.prefs.lang === 'en' ? 'selected' : ''}>English</option></select></label><label><span>${e(t('主题', 'Theme'))}</span><select name="theme"><option value="light" ${state.prefs.theme === 'light' ? 'selected' : ''}>${e(t('亮色', 'Light'))}</option><option value="dark" ${state.prefs.theme === 'dark' ? 'selected' : ''}>${e(t('暗色', 'Dark'))}</option></select></label><div class="subsection-head"><h3>${e(t('EDA 集成功能', 'EDA Integration'))}</h3></div>${toggleRow('showEdaSnapshot', '显示当前工程快照卡片', 'Show current design snapshot', '在首页显示当前工程、PCB、板子信息和刷新入口。', 'Show current project, PCB, board info and refresh actions on the dashboard.')}${toggleRow('enableCurrentPcbImport', '启用当前 PCB BOM 导入', 'Enable current PCB BOM import', '保留“从当前工程导入 BOM”和“导入当前 PCB BOM”入口。', 'Keep the current-PCB BOM import actions available.')}${toggleRow('enableProjectBatchImport', '启用整工程批量导入', 'Enable project batch import', '保留“整工程批量导入”入口，可同步当前工程下全部 PCB。', 'Keep the batch-import action to sync all PCB under the current project.')}${toggleRow('enableOpenSourcePcb', '启用“打开对应 PCB”', 'Enable open source PCB action', '在项目页为已关联宿主 PCB 的记录显示“一键打开对应 PCB”。', 'Show the one-click open action for PCB entries linked to JLCEDA documents.')}${toggleRow('enableReportsView', '启用报告页面', 'Enable reports view', '显示工程快照、报告历史以及报告导出能力。', 'Show engineering reports, history, and report export actions.')}${toggleRow('enableExportHub', '启用导出中心', 'Enable export hub', '显示制造导出中心，统一导出 BOM/Gerber/坐标/3D/网表等资料。', 'Show the manufacture export hub for BOM, Gerber, Pick&Place, 3D, and netlist outputs.')}${toggleRow('enableCanvasTools', '启用画布工具', 'Enable canvas tools', '显示适应、框选、截图等画布辅助动作。', 'Show fit, marker, and capture tools for the active canvas.')}${toggleRow('autoLoadEdaSnapshot', '启动时自动读取工程快照', 'Auto load snapshot on startup', '插件打开时自动尝试读取当前工程上下文；失败时可手动刷新。', 'Try to read the current design context when the plugin opens; you can still refresh manually if it fails.')}<div class="subsection-head"><h3>${e(t('页面功能', 'Views'))}</h3></div>${toggleRow('enablePurchaseView', '启用采购清单页面', 'Enable purchase view', '显示采购清单导航、快捷入口和导出能力。', 'Show the purchase list page, shortcuts and export actions.')}${toggleRow('enableStoresView', '启用店铺页面', 'Enable stores view', '显示店铺维护页面，便于管理供应商与采购记录。', 'Show the stores page for supplier and purchase-record management.')}<button class="primary-button" type="submit">${e(t('保存偏好', 'Save'))}</button></form></article><article class="panel-card"><h2>${e(t('插件存储', 'Plugin Storage'))}</h2><ul class="info-list"><li>${e(t(`当前共 ${state.db.types.length} 个类型、${state.db.components.length} 个元器件、${state.db.projects.length} 个项目。`, `Current totals: ${state.db.types.length} types, ${state.db.components.length} components, ${state.db.projects.length} projects.`))}</li><li>${e(t(`已记录 ${state.reportHistory.length} 条工程报告/导出历史。`, `Stored ${state.reportHistory.length} report/export history entries.`))}</li><li>${e(t(`当前导出预设：BOM ${state.exportPrefs.bomFileType.toUpperCase()} / P&P ${state.exportPrefs.pickPlaceFileType.toUpperCase()} / 3D ${state.exportPrefs.modelFileType.toUpperCase()}`, `Current export presets: BOM ${state.exportPrefs.bomFileType.toUpperCase()} / P&P ${state.exportPrefs.pickPlaceFileType.toUpperCase()} / 3D ${state.exportPrefs.modelFileType.toUpperCase()}`))}</li><li>${e(t('窗口标题栏已支持最大化与最小化；窗口最小化后，再点击插件菜单可恢复。', 'The window title bar now supports maximize and minimize. Click the plugin menu again to restore a minimized window.'))}</li></ul><div class="inline-actions"><button class="ghost-button" data-action="import">${e(t('导入', 'Import'))}</button><button class="ghost-button" data-action="export-json">${e(t('导出 JSON', 'Export JSON'))}</button><button class="ghost-button" data-action="export-xlsx">${e(t('导出 Excel(.xlsx)', 'Export Excel (.xlsx)'))}</button><button class="ghost-button" data-action="view" data-view="reports">${e(t('查看报告', 'Open Reports'))}</button><button class="danger-button" data-action="reset">${e(t('重置数据', 'Reset Data'))}</button></div></article></section>`;
	}

	function modal() {
		if (!state.modal) return '';
		if (state.modal.type === 'xlsx-map') return xlsxMapModal();
		if (state.modal.type === 'record') return recordModal();
		if (state.modal.type === 'bom') return bomModal();
		return '';
	}

	function xlsxMapModal() {
		const workbook = state.modal.workbook;
		const sheetName = state.modal.sheetName;
		const targetKind = state.modal.targetKind;
		const sheetNames = workbook?.sheets?.map((sheet) => sheet.name) || [];
		const currentSheet = workbook?.sheets?.find((sheet) => sheet.name === sheetName) || null;
		const headers = (currentSheet?.rows?.[0] || []).map((item) => String(item || '').trim()).filter(Boolean);
		const options = (value) => `<option value="${e(value)}">${e(value)}</option>`;
		const mapRow = (idValue, labelZh, labelEn, required) => {
			return `<label><span>${e(t(labelZh, labelEn))}${required ? ' *' : ''}</span><select name="${e(idValue)}"><option value="">${e(t('不映射', 'Ignore'))}</option>${headers.map(options).join('')}</select></label>`;
		};

		return `<div class="modal-backdrop" data-action="close-modal"><div class="modal-panel wide-panel" data-modal-root="true"><div class="section-head"><h2>${e(t('Excel 导入映射', 'Excel Import Mapping'))}</h2><button class="ghost-button" type="button" data-action="close-modal">${e(t('关闭', 'Close'))}</button></div><form id="xlsx-map-form" class="stack-form"><div class="card-grid two-col"><label><span>${e(t('选择工作表', 'Worksheet'))}</span><select name="sheetName" data-xlsx-map="sheet">${sheetNames.map((name) => `<option value="${e(name)}" ${name === sheetName ? 'selected' : ''}>${e(name)}</option>`).join('')}</select></label><label><span>${e(t('导入为', 'Import As'))}</span><select name="targetKind" data-xlsx-map="target"><option value="components" ${targetKind === 'components' ? 'selected' : ''}>${e(t('元器件列表', 'Components'))}</option><option value="types" ${targetKind === 'types' ? 'selected' : ''}>${e(t('类型列表', 'Types'))}</option><option value="projects" ${targetKind === 'projects' ? 'selected' : ''}>${e(t('项目列表', 'Projects'))}</option><option value="stores" ${targetKind === 'stores' ? 'selected' : ''}>${e(t('店铺列表', 'Stores'))}</option></select></label></div>${currentSheet ? `<div class="card-grid two-col">${targetKind === 'components' ? `${mapRow('typeName', '类型列', 'Type column', true)}${mapRow('model', '型号列', 'Model column', true)}${mapRow('auxInfo', '辅助信息列', 'Aux info column', false)}${mapRow('note', '备注列', 'Note column', false)}${mapRow('warningThreshold', '预警阈值列', 'Warning threshold column', false)}` : ''}${targetKind === 'types' ? `${mapRow('name', '类型名称列', 'Type name column', true)}${mapRow('primaryName', '一级类型列', 'Primary type column', false)}${mapRow('secondaryName', '二级类型列', 'Secondary type column', false)}` : ''}${targetKind === 'projects' ? `${mapRow('name', '项目名称列', 'Project name column', true)}${mapRow('note', '备注列', 'Note column', false)}` : ''}${targetKind === 'stores' ? `${mapRow('platform', '平台列', 'Platform column', true)}${mapRow('shopName', '店铺名称列', 'Shop name column', true)}${mapRow('qualityScore', '质量评分列', 'Quality score column', false)}${mapRow('priceScore', '价格评分列', 'Price score column', false)}${mapRow('shippingFee', '邮费列', 'Shipping fee column', false)}${mapRow('referencePrice', '参考价格列', 'Reference price column', false)}${mapRow('mainProducts', '主卖品列', 'Main products column', false)}${mapRow('note', '备注列', 'Note column', false)}` : ''}</div>` : `<p class="empty-state">${e(t('未找到可用工作表。', 'No worksheet found.'))}</p>`}<button class="primary-button" type="submit">${e(t('开始导入', 'Import'))}</button></form></div></div>`;
	}

	function recordModal() {
		const component = state.db.components.find((item) => item.id === state.modal.componentId);
		if (!component) return '';
		const record = state.modal.recordId ? component.records.find((item) => item.id === state.modal.recordId) : null;
		return `<div class="modal-backdrop" data-action="close-modal"><div class="modal-panel" data-modal-root="true"><div class="section-head"><h2>${e(record ? t('编辑采购记录', 'Edit Record') : t('新增采购记录', 'Add Record'))}</h2><button class="ghost-button" type="button" data-action="close-modal">${e(t('关闭', 'Close'))}</button></div><form id="record-form" class="stack-form"><input type="hidden" name="componentId" value="${component.id}" /><input type="hidden" name="recordId" value="${e(record?.id || '')}" /><label><span>${e(t('关联店铺', 'Linked Store'))}</span><select name="storeId"><option value="">${e(t('不关联店铺', 'No linked store'))}</option>${sort(state.db.stores, (item) => `${item.platform}${item.shopName}`).map((item) => `<option value="${item.id}" ${record?.storeId === item.id ? 'selected' : ''}>${e(`${item.platform} / ${item.shopName}`)}</option>`).join('')}</select></label><label><span>${e(t('平台', 'Platform'))}</span><input name="platform" required value="${e(record?.platform || '')}" /></label><label><span>${e(t('购买链接', 'Link'))}</span><input name="link" required value="${e(record?.link || '')}" /></label><label><span>${e(t('数量', 'Quantity'))}</span><input name="quantity" type="number" min="1" step="1" required value="${e(record?.quantity || 1)}" /></label><label><span>${e(t('单价', 'Unit Price'))}</span><input name="pricePerUnit" type="number" min="0" step="0.01" required value="${e(record?.pricePerUnit || 0)}" /></label><button class="primary-button" type="submit">${e(record ? t('保存', 'Save') : t('新增', 'Add'))}</button></form></div></div>`;
	}

	function bomModal() {
		const pcb = state.db.pcbs.find((item) => item.id === state.modal.pcbId);
		if (!pcb) return '';
		const current = state.modal.itemId ? pcb.items.find((item) => item.id === state.modal.itemId) : null;
		const cMap = new Map(state.db.components.map((item) => [item.id, item]));
		const tMap = typeMap();
		return `<div class="modal-backdrop" data-action="close-modal"><div class="modal-panel wide-panel" data-modal-root="true"><div class="section-head"><h2>${e(current ? t('编辑 BOM 明细', 'Edit BOM Item') : t('新增 BOM 明细', 'Add BOM Item'))}</h2><button class="ghost-button" type="button" data-action="close-modal">${e(t('关闭', 'Close'))}</button></div><form id="bom-form" class="stack-form"><input type="hidden" name="pcbId" value="${pcb.id}" /><input type="hidden" name="itemId" value="${e(current?.id || '')}" /><label><span>${e(t('元器件', 'Component'))}</span><select name="componentId" required><option value="">${e(t('请选择元器件', 'Select Component'))}</option>${sort(state.db.components, (item) => item.model).map((item) => `<option value="${item.id}" ${current?.componentId === item.id ? 'selected' : ''}>${e(`${tMap.get(item.typeId)?.name || t('未知类型', 'Unknown Type')} / ${item.model}`)}</option>`).join('')}</select></label><label><span>${e(t('单板需求数量', 'Qty per Board'))}</span><input name="quantityPerBoard" type="number" min="1" step="1" required value="${e(current?.quantityPerBoard || 1)}" /></label><button class="primary-button" type="submit">${e(current ? t('保存', 'Save') : t('新增', 'Add'))}</button></form><div class="table-wrap"><table><thead><tr><th>${e(t('类型', 'Type'))}</th><th>${e(t('型号', 'Model'))}</th><th>${e(t('单板需求', 'Per Board'))}</th><th>${e(t('项目总需求', 'Project Total'))}</th><th>${e(t('操作', 'Actions'))}</th></tr></thead><tbody>${sort(pcb.items, (item) => cMap.get(item.componentId)?.model || '').map((item) => `<tr><td>${e(tMap.get(cMap.get(item.componentId)?.typeId)?.name || t('未知类型', 'Unknown Type'))}</td><td>${e(cMap.get(item.componentId)?.model || t('未知元器件', 'Unknown Component'))}</td><td>${item.quantityPerBoard}</td><td>${item.quantityPerBoard * pcb.boardQuantity}</td><td><div class="inline-actions"><button class="ghost-button" type="button" data-action="bom-modal" data-pcb-id="${pcb.id}" data-item-id="${item.id}">${e(t('编辑', 'Edit'))}</button><button class="danger-button" type="button" data-action="delete-bom-item" data-pcb-id="${pcb.id}" data-item-id="${item.id}">${e(t('删除', 'Delete'))}</button></div></td></tr>`).join('') || `<tr><td colspan="5" class="empty-state">${e(t('暂无 BOM 明细。', 'No BOM items.'))}</td></tr>`}</tbody></table></div></div></div>`;
	}

	function jsonText() {
		return `${JSON.stringify(state.db, null, 2)}\n`;
	}
	function excelText() {
		const tMap = typeMap();
		const pMap = projectMap();
		const sMap = storeMap();
		const table = (title, headers, rows) => `<h2>${e(title)}</h2><table><thead><tr>${headers.map((item) => `<th>${e(item)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((item) => `<td>${e(item)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
		return `\uFEFF<html><head><meta charset="utf-8" /><style>body{font-family:"Microsoft YaHei",sans-serif}table{border-collapse:collapse;width:100%;margin-bottom:14px}th,td{border:1px solid #ccd4e4;padding:6px 8px;font-size:12px}th{background:#edf2ff}</style></head><body>${table('类型', ['id', '名称', '一级类型', '二级类型'], state.db.types.map((item) => [item.id, item.name, item.primaryName, item.secondaryName || '']))}${table('项目', ['id', '名称', '备注'], state.db.projects.map((item) => [item.id, item.name, item.note]))}${table('元器件', ['id', '类型', '型号', '总库存', '预警阈值', '最低价格'], state.db.components.map((item) => [item.id, tMap.get(item.typeId)?.name || '未知类型', item.model, item.totalQuantity, item.warningThreshold, item.lowestPrice ?? '']))}${table('采购记录', ['记录id', '元器件', '店铺', '平台', '数量', '单价', '时间'], state.db.components.flatMap((component) => component.records.map((record) => [record.id, component.model, record.storeId ? `${sMap.get(record.storeId)?.platform || ''}/${sMap.get(record.storeId)?.shopName || ''}` : '-', record.platform, record.quantity, record.pricePerUnit, record.purchasedAt])))}${table('PCB', ['id', '项目', 'PCB', '版本', '数量'], state.db.pcbs.map((item) => [item.id, pMap.get(item.projectId)?.name || '未知项目', item.name, item.version, item.boardQuantity]))}</body></html>`;
	}

	function parseCsv(text) {
		const split = (line) => { const result = []; let current = ''; let quoted = false; for (let i = 0; i < line.length; i += 1) { const char = line[i]; if (char === '"') { if (quoted && line[i + 1] === '"') { current += '"'; i += 1; } else { quoted = !quoted; } } else if (char === ',' && !quoted) { result.push(current.trim()); current = ''; } else { current += char; } } result.push(current.trim()); return result; };
		const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
		if (lines.length < 2) return [];
		const headers = split(lines[0]);
		return lines.slice(1).map((line) => { const values = split(line); const row = {}; headers.forEach((header, index) => { row[header] = values[index] || ''; }); return row; });
	}

	function importItems(items) {
		let count = 0;
		items.forEach((item) => {
			const typeName = String(item.typeName || item.type || '').trim();
			const model = String(item.model || '').trim();
			if (!typeName || !model) return;
			let type = state.db.types.find((entry) => entry.name.toLowerCase() === typeName.toLowerCase());
			if (!type) {
				type = nType({ id: id(), name: typeName, primaryName: typeName.split('/')[0], secondaryName: typeName.split('/')[1] || '', createdAt: iso(), updatedAt: iso() });
				state.db.types.push(type);
			}
			let component = state.db.components.find((entry) => entry.typeId === type.id && entry.model.toLowerCase() === model.toLowerCase());
			if (!component) {
				component = nComponent({ id: id(), typeId: type.id, model, auxInfo: item.auxInfo || '', note: item.note || '', warningThreshold: Number(item.warningThreshold || 0), records: [], createdAt: iso(), updatedAt: iso() });
				state.db.components.push(component);
			}
			(item.records || []).forEach((record) => { component.records.push(nRecord({ id: id(), platform: record.platform || '', link: record.link || '', quantity: Number(record.quantity || 0), pricePerUnit: Number(record.pricePerUnit || 0), purchasedAt: iso(), createdAt: iso(), updatedAt: iso() })); });
			component.auxInfo = String(item.auxInfo || component.auxInfo || '').trim();
			component.note = String(item.note || component.note || '').trim();
			component.warningThreshold = Number(item.warningThreshold || component.warningThreshold || 0);
			component.updatedAt = iso();
			const index = state.db.components.findIndex((entry) => entry.id === component.id);
			state.db.components[index] = nComponent(component);
			count += 1;
		});
		return count;
	}

	function xmlEscape(value) {
		return String(value ?? '')
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&apos;');
	}

	function colName(index1based) {
		let n = index1based;
		let out = '';
		while (n > 0) {
			const mod = (n - 1) % 26;
			out = String.fromCharCode(65 + mod) + out;
			n = Math.floor((n - 1) / 26);
		}
		return out;
	}

	function crc32Table() {
		const table = new Uint32Array(256);
		for (let i = 0; i < 256; i += 1) {
			let c = i;
			for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
			table[i] = c >>> 0;
		}
		return table;
	}

	const _crc32Table = crc32Table();
	function crc32(bytes) {
		let c = 0xffffffff;
		for (let i = 0; i < bytes.length; i += 1) c = _crc32Table[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
		return (c ^ 0xffffffff) >>> 0;
	}

	function u16(dv, off) { return dv.getUint16(off, true); }
	function u32(dv, off) { return dv.getUint32(off, true); }
	function setU16(dv, off, value) { dv.setUint16(off, value, true); }
	function setU32(dv, off, value) { dv.setUint32(off, value, true); }

	function utf8Encode(text) {
		return new TextEncoder().encode(String(text ?? ''));
	}
	function utf8Decode(bytes) {
		return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
	}

	async function inflateRaw(bytes) {
		if (typeof DecompressionStream === 'undefined') {
			throw new Error(t('当前环境不支持解压缩，无法读取普通 xlsx。请使用本插件导出的 xlsx 或将文件另存为 CSV。', 'DecompressionStream is unavailable; cannot read typical .xlsx. Use the .xlsx exported by this plugin or save as CSV.'));
		}
		const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
		const buf = await new Response(stream).arrayBuffer();
		return new Uint8Array(buf);
	}

	async function unzip(buffer) {
		const bytes = new Uint8Array(buffer);
		const dv = new DataView(buffer);
		const SIG_EOCD = 0x06054b50;
		const SIG_CDIR = 0x02014b50;
		const SIG_LFH = 0x04034b50;

		// Find End Of Central Directory (max comment length 64KB).
		let eocd = -1;
		for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i -= 1) {
			if (u32(dv, i) === SIG_EOCD) { eocd = i; break; }
		}
		if (eocd < 0) throw new Error(t('不是有效的 xlsx 文件（缺少 EOCD）。', 'Invalid .xlsx (missing EOCD).'));

		const totalEntries = u16(dv, eocd + 10);
		const cdirSize = u32(dv, eocd + 12);
		const cdirOffset = u32(dv, eocd + 16);
		if (cdirOffset + cdirSize > bytes.length) throw new Error(t('xlsx 文件已损坏（中央目录越界）。', 'Corrupted .xlsx (central directory out of range).'));

		const out = new Map();
		let off = cdirOffset;
		for (let i = 0; i < totalEntries; i += 1) {
			if (u32(dv, off) !== SIG_CDIR) throw new Error(t('xlsx 文件已损坏（中央目录签名错误）。', 'Corrupted .xlsx (bad central directory signature).'));

			const compMethod = u16(dv, off + 10);
			const crc = u32(dv, off + 16);
			const compSize = u32(dv, off + 20);
			const uncompSize = u32(dv, off + 24);
			const nameLen = u16(dv, off + 28);
			const extraLen = u16(dv, off + 30);
			const commentLen = u16(dv, off + 32);
			const localOffset = u32(dv, off + 42);
			const name = utf8Decode(bytes.slice(off + 46, off + 46 + nameLen));

			off += 46 + nameLen + extraLen + commentLen;

			// Read local file header.
			if (u32(dv, localOffset) !== SIG_LFH) throw new Error(t('xlsx 文件已损坏（本地头签名错误）。', 'Corrupted .xlsx (bad local header signature).'));
			const localNameLen = u16(dv, localOffset + 26);
			const localExtraLen = u16(dv, localOffset + 28);
			const dataStart = localOffset + 30 + localNameLen + localExtraLen;
			const dataEnd = dataStart + compSize;
			if (dataEnd > bytes.length) throw new Error(t('xlsx 文件已损坏（数据越界）。', 'Corrupted .xlsx (data out of range).'));

			const compData = bytes.slice(dataStart, dataEnd);
			let data;
			if (compMethod === 0) data = compData;
			else if (compMethod === 8) data = await inflateRaw(compData);
			else throw new Error(t(`不支持的压缩方式: ${compMethod}`, `Unsupported compression method: ${compMethod}`));

			if (data.length !== uncompSize) {
				// Some zips omit sizes in local header but central dir should be correct; still sanity check lightly.
			}
			if ((crc32(data) >>> 0) !== (crc >>> 0)) {
				throw new Error(t(`xlsx 文件已损坏（CRC 校验失败）：${name}`, `Corrupted .xlsx (CRC mismatch): ${name}`));
			}
			out.set(name, data);
		}
		return out;
	}

	function zipStore(files) {
		const encoder = new TextEncoder();
		const localParts = [];
		const centralParts = [];
		let offset = 0;

		for (const file of files) {
			const nameBytes = encoder.encode(file.name);
			const data = file.data;
			const crc = crc32(data);

			const local = new Uint8Array(30 + nameBytes.length);
			const dv = new DataView(local.buffer);
			setU32(dv, 0, 0x04034b50);
			setU16(dv, 4, 20); // version needed
			setU16(dv, 6, 0); // flags
			setU16(dv, 8, 0); // method: store
			setU16(dv, 10, 0); // time
			setU16(dv, 12, 0); // date
			setU32(dv, 14, crc);
			setU32(dv, 18, data.length);
			setU32(dv, 22, data.length);
			setU16(dv, 26, nameBytes.length);
			setU16(dv, 28, 0); // extra len
			local.set(nameBytes, 30);

			localParts.push(local, data);

			const central = new Uint8Array(46 + nameBytes.length);
			const cdv = new DataView(central.buffer);
			setU32(cdv, 0, 0x02014b50);
			setU16(cdv, 4, 20); // version made by
			setU16(cdv, 6, 20); // version needed
			setU16(cdv, 8, 0); // flags
			setU16(cdv, 10, 0); // method
			setU16(cdv, 12, 0); // time
			setU16(cdv, 14, 0); // date
			setU32(cdv, 16, crc);
			setU32(cdv, 20, data.length);
			setU32(cdv, 24, data.length);
			setU16(cdv, 28, nameBytes.length);
			setU16(cdv, 30, 0); // extra
			setU16(cdv, 32, 0); // comment
			setU16(cdv, 34, 0); // disk
			setU16(cdv, 36, 0); // int attrs
			setU32(cdv, 38, 0); // ext attrs
			setU32(cdv, 42, offset);
			central.set(nameBytes, 46);
			centralParts.push(central);

			offset += local.length + data.length;
		}

		const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
		const eocd = new Uint8Array(22);
		const edv = new DataView(eocd.buffer);
		setU32(edv, 0, 0x06054b50);
		setU16(edv, 4, 0);
		setU16(edv, 6, 0);
		setU16(edv, 8, files.length);
		setU16(edv, 10, files.length);
		setU32(edv, 12, centralSize);
		setU32(edv, 16, offset);
		setU16(edv, 20, 0);

		const totalSize = offset + centralSize + eocd.length;
		const out = new Uint8Array(totalSize);
		let w = 0;
		for (const part of localParts) { out.set(part, w); w += part.length; }
		for (const part of centralParts) { out.set(part, w); w += part.length; }
		out.set(eocd, w);
		return out;
	}

	function sheetXml(rows) {
		const safeRows = Array.isArray(rows) ? rows : [];
		let maxCol = 1;
		for (const row of safeRows) maxCol = Math.max(maxCol, Array.isArray(row) ? row.length : 0);
		const maxRow = Math.max(1, safeRows.length || 1);
		const dim = `A1:${colName(maxCol || 1)}${maxRow}`;

		const rowXml = safeRows.map((row, rowIndex) => {
			const r = rowIndex + 1;
			const cells = (row || []).map((value, colIndex) => {
				if (value === null || value === undefined || value === '') return '';
				const ref = `${colName(colIndex + 1)}${r}`;
				if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${ref}"><v>${value}</v></c>`;
				const text = String(value);
				const preserve = /^\s|\s$/.test(text) ? ' xml:space="preserve"' : '';
				return `<c r="${ref}" t="inlineStr"><is><t${preserve}>${xmlEscape(text)}</t></is></c>`;
			}).filter(Boolean).join('');
			return `<row r="${r}">${cells}</row>`;
		}).join('');

		return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
			`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
			`<dimension ref="${dim}"/>` +
			`<sheetData>${rowXml}</sheetData>` +
			`</worksheet>`;
	}

	function buildXlsxWorkbook(sheets) {
		const createdAt = new Date().toISOString();
		const visibleSheets = sheets.map((sheet, index) => ({ ...sheet, index: index + 1 }));
		const workbookSheetsXml = visibleSheets.map((sheet, idx) => {
			const stateAttr = sheet.hidden ? ` state="hidden"` : '';
			return `<sheet name="${xmlEscape(sheet.name)}" sheetId="${idx + 1}" r:id="rId${idx + 1}"${stateAttr}/>`;
		}).join('');

		const workbookXml =
			`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
			`<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
			`<sheets>${workbookSheetsXml}</sheets>` +
			`</workbook>`;

		const workbookRels =
			`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
			`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
			visibleSheets.map((sheet, idx) => `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`).join('') +
			`<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
			`</Relationships>`;

		const rootRels =
			`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
			`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
			`<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
			`<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>` +
			`<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>` +
			`</Relationships>`;

		const stylesXml =
			`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
			`<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
			`<fonts count="1"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font></fonts>` +
			`<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
			`<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
			`<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
			`<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>` +
			`<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
			`</styleSheet>`;

		const contentTypes =
			`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
			`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
			`<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
			`<Default Extension="xml" ContentType="application/xml"/>` +
			`<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
			visibleSheets.map((sheet, idx) => `<Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
			`<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
			`<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
			`<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>` +
			`</Types>`;

		const coreXml =
			`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
			`<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
			`<dc:title>bom-manager</dc:title>` +
			`<dc:creator>bom-manager</dc:creator>` +
			`<cp:lastModifiedBy>bom-manager</cp:lastModifiedBy>` +
			`<dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created>` +
			`<dcterms:modified xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:modified>` +
			`</cp:coreProperties>`;

		const appXml =
			`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
			`<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">` +
			`<Application>bom-manager</Application>` +
			`</Properties>`;

		const files = [
			{ name: '[Content_Types].xml', data: utf8Encode(contentTypes) },
			{ name: '_rels/.rels', data: utf8Encode(rootRels) },
			{ name: 'docProps/core.xml', data: utf8Encode(coreXml) },
			{ name: 'docProps/app.xml', data: utf8Encode(appXml) },
			{ name: 'xl/workbook.xml', data: utf8Encode(workbookXml) },
			{ name: 'xl/_rels/workbook.xml.rels', data: utf8Encode(workbookRels) },
			{ name: 'xl/styles.xml', data: utf8Encode(stylesXml) },
			...visibleSheets.map((sheet, idx) => ({ name: `xl/worksheets/sheet${idx + 1}.xml`, data: utf8Encode(sheetXml(sheet.rows)) })),
		];

		return zipStore(files);
	}

	function cellRefToColIndex(ref) {
		const m = String(ref || '').match(/[A-Z]+/i);
		if (!m) return 0;
		const letters = m[0].toUpperCase();
		let n = 0;
		for (let i = 0; i < letters.length; i += 1) n = n * 26 + (letters.charCodeAt(i) - 64);
		return n - 1;
	}

	function parseSharedStrings(xmlText) {
		const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
		const out = [];
		const items = doc.getElementsByTagName('si');
		for (const si of items) {
			const texts = Array.from(si.getElementsByTagName('t')).map((tNode) => tNode.textContent || '');
			out.push(texts.join(''));
		}
		return out;
	}

	function parseSheetXml(xmlText, sharedStrings) {
		const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
		const sheetData = doc.getElementsByTagName('sheetData')[0];
		if (!sheetData) return [];
		const rows = [];
		const rowNodes = Array.from(sheetData.getElementsByTagName('row'));
		for (const rowNode of rowNodes) {
			const cells = Array.from(rowNode.getElementsByTagName('c'));
			const row = [];
			let maxCol = 0;
			for (const cell of cells) {
				const ref = cell.getAttribute('r') || '';
				const col = cellRefToColIndex(ref);
				maxCol = Math.max(maxCol, col);
				const type = cell.getAttribute('t') || '';
				let value = '';
				if (type === 's') {
					const v = cell.getElementsByTagName('v')[0]?.textContent || '';
					const idx = Number(v);
					value = sharedStrings[idx] ?? '';
				} else if (type === 'inlineStr') {
					const tNode = cell.getElementsByTagName('t')[0];
					value = tNode?.textContent || '';
				} else {
					const v = cell.getElementsByTagName('v')[0]?.textContent || '';
					value = v;
				}
				row[col] = value;
			}
			for (let i = 0; i <= maxCol; i += 1) if (row[i] === undefined) row[i] = '';
			rows.push(row);
		}
		return rows;
	}

	async function parseXlsx(file) {
		const entries = await unzip(await file.arrayBuffer());
		const getText = (name) => {
			const bytes = entries.get(name);
			return bytes ? utf8Decode(bytes) : '';
		};

		const workbookXml = getText('xl/workbook.xml');
		if (!workbookXml) throw new Error(t('xlsx 文件缺少 workbook.xml。', 'Missing xl/workbook.xml.'));
		const workbookDoc = new DOMParser().parseFromString(workbookXml, 'application/xml');
		const sheetNodes = Array.from(workbookDoc.getElementsByTagName('sheet'));

		const relsXml = getText('xl/_rels/workbook.xml.rels');
		const relDoc = relsXml ? new DOMParser().parseFromString(relsXml, 'application/xml') : null;
		const rels = new Map();
		if (relDoc) {
			for (const rel of Array.from(relDoc.getElementsByTagName('Relationship'))) {
				const idValue = rel.getAttribute('Id') || '';
				const target = rel.getAttribute('Target') || '';
				if (idValue && target) rels.set(idValue, target);
			}
		}

		const sharedStrings = (() => {
			const xml = getText('xl/sharedStrings.xml');
			return xml ? parseSharedStrings(xml) : [];
		})();

		const sheets = [];
		for (const node of sheetNodes) {
			const name = node.getAttribute('name') || '';
			const stateAttr = node.getAttribute('state') || '';
			const hidden = stateAttr === 'hidden' || stateAttr === 'veryHidden';
			const rid = node.getAttribute('r:id') || '';
			const target = rels.get(rid) || '';
			const path = target ? (target.startsWith('/') ? target.slice(1) : `xl/${target}`) : '';
			const sheetXmlText = path ? getText(path) : '';
			const rows = sheetXmlText ? parseSheetXml(sheetXmlText, sharedStrings) : [];
			sheets.push({ name, hidden, rows });
		}

		return { sheets };
	}

	function isBomManagerExportXlsx(workbook) {
		const meta = workbook.sheets.find((sheet) => sheet.name === '__BOM_MANAGER__');
		if (!meta) return false;
		const first = String(meta.rows?.[0]?.[0] || '').trim();
		return first === 'bom-manager-export';
	}

	async function importBomManagerExportXlsx(workbook) {
		const dbSheet = workbook.sheets.find((sheet) => sheet.name === '__BOM_DB__');
		if (!dbSheet) throw new Error(t('未找到内置数据库工作表（__BOM_DB__）。', 'Missing embedded database sheet (__BOM_DB__).'));
		const chunks = (dbSheet.rows || []).map((row) => String(row?.[0] || '')).join('');
		if (!chunks.trim()) throw new Error(t('内置数据库为空。', 'Embedded database is empty.'));
		const parsed = JSON.parse(chunks);
		state.db = nDb(parsed);
		await saveDb();
		setStatus('success', t('xlsx 数据库已导入。', 'XLSX database imported.'));
		render();
	}

	function openXlsxMapping(workbook, fileName) {
		const firstVisible = workbook.sheets.find((sheet) => !sheet.hidden) || workbook.sheets[0] || null;
		if (!firstVisible) throw new Error(t('xlsx 内没有可用工作表。', 'No worksheet found in .xlsx.'));
		state.modal = {
			type: 'xlsx-map',
			fileName: String(fileName || ''),
			workbook,
			sheetName: firstVisible.name,
			targetKind: 'components',
		};
		render();
	}

	function pickRowValueByHeader(headers, row, headerName) {
		if (!headerName) return '';
		const idx = headers.findIndex((h) => String(h || '').trim() === String(headerName || '').trim());
		return idx >= 0 ? String(row?.[idx] ?? '').trim() : '';
	}

	async function importXlsxMapped(values) {
		if (!state.modal || state.modal.type !== 'xlsx-map') return;
		const workbook = state.modal.workbook;
		const sheetName = String(values.sheetName || state.modal.sheetName || '').trim();
		const targetKind = String(values.targetKind || state.modal.targetKind || '').trim();
		const sheet = workbook.sheets.find((item) => item.name === sheetName);
		if (!sheet) throw new Error(t('选择的工作表不存在。', 'Selected worksheet not found.'));
		const rows = sheet.rows || [];
		if (rows.length < 2) throw new Error(t('工作表没有数据行。', 'Worksheet has no data rows.'));

		const headers = (rows[0] || []).map((h) => String(h || '').trim());
		const body = rows.slice(1);

		if (targetKind === 'components') {
			const typeHeader = String(values.typeName || '').trim();
			const modelHeader = String(values.model || '').trim();
			if (!typeHeader || !modelHeader) throw new Error(t('请映射 类型列 与 型号列。', 'Please map Type column and Model column.'));

			const items = [];
			for (const row of body) {
				const typeName = pickRowValueByHeader(headers, row, typeHeader);
				const model = pickRowValueByHeader(headers, row, modelHeader);
				if (!typeName || !model) continue;
				items.push({
					typeName,
					model,
					auxInfo: pickRowValueByHeader(headers, row, String(values.auxInfo || '')),
					note: pickRowValueByHeader(headers, row, String(values.note || '')),
					warningThreshold: Number(pickRowValueByHeader(headers, row, String(values.warningThreshold || '')) || 0),
				});
			}
			const count = importItems(items);
			await saveDb();
			setStatus('success', t(`xlsx 已导入 ${count} 条元器件数据。`, `XLSX imported ${count} component entries.`));
			state.modal = null;
			render();
			return;
		}

		if (targetKind === 'types') {
			const nameHeader = String(values.name || '').trim();
			const primaryHeader = String(values.primaryName || '').trim();
			const secondaryHeader = String(values.secondaryName || '').trim();
			if (!nameHeader && !primaryHeader) throw new Error(t('请映射 类型名称列 或 一级类型列。', 'Please map Type name column or Primary type column.'));

			let count = 0;
			for (const row of body) {
				const name = nameHeader ? pickRowValueByHeader(headers, row, nameHeader) : '';
				const primaryName = primaryHeader ? pickRowValueByHeader(headers, row, primaryHeader) : '';
				const secondaryName = secondaryHeader ? pickRowValueByHeader(headers, row, secondaryHeader) : '';
				const resolved = String(name || (secondaryName ? `${primaryName}/${secondaryName}` : primaryName) || '').trim();
				if (!resolved) continue;
				if (state.db.types.some((item) => item.name.toLowerCase() === resolved.toLowerCase())) continue;
				state.db.types.push(nType({ id: id(), name: resolved, primaryName: resolved.split('/')[0], secondaryName: resolved.split('/')[1] || '', createdAt: iso(), updatedAt: iso() }));
				count += 1;
			}
			await saveDb();
			setStatus('success', t(`xlsx 已导入 ${count} 条类型数据。`, `XLSX imported ${count} types.`));
			state.modal = null;
			render();
			return;
		}

		if (targetKind === 'projects') {
			const nameHeader = String(values.name || '').trim();
			if (!nameHeader) throw new Error(t('请映射 项目名称列。', 'Please map Project name column.'));
			const noteHeader = String(values.note || '').trim();
			let count = 0;
			for (const row of body) {
				const name = pickRowValueByHeader(headers, row, nameHeader);
				if (!name) continue;
				const note = noteHeader ? pickRowValueByHeader(headers, row, noteHeader) : '';
				if (state.db.projects.some((item) => item.name.toLowerCase() === name.toLowerCase())) continue;
				state.db.projects.push(nProject({ id: id(), name, note, createdAt: iso(), updatedAt: iso() }));
				count += 1;
			}
			await saveDb();
			setStatus('success', t(`xlsx 已导入 ${count} 条项目数据。`, `XLSX imported ${count} projects.`));
			state.modal = null;
			render();
			return;
		}

		if (targetKind === 'stores') {
			const platformHeader = String(values.platform || '').trim();
			const shopHeader = String(values.shopName || '').trim();
			if (!platformHeader || !shopHeader) throw new Error(t('请映射 平台列 与 店铺名称列。', 'Please map Platform column and Shop name column.'));

			const pickNum = (row, header) => {
				const raw = header ? pickRowValueByHeader(headers, row, header) : '';
				const n = Number(raw);
				return Number.isFinite(n) ? n : 0;
			};

			let count = 0;
			for (const row of body) {
				const platform = pickRowValueByHeader(headers, row, platformHeader);
				const shopName = pickRowValueByHeader(headers, row, shopHeader);
				if (!platform || !shopName) continue;
				const key = `${platform}`.toLowerCase() + '::' + `${shopName}`.toLowerCase();
				if (state.db.stores.some((item) => `${item.platform}`.toLowerCase() + '::' + `${item.shopName}`.toLowerCase() === key)) continue;
				state.db.stores.push(nStore({
					id: id(),
					platform,
					shopName,
					qualityScore: pickNum(row, String(values.qualityScore || '')) || 5,
					priceScore: pickNum(row, String(values.priceScore || '')) || 5,
					shippingFee: pickNum(row, String(values.shippingFee || '')) || 0,
					referencePrice: pickNum(row, String(values.referencePrice || '')) || 0,
					mainProducts: pickRowValueByHeader(headers, row, String(values.mainProducts || '')),
					note: pickRowValueByHeader(headers, row, String(values.note || '')),
					createdAt: iso(),
					updatedAt: iso(),
				}));
				count += 1;
			}
			await saveDb();
			setStatus('success', t(`xlsx 已导入 ${count} 条店铺数据。`, `XLSX imported ${count} stores.`));
			state.modal = null;
			render();
			return;
		}

		throw new Error(t('不支持的导入映射类型。', 'Unsupported mapping target.'));
	}

	async function importData() {
		const file = await edaApi.sys_FileSystem.openReadFileDialog(['json', 'csv', 'xlsx', 'xls'], false);
		if (!file) return;
		const lower = String(file.name || '').toLowerCase();
		if (lower.endsWith('.json')) {
			const parsed = JSON.parse(await file.text());
			if (Array.isArray(parsed.types) && Array.isArray(parsed.components)) {
				state.db = nDb(parsed);
				await saveDb();
				setStatus('success', t('JSON 数据库已导入。', 'JSON database imported.'));
				render();
				return;
			}
			const count = importItems(Array.isArray(parsed) ? parsed : parsed.items || []);
			await saveDb();
			setStatus('success', t(`已导入 ${count} 条元器件数据。`, `Imported ${count} component entries.`));
			render();
			return;
		}
		if (lower.endsWith('.csv')) {
			const rows = parseCsv(await file.text());
			const key = (input) => String(input || '').trim().toLowerCase().replace(/[\s_\-\/()\[\]]+/g, '');
			const alias = { typeName: ['typename', 'type', '类别', '类型', '元器件类型'], model: ['model', '型号', '料号', 'partnumber', 'pn'], auxInfo: ['auxinfo', '辅助信息', '参数', '规格'], note: ['note', '备注', '说明'], warningThreshold: ['warningthreshold', '预警', '阈值'], platform: ['platform', '平台'], link: ['link', 'url', '链接'], quantity: ['quantity', 'qty', '数量'], pricePerUnit: ['priceperunit', 'price', '单价', '价格'] };
			const headers = rows.length ? Object.keys(rows[0]) : [];
			const map = {};
			Object.keys(alias).forEach((field) => { map[field] = headers.find((header) => alias[field].some((item) => key(header).includes(key(item)) || key(item).includes(key(header)))) || ''; });
			if (!map.typeName || !map.model) throw new Error(t('CSV 缺少可识别的类型或型号列。', 'CSV is missing recognizable type/model columns.'));
			const items = [];
			const grouped = new Map();
			rows.forEach((row) => {
				const pick = (field) => (map[field] ? String(row[map[field]] || '').trim() : '');
				const typeName = pick('typeName');
				const model = pick('model');
				if (!typeName || !model) return;
				const groupKey = `${typeName}::${model}`;
				if (!grouped.has(groupKey)) grouped.set(groupKey, { typeName, model, auxInfo: pick('auxInfo'), note: pick('note'), warningThreshold: Number(pick('warningThreshold') || 0), records: [] });
				if (pick('platform') && pick('link') && Number(pick('quantity') || 0) > 0) grouped.get(groupKey).records.push({ platform: pick('platform'), link: pick('link'), quantity: Number(pick('quantity') || 0), pricePerUnit: Number(pick('pricePerUnit') || 0) });
			});
			grouped.forEach((value) => items.push(value));
			const count = importItems(items);
			await saveDb();
			setStatus('success', t(`CSV 已导入 ${count} 条元器件数据。`, `CSV imported ${count} component entries.`));
			render();
			return;
		}
		if (lower.endsWith('.xlsx')) {
			const workbook = await parseXlsx(file);
			if (isBomManagerExportXlsx(workbook)) {
				await importBomManagerExportXlsx(workbook);
				return;
			}
			setStatus('info', t('检测到普通 xlsx，请先设置映射再导入。', 'Detected a generic .xlsx. Please configure mapping before importing.'));
			openXlsxMapping(workbook, file.name);
			return;
		}
		if (lower.endsWith('.xls')) {
			throw new Error(t('暂不支持导入 .xls（二进制旧格式）。请将文件另存为 .xlsx 或 .csv 后再导入。', 'Importing .xls is not supported. Please save as .xlsx or .csv and retry.'));
		}
		throw new Error(t('当前插件版本支持导入 JSON/CSV/XLSX。', 'This build supports JSON/CSV/XLSX import.'));
	}

	function normalizeHeaderKey(input) {
		return String(input || '').trim().toLowerCase().replace(/[\s_\-\/()\[\]#]+/g, '');
	}

	function findHeader(headers, candidates) {
		const normHeaders = headers.map((h) => ({ raw: h, key: normalizeHeaderKey(h) }));
		const candKeys = candidates.map(normalizeHeaderKey).filter(Boolean);
		for (const cand of candKeys) {
			const hit = normHeaders.find((h) => h.key === cand) || normHeaders.find((h) => h.key.includes(cand) || cand.includes(h.key));
			if (hit) return hit.raw;
		}
		return '';
	}

	function splitDelimitedLine(line, delimiter) {
		const result = [];
		let current = '';
		let quoted = false;
		for (let i = 0; i < line.length; i += 1) {
			const ch = line[i];
			if (ch === '"') {
				if (quoted && line[i + 1] === '"') {
					current += '"';
					i += 1;
				} else {
					quoted = !quoted;
				}
				continue;
			}
			if (!quoted && ch === delimiter) {
				result.push(current);
				current = '';
				continue;
			}
			current += ch;
		}
		result.push(current);
		return result.map((x) => String(x ?? '').trim());
	}

	function detectDelimiter(firstLine) {
		const s = String(firstLine || '');
		const comma = (s.match(/,/g) || []).length;
		const tab = (s.match(/\t/g) || []).length;
		const semi = (s.match(/;/g) || []).length;
		if (tab >= comma && tab >= semi && tab > 0) return '\t';
		if (semi >= comma && semi > 0) return ';';
		return ',';
	}

	function parseDelimitedTable(text) {
		const lines = String(text || '').split(/\r?\n/).filter((l) => l.trim().length > 0);
		if (lines.length < 2) return [];
		const delimiter = detectDelimiter(lines[0]);
		const headers = splitDelimitedLine(lines[0], delimiter);
		return lines.slice(1).map((line) => {
			const values = splitDelimitedLine(line, delimiter);
			const row = {};
			for (let i = 0; i < headers.length; i += 1) row[headers[i]] = values[i] || '';
			return row;
		});
	}

	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	function collectTabIdsFromSplitScreenTree(node, result) {
		const tabs = node?.tabs || [];
		for (const tab of tabs) {
			if (tab?.tabId) result.add(String(tab.tabId));
		}
		const children = node?.children || [];
		for (const child of children) collectTabIdsFromSplitScreenTree(child, result);
		return result;
	}
	async function getOpenTabIdSet() {
		const editorApi = edaApi?.dmt_EditorControl;
		if (!editorApi || typeof editorApi.getSplitScreenTree !== 'function') return new Set();
		try {
			const tree = await editorApi.getSplitScreenTree();
			return collectTabIdsFromSplitScreenTree(tree, new Set());
		} catch (_error) {
			return new Set();
		}
	}
	function currentProjectLabelFromInfo(projectInfo, snapshot) {
		return String(projectInfo?.friendlyName || projectInfo?.name || projectDisplayNameFromSnapshot(snapshot) || '').trim();
	}
	function currentPcbLabelFromInfo(pcbInfo, boardInfo, snapshot) {
		return String(pcbInfo?.name || boardInfo?.name || pcbDisplayNameFromSnapshot(snapshot) || '').trim();
	}
	function currentBoardLabelFromInfo(boardInfo, pcbInfo, snapshot) {
		return String(boardInfo?.name || pcbInfo?.parentBoardName || boardDisplayNameFromSnapshot(snapshot) || '').trim();
	}
	function buildEdaProjectNoteText(options) {
		const mode = options?.mode === 'project-sync' ? 'project-sync' : 'current-bom';
		const projectLabel = String(options?.projectLabel || '').trim();
		const projectName = String(options?.projectName || '').trim();
		const boardLabel = String(options?.boardLabel || '').trim();
		const pcbLabel = String(options?.pcbLabel || '').trim();
		const projectUuid = String(options?.projectUuid || '').trim();
		const description = String(options?.description || '').trim();
		const importedAt = String(options?.importedAt || '').trim();
		const lines = [
			mode === 'project-sync'
				? t('由当前 EDA 工程批量同步生成。', 'Generated by batch syncing the current EDA project.')
				: t('从当前工程一键导入 BOM 自动生成。', 'Generated by one-click BOM import.'),
		];
		if (projectLabel) lines.push(`${t('来源工程', 'Source Project')}: ${projectLabel}`);
		if (projectLabel && projectName && projectName !== projectLabel) lines.push(`${t('工程链接名', 'Project Slug')}: ${projectName}`);
		if (description) lines.push(`${t('工程描述', 'Description')}: ${description}`);
		if (boardLabel) lines.push(`${t('当前板子', 'Current Board')}: ${boardLabel}`);
		if (pcbLabel) lines.push(`${t('当前 PCB', 'Current PCB')}: ${pcbLabel}`);
		if (projectUuid) lines.push(`UUID: ${projectUuid}`);
		if (importedAt) lines.push(`${t('导入时间', 'Imported At')}: ${importedAt}`);
		return lines.join('\n');
	}
	function buildEdaPcbNoteText(options) {
		const mode = options?.mode === 'project-sync' ? 'project-sync' : 'current-bom';
		const projectLabel = String(options?.projectLabel || '').trim();
		const boardLabel = String(options?.boardLabel || '').trim();
		const pcbLabel = String(options?.pcbLabel || '').trim();
		const importedAt = String(options?.importedAt || '').trim();
		const lines = [
			mode === 'project-sync'
				? t('由当前 EDA 工程批量同步生成。', 'Generated by batch syncing the current EDA project.')
				: t('从当前工程一键导入 BOM 自动生成。', 'Generated by one-click BOM import.'),
		];
		if (projectLabel) lines.push(`${t('来源工程', 'Source Project')}: ${projectLabel}`);
		if (boardLabel) lines.push(`${t('来源板子', 'Source Board')}: ${boardLabel}`);
		if (pcbLabel) lines.push(`${t('来源 PCB', 'Source PCB')}: ${pcbLabel}`);
		if (importedAt) lines.push(`${t('导入时间', 'Imported At')}: ${importedAt}`);
		return lines.join('\n');
	}
	function groupBomRows(rows) {
		if (!rows.length) throw new Error(t('BOM 文件为空或无法解析。', 'BOM file is empty or cannot be parsed.'));
		const headers = Object.keys(rows[0] || {});
		const qtyHeader = findHeader(headers, ['Quantity', 'Qty', '数量', '用量', 'QTY']);
		const modelHeader = findHeader(headers, [
			'LCSC Part',
			'LCSC Part#',
			'LCSC Part #',
			'LCSC',
			'JLC Part',
			'JLCPCB Part',
			'Supplier Part',
			'Part Number',
			'MPN',
			'Manufacturer Part',
			'Manufacturer Part Number',
			'Model',
			'型号',
			'Comment',
			'Value',
			'Name',
		]);
		const typeHeader = findHeader(headers, ['Category', 'Type', '分类', '类型']);
		const refHeader = findHeader(headers, ['Designator', 'Reference', 'RefDes', '位号', '标号']);
		const footprintHeader = findHeader(headers, ['Footprint', 'Package', '封装']);
		const descHeader = findHeader(headers, ['Description', 'Desc', '描述', '说明']);
		if (!qtyHeader || !modelHeader) {
			throw new Error(
				t(
					`无法识别 BOM 关键列（数量/型号）。已识别列：${headers.join('、')}`,
					`Cannot find key BOM columns (qty/model). Headers: ${headers.join(', ')}`,
				),
			);
		}
		const num = (input) => {
			const n = Number(String(input || '').trim().replaceAll(/[, ]+/g, ''));
			return Number.isFinite(n) ? n : 0;
		};
		const grouped = new Map();
		for (const row of rows) {
			const qty = num(row[qtyHeader]);
			const model = String(row[modelHeader] || '').trim();
			if (!model || qty <= 0) continue;
			const typeName = typeHeader ? String(row[typeHeader] || '').trim() : '';
			const key = `${(typeName || 'EDA导入').toLowerCase()}::${model.toLowerCase()}`;
			if (!grouped.has(key)) {
				grouped.set(key, {
					typeName: typeName || 'EDA导入',
					model,
					qty: 0,
					ref: new Set(),
					footprint: new Set(),
					desc: new Set(),
				});
			}
			const item = grouped.get(key);
			item.qty += qty;
			if (refHeader && row[refHeader]) item.ref.add(String(row[refHeader]).trim());
			if (footprintHeader && row[footprintHeader]) item.footprint.add(String(row[footprintHeader]).trim());
			if (descHeader && row[descHeader]) item.desc.add(String(row[descHeader]).trim());
		}
		if (!grouped.size) throw new Error(t('BOM 中未发现有效行（型号或数量为空）。', 'No valid BOM lines found.'));
		return grouped;
	}
	function replacePcbBomItemsFromGroups(targetPcb, grouped) {
		const nextItems = [];
		let createdComponents = 0;
		const ensureType = (typeName) => {
			const name = String(typeName || '').trim() || 'EDA导入';
			let type = state.db.types.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
			if (!type) {
				type = nType({
					id: id(),
					name,
					primaryName: name.split('/')[0],
					secondaryName: name.split('/')[1] || '',
					createdAt: iso(),
					updatedAt: iso(),
				});
				state.db.types.push(type);
			}
			return type;
		};
		for (const item of grouped.values()) {
			const type = ensureType(item.typeName);
			const model = String(item.model || '').trim();
			if (!model) continue;
			let component =
				state.db.components.find((entry) => entry.model.toLowerCase() === model.toLowerCase()) ||
				state.db.components.find((entry) => entry.typeId === type.id && entry.model.toLowerCase() === model.toLowerCase());
			if (!component) {
				const auxParts = [];
				if (item.footprint.size) auxParts.push(`${t('封装', 'Footprint')}: ${Array.from(item.footprint).join(' / ')}`);
				if (item.desc.size) auxParts.push(`${t('描述', 'Description')}: ${Array.from(item.desc).join(' / ')}`);
				if (item.ref.size) auxParts.push(`${t('位号', 'Ref')}: ${Array.from(item.ref).slice(0, 6).join(', ')}${item.ref.size > 6 ? ` (+${item.ref.size - 6})` : ''}`);
				component = nComponent({
					id: id(),
					typeId: type.id,
					model,
					auxInfo: auxParts.join('\n'),
					note: '',
					warningThreshold: 0,
					records: [],
					createdAt: iso(),
					updatedAt: iso(),
				});
				state.db.components.push(component);
				createdComponents += 1;
			}
			const qtyPerBoard = Math.max(1, Math.round(Number(item.qty || 0)));
			nextItems.push(nBomItem({ id: id(), componentId: component.id, quantityPerBoard: qtyPerBoard, createdAt: iso(), updatedAt: iso() }));
		}
		targetPcb.items = nextItems;
		targetPcb.updatedAt = iso();
		return { createdComponents, createdBomItems: nextItems.length };
	}
	function upsertSyncedProjectFromCurrent(projectInfo, snapshot, importedAt) {
		const projectLabel = currentProjectLabelFromInfo(projectInfo, snapshot) || t('当前工程', 'Current Project');
		const projectName = String(projectInfo?.name || snapshot?.projectName || '').trim();
		const projectUuid = String(projectInfo?.uuid || snapshot?.projectUuid || '').trim();
		const description = String(projectInfo?.description || snapshot?.projectDescription || '').trim();
		const existing = state.db.projects.find(
			(item) => item.sourceKind === 'eda-project-sync' && projectUuid && item.sourceProjectUuid === projectUuid,
		);
		const payload = {
			...(existing || {}),
			id: existing?.id || id(),
			name: `EDA / ${projectLabel}`,
			note: buildEdaProjectNoteText({
				mode: 'project-sync',
				projectLabel,
				projectName,
				projectUuid,
				description,
				importedAt,
			}),
			sourceKind: 'eda-project-sync',
			sourceProjectUuid: projectUuid || undefined,
			sourceProjectName: projectName || undefined,
			sourceProjectFriendlyName: projectLabel || undefined,
			sourceImportedAt: iso(),
			createdAt: existing?.createdAt || iso(),
			updatedAt: iso(),
		};
		if (existing) {
			Object.assign(existing, nProject(payload));
			return existing;
		}
		const project = nProject(payload);
		state.db.projects.push(project);
		return project;
	}

	async function importEdaBomFromCurrent(): Promise<void> {
		const pcbApi = edaApi?.pcb_ManufactureData;
		const schApi = edaApi?.sch_ManufactureData;
		const snapshot = await refreshCurrentEdaSnapshot({ silent: true }).catch(() => null);
		const getBomFile =
			pcbApi && typeof pcbApi.getBomFile === 'function'
				? pcbApi.getBomFile.bind(pcbApi)
				: schApi && typeof schApi.getBomFile === 'function'
					? schApi.getBomFile.bind(schApi)
					: null;
		if (!getBomFile) {
			throw new Error(t('当前 EDA 版本未提供生产资料 BOM 导出接口（pcb_ManufactureData/sch_ManufactureData）。', 'Manufacture BOM API not available.'));
		}

		setStatus('info', t('正在从当前工程生成 BOM 文件...', 'Generating BOM file from current design...'));
		render();

		const bomFile = await getBomFile('eda-bom', 'csv');
		if (!bomFile) {
			throw new Error(t('未获取到 BOM 文件。请确认当前已打开 PCB/原理图工程后重试。', 'No BOM file returned. Open a design and retry.'));
		}

		const text = await bomFile.text();
		const grouped = groupBomRows(parseDelimitedTable(text));

		const now = new Date();
		const nameSuffix = now.toLocaleString(locale(), { hour12: false });
		const projectLabel = projectDisplayNameFromSnapshot(snapshot);
		const pcbLabel = pcbDisplayNameFromSnapshot(snapshot);
		const boardLabel = boardDisplayNameFromSnapshot(snapshot);
		const project = nProject({
			id: id(),
			name: projectLabel ? `${projectLabel} / ${t('EDA 导入', 'EDA Import')} ${nameSuffix}` : `EDA 导入 ${nameSuffix}`,
			note: buildEdaProjectNoteText({
				mode: 'current-bom',
				projectLabel,
				projectName: snapshot?.projectName,
				boardLabel,
				pcbLabel,
				projectUuid: snapshot?.projectUuid,
				description: snapshot?.projectDescription,
				importedAt: nameSuffix,
			}),
			sourceKind: 'eda-current-bom',
			sourceProjectUuid: snapshot?.projectUuid || undefined,
			sourceProjectName: snapshot?.projectName || undefined,
			sourceProjectFriendlyName: projectLabel || undefined,
			sourceImportedAt: iso(),
			createdAt: iso(),
			updatedAt: iso(),
		});
		state.db.projects.push(project);
		const pcb = nPcb({
			id: id(),
			projectId: project.id,
			name: pcbLabel || t('当前工程 BOM', 'Current Design BOM'),
			version: '',
			boardQuantity: 1,
			note: buildEdaPcbNoteText({
				mode: 'current-bom',
				projectLabel,
				boardLabel,
				pcbLabel,
				importedAt: nameSuffix,
			}),
			sourceKind: 'eda-current-bom',
			sourceProjectUuid: snapshot?.projectUuid || undefined,
			sourcePcbUuid: snapshot?.pcbUuid || undefined,
			sourcePcbName: pcbLabel || undefined,
			sourceBoardName: boardLabel || undefined,
			sourceImportedAt: iso(),
			items: [],
			createdAt: iso(),
			updatedAt: iso(),
		});
		state.db.pcbs.push(pcb);
		const { createdComponents, createdBomItems } = replacePcbBomItemsFromGroups(pcb, grouped);

		// Normalize + persist
		state.db = nDb(state.db);
		await saveDb();

		state.view = 'projects';
		state.projectFilter = project.id;
		state.modal = { type: 'bom', pcbId: pcb.id };
		setStatus(
			'success',
			projectLabel
				? t(
						`已从 ${projectLabel} 导入 BOM：新增 ${createdComponents} 个元器件，新增 ${createdBomItems} 条 BOM 明细。`,
						`BOM imported from ${projectLabel}: +${createdComponents} components, +${createdBomItems} BOM items.`,
					)
				: t(`已导入 BOM：新增 ${createdComponents} 个元器件，新增 ${createdBomItems} 条 BOM 明细。`, `BOM imported: +${createdComponents} components, +${createdBomItems} BOM items.`),
		);
		render();
	}

	async function importAllEdaPcbsFromCurrentProject(): Promise<void> {
		const projectApi = edaApi?.dmt_Project;
		const pcbTreeApi = edaApi?.dmt_Pcb;
		const boardApi = edaApi?.dmt_Board;
		const editorApi = edaApi?.dmt_EditorControl;
		const selectApi = edaApi?.dmt_SelectControl;
		const bomApi = edaApi?.pcb_ManufactureData;
		if (
			!projectApi ||
			typeof projectApi.getCurrentProjectInfo !== 'function' ||
			!pcbTreeApi ||
			typeof pcbTreeApi.getAllPcbsInfo !== 'function' ||
			!editorApi ||
			typeof editorApi.openDocument !== 'function' ||
			!bomApi ||
			typeof bomApi.getBomFile !== 'function'
		) {
			throw new Error(
				t(
					'当前 EDA 版本不支持整工程批量 BOM 导入。请先在“环境自检”中确认 dmt_Project / dmt_Pcb / dmt_EditorControl / pcb_ManufactureData 可用。',
					'This EDA build does not support batch project BOM import. Verify dmt_Project / dmt_Pcb / dmt_EditorControl / pcb_ManufactureData in SelfCheck.',
				),
			);
		}

		const snapshot = await refreshCurrentEdaSnapshot({ silent: true });
		const projectInfo = await projectApi.getCurrentProjectInfo();
		if (!projectInfo) {
			throw new Error(t('未读取到当前工程信息。', 'Cannot read the current project.'));
		}
		const sourcePcbs = sort(await pcbTreeApi.getAllPcbsInfo(), (item) => `${item.parentBoardName || ''}${item.name || ''}`);
		if (!sourcePcbs.length) {
			throw new Error(t('当前工程内没有可导入的 PCB。', 'No PCB found in the current project.'));
		}

		const boardList =
			boardApi && typeof boardApi.getAllBoardsInfo === 'function'
				? await boardApi.getAllBoardsInfo().catch(() => [])
				: [];
		const boardByPcbUuid = new Map();
		for (const board of boardList) {
			const pcbUuid = String(board?.pcb?.uuid || '').trim();
			if (pcbUuid) boardByPcbUuid.set(pcbUuid, board);
		}

		setStatus(
			'info',
			t(
				`正在同步当前工程的 ${sourcePcbs.length} 个 PCB，请勿切换编辑器焦点...`,
				`Syncing ${sourcePcbs.length} PCB documents from the current project. Please keep the editor focused...`,
			),
		);
		render();

		const importedAt = new Date().toLocaleString(locale(), { hour12: false });
		const targetProject = upsertSyncedProjectFromCurrent(projectInfo, snapshot, importedAt);
		const originalDoc =
			selectApi && typeof selectApi.getCurrentDocumentInfo === 'function'
				? await selectApi.getCurrentDocumentInfo().catch(() => undefined)
				: undefined;
		const openTabIdsBefore = await getOpenTabIdSet();
		let syncedPcbs = 0;
		let createdPcbs = 0;
		let createdComponents = 0;
		let createdBomItems = 0;
		const failures = [];

		for (const sourcePcb of sourcePcbs) {
			const sourcePcbUuid = String(sourcePcb?.uuid || '').trim();
			if (!sourcePcbUuid) continue;
			const boardInfo = boardByPcbUuid.get(sourcePcbUuid) || null;
			const projectLabel = currentProjectLabelFromInfo(projectInfo, snapshot);
			const pcbLabel = currentPcbLabelFromInfo(sourcePcb, boardInfo, snapshot) || t('未命名 PCB', 'Untitled PCB');
			const boardLabel = currentBoardLabelFromInfo(boardInfo, sourcePcb, snapshot);
			let tabId = '';
			try {
				tabId = String((await editorApi.openDocument(sourcePcbUuid)) || '');
				if (!tabId) throw new Error(t('无法打开 PCB 文档。', 'Cannot open the PCB document.'));
				if (typeof editorApi.activateDocument === 'function') {
					await editorApi.activateDocument(tabId).catch(() => undefined);
				}
				await sleep(180);
				const bomFile = await bomApi.getBomFile(`eda-bom-${safeFileStem(pcbLabel)}`, 'csv');
				if (!bomFile) throw new Error(t('未生成 BOM 文件。', 'No BOM file returned.'));
				const grouped = groupBomRows(parseDelimitedTable(await bomFile.text()));
				let targetPcb = state.db.pcbs.find(
					(item) => item.sourceKind === 'eda-project-sync' && item.sourcePcbUuid === sourcePcbUuid,
				);
				const payload = {
					...(targetPcb || {}),
					id: targetPcb?.id || id(),
					projectId: targetProject.id,
					name: pcbLabel,
					version: targetPcb?.version || '',
					boardQuantity: Number(targetPcb?.boardQuantity || 1),
					note: buildEdaPcbNoteText({
						mode: 'project-sync',
						projectLabel,
						boardLabel,
						pcbLabel,
						importedAt,
					}),
					sourceKind: 'eda-project-sync',
					sourceProjectUuid: String(projectInfo?.uuid || snapshot?.projectUuid || '').trim() || undefined,
					sourcePcbUuid,
					sourcePcbName: pcbLabel || undefined,
					sourceBoardName: boardLabel || undefined,
					sourceImportedAt: iso(),
					items: [],
					createdAt: targetPcb?.createdAt || iso(),
					updatedAt: iso(),
				};
				if (targetPcb) {
					Object.assign(targetPcb, nPcb(payload));
					syncedPcbs += 1;
				} else {
					targetPcb = nPcb(payload);
					state.db.pcbs.push(targetPcb);
					createdPcbs += 1;
				}
				const counts = replacePcbBomItemsFromGroups(targetPcb, grouped);
				createdComponents += counts.createdComponents;
				createdBomItems += counts.createdBomItems;
			} catch (error) {
				failures.push({
					name: pcbLabel,
					message: error instanceof Error ? error.message : String(error),
				});
			} finally {
				if (tabId && !openTabIdsBefore.has(tabId) && typeof editorApi.closeDocument === 'function') {
					await editorApi.closeDocument(tabId).catch(() => undefined);
				}
			}
		}

		if (originalDoc?.uuid) {
			try {
				const restoreTabId = await editorApi.openDocument(originalDoc.uuid);
				if (restoreTabId && typeof editorApi.activateDocument === 'function') {
					await editorApi.activateDocument(restoreTabId).catch(() => undefined);
				}
			} catch (_error) {}
		}

		const successCount = syncedPcbs + createdPcbs;
		if (!successCount) {
			const reason = failures[0]?.message || t('没有任何 PCB 同步成功。', 'No PCB was synced successfully.');
			throw new Error(reason);
		}

		state.db = nDb(state.db);
		await saveDb();
		state.view = 'projects';
		state.projectFilter = targetProject.id;
		state.modal = null;
		const failureSuffix =
			failures.length > 0
				? t(
						`；失败 ${failures.length} 个（如：${failures.slice(0, 2).map((item) => item.name).join('、')}）`,
						`; ${failures.length} failed (e.g. ${failures.slice(0, 2).map((item) => item.name).join(', ')})`,
					)
				: '';
		setStatus(
			'success',
			t(
				`整工程 BOM 同步完成：新增 PCB ${createdPcbs} 个、更新 PCB ${syncedPcbs} 个、新增元器件 ${createdComponents} 个、写入 BOM 明细 ${createdBomItems} 条${failureSuffix}。`,
				`Project BOM sync finished: ${createdPcbs} PCB created, ${syncedPcbs} PCB updated, ${createdComponents} components created, ${createdBomItems} BOM items written${failureSuffix}.`,
			),
		);
		render();
	}

	async function openSourcePcb(pluginPcbId): Promise<void> {
		const pcb = state.db.pcbs.find((item) => item.id === pluginPcbId);
		if (!pcb || !pcb.sourcePcbUuid) {
			throw new Error(t('该 PCB 未关联到 EDA 工程内的 PCB。', 'This PCB is not linked to an EDA PCB document.'));
		}
		const editorApi = edaApi?.dmt_EditorControl;
		if (!editorApi || typeof editorApi.openDocument !== 'function') {
			throw new Error(t('当前 EDA 版本未提供打开文档能力。', 'This EDA build cannot open editor documents.'));
		}
		const tabId = await editorApi.openDocument(pcb.sourcePcbUuid);
		if (!tabId) throw new Error(t('打开对应 PCB 失败。', 'Failed to open the linked PCB.'));
		if (typeof editorApi.activateDocument === 'function') {
			await editorApi.activateDocument(tabId).catch(() => undefined);
		}
		setStatus('success', t(`已打开对应 PCB：${pcb.name}`, `Opened linked PCB: ${pcb.name}`));
		render();
	}

	async function exportJson() {
		await edaApi.sys_FileSystem.saveFile(new Blob([jsonText()], { type: 'application/json;charset=utf-8' }), 'bom-data.json');
		setStatus('success', t('JSON 已导出。', 'JSON exported.'));
		render();
	}

	function safeFileStem(input) {
		return String(input || '')
			.replaceAll(/[\r\n]+/g, ' ')
			.replaceAll(/[\\/:*?"<>|]+/g, '_')
			.trim()
			.slice(0, 80) || 'export';
	}

	function calcPurchaseExport() {
		const tMap = typeMap();
		const pMap = projectMap();
		const cMap = new Map(state.db.components.map((item) => [item.id, item]));

		const scope = state.purchase.scope === 'pcb' ? 'pcb' : 'project';
		const projectId = state.purchase.projectId || 'all';
		const pcbId = state.purchase.pcbId || 'all';
		const shortageOnly = Boolean(state.purchase.shortageOnly);

		const pcbsByProject = projectId === 'all' ? state.db.pcbs : state.db.pcbs.filter((item) => item.projectId === projectId);
		const pcbsForCalc = (() => {
			if (scope === 'pcb') {
				if (pcbId === 'all') return pcbsByProject;
				return pcbsByProject.filter((item) => item.id === pcbId);
			}
			return pcbsByProject;
		})();

		const required = new Map();
		const usedBy = new Map();
		for (const pcb of pcbsForCalc) {
			const pcbLabel = `${pMap.get(pcb.projectId)?.name || t('未知项目', 'Unknown Project')}/${pcb.name}${pcb.version ? `(${pcb.version})` : ''}`;
			for (const item of pcb.items) {
				const qty = Number(item.quantityPerBoard || 0) * Number(pcb.boardQuantity || 1);
				if (!required.has(item.componentId)) required.set(item.componentId, 0);
				required.set(item.componentId, required.get(item.componentId) + qty);
				if (!usedBy.has(item.componentId)) usedBy.set(item.componentId, new Set());
				usedBy.get(item.componentId).add(pcbLabel);
			}
		}

		const lines = Array.from(required.entries())
			.map(([componentId, req]) => {
				const component = cMap.get(componentId) || null;
				const inStock = component ? Number(component.totalQuantity || 0) : 0;
				const shortage = Math.max(0, Number(req || 0) - inStock);
				const unit = component && typeof component.lowestPrice === 'number' ? component.lowestPrice : null;
				return {
					componentId,
					typeName: component ? tMap.get(component.typeId)?.name || t('未知类型', 'Unknown Type') : t('未知类型', 'Unknown Type'),
					model: component ? component.model : t('未知元器件', 'Unknown Component'),
					required: Number(req || 0),
					inStock,
					shortage,
					unitPrice: unit,
					amount: unit === null ? null : unit * shortage,
					pcbs: Array.from(usedBy.get(componentId) || []),
				};
			})
			.filter((row) => (shortageOnly ? row.shortage > 0 : true))
			.sort((a, b) => a.model.localeCompare(b.model, locale()));

		const projectName = projectId === 'all' ? t('全部项目', 'All Projects') : (pMap.get(projectId)?.name || t('未知项目', 'Unknown Project'));
		const pcbName = (() => {
			if (scope !== 'pcb') return '';
			if (pcbId === 'all') return t('全部 PCB', 'All PCBs');
			const pcb = state.db.pcbs.find((item) => item.id === pcbId);
			if (!pcb) return t('未知 PCB', 'Unknown PCB');
			return `${pMap.get(pcb.projectId)?.name || ''}/${pcb.name}${pcb.version ? `(${pcb.version})` : ''}`;
		})();

		const stem = safeFileStem(`purchase-${scope}-${scope === 'project' ? projectName : pcbName || projectName}`);
		return {
			generatedAt: iso(),
			scope,
			projectId,
			pcbId,
			projectName,
			pcbName,
			shortageOnly,
			lines,
			fileStem: stem,
		};
	}

	async function exportPurchaseJson() {
		const payload = calcPurchaseExport();
		await edaApi.sys_FileSystem.saveFile(
			new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }),
			`${payload.fileStem}.json`,
		);
		setStatus('success', t('采购清单 JSON 已导出。', 'Purchase list JSON exported.'));
		render();
	}

	async function exportPurchaseCsv() {
		const payload = calcPurchaseExport();
		const csvCell = (value) => {
			const s = String(value ?? '');
			return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
		};
		const rows = [
			[t('类型', 'Type'), t('型号', 'Model'), t('需求', 'Required'), t('库存', 'In Stock'), t('缺口', 'Shortage'), t('最低单价', 'Unit'), t('预计金额', 'Amount'), t('涉及 PCB', 'PCBs')],
			...payload.lines.map((row) => [
				row.typeName,
				row.model,
				row.required,
				row.inStock,
				row.shortage,
				row.unitPrice === null ? '' : row.unitPrice,
				row.amount === null ? '' : row.amount,
				row.pcbs.join(' | '),
			]),
		];
		const csv = `\uFEFF${rows.map((r) => r.map(csvCell).join(',')).join('\n')}`;
		await edaApi.sys_FileSystem.saveFile(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${payload.fileStem}.csv`);
		setStatus('success', t('采购清单 CSV 已导出。', 'Purchase list CSV exported.'));
		render();
	}

	function bomManagerExportSheets() {
		const tMap = typeMap();
		const pMap = projectMap();
		const sMap = storeMap();

		const dbJson = JSON.stringify(state.db);
		const chunkSize = 20000;
		const chunks = [];
		for (let i = 0; i < dbJson.length; i += chunkSize) chunks.push([dbJson.slice(i, i + chunkSize)]);

		const metaRows = [
			['bom-manager-export', '1'],
			['createdAt', iso()],
			['dbChunks', String(chunks.length)],
		];

		const typesRows = [
			[t('类型', 'Type'), t('一级类型', 'Primary'), t('二级类型', 'Secondary')],
			...sort(state.db.types, (item) => item.name).map((item) => [item.name, item.primaryName, item.secondaryName || '']),
		];

		const componentsRows = [
			[t('类型', 'Type'), t('型号', 'Model'), t('总库存', 'Total'), t('预警阈值', 'Warn'), t('最低价格', 'Lowest'), t('辅助信息', 'Aux'), t('备注', 'Note')],
			...sort(state.db.components, (item) => `${tMap.get(item.typeId)?.name || ''}${item.model}`).map((item) => [
				tMap.get(item.typeId)?.name || '',
				item.model,
				item.totalQuantity,
				item.warningThreshold,
				item.lowestPrice === null ? '' : item.lowestPrice,
				item.auxInfo || '',
				item.note || '',
			]),
		];

		const recordsRows = [
			[t('类型', 'Type'), t('型号', 'Model'), t('店铺', 'Store'), t('平台', 'Platform'), t('链接', 'Link'), t('数量', 'Qty'), t('单价', 'Price'), t('时间', 'Purchased At')],
			...state.db.components.flatMap((component) => component.records.map((record) => [
				tMap.get(component.typeId)?.name || '',
				component.model,
				record.storeId ? `${sMap.get(record.storeId)?.platform || ''}/${sMap.get(record.storeId)?.shopName || ''}` : '',
				record.platform,
				record.link,
				record.quantity,
				record.pricePerUnit,
				record.purchasedAt,
			])),
		];

		const storesRows = [
			[t('平台', 'Platform'), t('店铺名称', 'Shop'), t('质量评分', 'Quality'), t('价格评分', 'Price'), t('邮费', 'Shipping'), t('参考价格', 'Reference'), t('主卖品', 'Main Products'), t('备注', 'Note')],
			...sort(state.db.stores, (item) => `${item.platform}${item.shopName}`).map((item) => [item.platform, item.shopName, item.qualityScore, item.priceScore, item.shippingFee, item.referencePrice, item.mainProducts || '', item.note || '']),
		];

		const projectsRows = [
			[t('项目名称', 'Project'), t('备注', 'Note')],
			...sort(state.db.projects, (item) => item.name).map((item) => [item.name, item.note || '']),
		];

		const pcbsRows = [
			[t('项目', 'Project'), t('PCB', 'PCB'), t('版本', 'Version'), t('数量', 'Board Qty'), t('备注', 'Note')],
			...sort(state.db.pcbs, (item) => `${pMap.get(item.projectId)?.name || ''}${item.name}${item.version}`).map((item) => [
				pMap.get(item.projectId)?.name || '',
				item.name,
				item.version || '',
				item.boardQuantity,
				item.note || '',
			]),
		];

		const bomRows = [
			[t('项目', 'Project'), t('PCB', 'PCB'), t('版本', 'Version'), t('类型', 'Type'), t('型号', 'Model'), t('单板需求', 'Qty per Board')],
			...state.db.pcbs.flatMap((pcb) => pcb.items.map((bom) => {
				const c = state.db.components.find((it) => it.id === bom.componentId);
				return [
					pMap.get(pcb.projectId)?.name || '',
					pcb.name,
					pcb.version || '',
					c ? (tMap.get(c.typeId)?.name || '') : '',
					c ? c.model : '',
					bom.quantityPerBoard,
				];
			})),
		];

		return [
			{ name: '__BOM_MANAGER__', hidden: true, rows: metaRows },
			{ name: '__BOM_DB__', hidden: true, rows: chunks },
			{ name: 'Types', rows: typesRows },
			{ name: 'Components', rows: componentsRows },
			{ name: 'Records', rows: recordsRows },
			{ name: 'Stores', rows: storesRows },
			{ name: 'Projects', rows: projectsRows },
			{ name: 'PCBs', rows: pcbsRows },
			{ name: 'BOM', rows: bomRows },
		];
	}

	async function exportXlsx() {
		const bytes = buildXlsxWorkbook(bomManagerExportSheets());
		await edaApi.sys_FileSystem.saveFile(
			new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
			'bom-data.xlsx',
		);
		setStatus('success', t('Excel(xlsx) 已导出。', 'Excel (.xlsx) exported.'));
		render();
	}

	// Backward compatibility for older UI bindings.
	async function exportXls() {
		return exportXlsx();
	}
	async function resetData() {
		if (!window.confirm(t('确认清空全部数据？', 'Clear all data?'))) return;
		state.db = emptyDb();
		state.componentFilter = { keyword: '', typeId: 'all', warningOnly: false };
		state.projectFilter = 'all';
		state.editingTypeId = state.editingComponentId = state.editingProjectId = state.editingPcbId = state.editingStoreId = null;
		state.modal = null;
		await saveDb();
		setStatus('success', t('数据已重置。', 'Data reset.'));
		render();
	}

	async function submitType(values) {
		const primaryName = String(values.primaryName || '').trim();
		const secondaryName = String(values.secondaryName || '').trim();
		if (!primaryName) throw new Error(t('一级类型不能为空。', 'Primary type is required.'));
		const name = secondaryName ? `${primaryName}/${secondaryName}` : primaryName;
		if (state.db.types.some((item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== values.typeId)) throw new Error(t('类型已存在。', 'Type already exists.'));
		if (values.typeId) {
			const item = state.db.types.find((entry) => entry.id === values.typeId);
			if (!item) throw new Error(t('类型不存在。', 'Type not found.'));
			Object.assign(item, nType({ ...item, name, primaryName, secondaryName, updatedAt: iso() }));
		} else {
			state.db.types.push(nType({ id: id(), name, primaryName, secondaryName, createdAt: iso(), updatedAt: iso() }));
		}
		state.editingTypeId = null;
		await saveDb();
		setStatus('success', t('类型已保存。', 'Type saved.'));
		render();
	}
	async function deleteType(idValue) {
		if (state.db.components.some((item) => item.typeId === idValue)) throw new Error(t('该类型仍被元器件引用。', 'This type is still referenced by components.'));
		if (!window.confirm(t('确认删除该类型？', 'Delete this type?'))) return;
		state.db.types = state.db.types.filter((item) => item.id !== idValue);
		if (state.editingTypeId === idValue) state.editingTypeId = null;
		await saveDb();
		setStatus('success', t('类型已删除。', 'Type deleted.'));
		render();
	}

	async function submitComponent(values) {
		const typeId = String(values.typeId || '').trim();
		const model = String(values.model || '').trim();
		const warningThreshold = Number(values.warningThreshold || 0);
		if (!typeId || !model) throw new Error(t('类型和型号为必填项。', 'Type and model are required.'));
		if (warningThreshold < 0 || Number.isNaN(warningThreshold)) throw new Error(t('预警阈值必须大于等于 0。', 'Warning threshold must be greater than or equal to 0.'));
		if (values.componentId) {
			const item = state.db.components.find((entry) => entry.id === values.componentId);
			if (!item) throw new Error(t('元器件不存在。', 'Component not found.'));
			Object.assign(item, nComponent({ ...item, typeId, model, auxInfo: values.auxInfo || '', note: values.note || '', warningThreshold, updatedAt: iso() }));
		} else {
			state.db.components.push(nComponent({ id: id(), typeId, model, auxInfo: values.auxInfo || '', note: values.note || '', warningThreshold, records: [], createdAt: iso(), updatedAt: iso() }));
		}
		state.editingComponentId = null;
		await saveDb();
		setStatus('success', t('元器件已保存。', 'Component saved.'));
		render();
	}
	async function deleteComponent(idValue) {
		if (state.db.pcbs.some((pcb) => pcb.items.some((item) => item.componentId === idValue))) throw new Error(t('该元器件已被 PCB BOM 引用。', 'This component is referenced by PCB BOM items.'));
		if (!window.confirm(t('确认删除该元器件？', 'Delete this component?'))) return;
		state.db.components = state.db.components.filter((item) => item.id !== idValue);
		if (state.editingComponentId === idValue) state.editingComponentId = null;
		await saveDb();
		setStatus('success', t('元器件已删除。', 'Component deleted.'));
		render();
	}
	async function submitRecord(values) {
		const component = state.db.components.find((item) => item.id === values.componentId);
		if (!component) throw new Error(t('元器件不存在。', 'Component not found.'));
		const quantity = Number(values.quantity || 0);
		const pricePerUnit = Number(values.pricePerUnit || 0);
		if (quantity <= 0) throw new Error(t('数量必须大于 0。', 'Quantity must be greater than 0.'));
		if (pricePerUnit < 0) throw new Error(t('价格不能小于 0。', 'Price cannot be below 0.'));
		if (values.recordId) {
			const record = component.records.find((item) => item.id === values.recordId);
			if (!record) throw new Error(t('采购记录不存在。', 'Record not found.'));
			Object.assign(record, nRecord({ ...record, storeId: values.storeId || undefined, platform: values.platform || '', link: values.link || '', quantity, pricePerUnit, updatedAt: iso() }));
		} else {
			component.records.push(nRecord({ id: id(), storeId: values.storeId || undefined, platform: values.platform || '', link: values.link || '', quantity, pricePerUnit, purchasedAt: iso(), createdAt: iso(), updatedAt: iso() }));
		}
		const index = state.db.components.findIndex((item) => item.id === component.id);
		state.db.components[index] = nComponent(component);
		state.modal = null;
		await saveDb();
		setStatus('success', t('采购记录已保存。', 'Record saved.'));
		render();
	}
	async function deleteRecord(componentId, recordId) {
		const component = state.db.components.find((item) => item.id === componentId);
		if (!component) return;
		if (!window.confirm(t('确认删除这条采购记录？', 'Delete this record?'))) return;
		component.records = component.records.filter((item) => item.id !== recordId);
		const index = state.db.components.findIndex((item) => item.id === component.id);
		state.db.components[index] = nComponent(component);
		await saveDb();
		setStatus('success', t('采购记录已删除。', 'Record deleted.'));
		render();
	}

	async function submitProject(values) {
		const name = String(values.name || '').trim();
		if (!name) throw new Error(t('项目名称不能为空。', 'Project name is required.'));
		if (state.db.projects.some((item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== values.projectId)) throw new Error(t('项目名称已存在。', 'Project name already exists.'));
		if (values.projectId) {
			const item = state.db.projects.find((entry) => entry.id === values.projectId);
			if (!item) throw new Error(t('项目不存在。', 'Project not found.'));
			Object.assign(item, nProject({ ...item, name, note: values.note || '', updatedAt: iso() }));
		} else {
			state.db.projects.push(nProject({ id: id(), name, note: values.note || '', createdAt: iso(), updatedAt: iso() }));
		}
		state.editingProjectId = null;
		await saveDb();
		setStatus('success', t('项目已保存。', 'Project saved.'));
		render();
	}
	async function deleteProject(idValue) {
		if (state.db.pcbs.some((item) => item.projectId === idValue)) throw new Error(t('该项目下仍有 PCB。', 'This project still contains PCBs.'));
		if (!window.confirm(t('确认删除该项目？', 'Delete this project?'))) return;
		state.db.projects = state.db.projects.filter((item) => item.id !== idValue);
		if (state.editingProjectId === idValue) state.editingProjectId = null;
		await saveDb();
		setStatus('success', t('项目已删除。', 'Project deleted.'));
		render();
	}
	async function submitPcb(values) {
		const projectId = String(values.projectId || '').trim();
		const name = String(values.name || '').trim();
		const version = String(values.version || '').trim();
		const boardQuantity = Number(values.boardQuantity || 1);
		if (!projectId || !name) throw new Error(t('所属项目和 PCB 名称为必填项。', 'Project and PCB name are required.'));
		if (boardQuantity <= 0 || Number.isNaN(boardQuantity)) throw new Error(t('项目用板数量必须大于 0。', 'Board quantity must be greater than 0.'));
		if (state.db.pcbs.some((item) => item.projectId === projectId && item.name.toLowerCase() === name.toLowerCase() && item.version.toLowerCase() === version.toLowerCase() && item.id !== values.pcbId)) throw new Error(t('该项目下同名同版本 PCB 已存在。', 'A PCB with the same name/version already exists in this project.'));
		if (values.pcbId) {
			const item = state.db.pcbs.find((entry) => entry.id === values.pcbId);
			if (!item) throw new Error(t('PCB 不存在。', 'PCB not found.'));
			Object.assign(item, nPcb({ ...item, projectId, name, version, boardQuantity, note: values.note || '', updatedAt: iso() }));
		} else {
			state.db.pcbs.push(nPcb({ id: id(), projectId, name, version, boardQuantity, note: values.note || '', items: [], createdAt: iso(), updatedAt: iso() }));
		}
		state.editingPcbId = null;
		await saveDb();
		setStatus('success', t('PCB 已保存。', 'PCB saved.'));
		render();
	}
	async function deletePcb(idValue) {
		if (!window.confirm(t('确认删除该 PCB？', 'Delete this PCB?'))) return;
		state.db.pcbs = state.db.pcbs.filter((item) => item.id !== idValue);
		if (state.editingPcbId === idValue) state.editingPcbId = null;
		await saveDb();
		setStatus('success', t('PCB 已删除。', 'PCB deleted.'));
		render();
	}
	async function submitBom(values) {
		const pcb = state.db.pcbs.find((item) => item.id === values.pcbId);
		if (!pcb) throw new Error(t('PCB 不存在。', 'PCB not found.'));
		const componentId = String(values.componentId || '').trim();
		const quantityPerBoard = Number(values.quantityPerBoard || 0);
		if (!componentId || quantityPerBoard <= 0) throw new Error(t('元器件和数量必须有效。', 'Component and quantity are required.'));
		if (pcb.items.some((item) => item.componentId === componentId && item.id !== values.itemId)) throw new Error(t('该 PCB 已存在相同元器件明细。', 'This PCB already contains the selected component.'));
		if (values.itemId) {
			const item = pcb.items.find((entry) => entry.id === values.itemId);
			if (!item) throw new Error(t('BOM 明细不存在。', 'BOM item not found.'));
			Object.assign(item, nBomItem({ ...item, componentId, quantityPerBoard, updatedAt: iso() }));
		} else {
			pcb.items.push(nBomItem({ id: id(), componentId, quantityPerBoard, createdAt: iso(), updatedAt: iso() }));
		}
		pcb.updatedAt = iso();
		state.modal = { type: 'bom', pcbId: pcb.id };
		await saveDb();
		setStatus('success', t('BOM 明细已保存。', 'BOM item saved.'));
		render();
	}
	async function deleteBomItem(pcbId, itemId) {
		const pcb = state.db.pcbs.find((item) => item.id === pcbId);
		if (!pcb) return;
		if (!window.confirm(t('确认删除这条 BOM 明细？', 'Delete this BOM item?'))) return;
		pcb.items = pcb.items.filter((item) => item.id !== itemId);
		pcb.updatedAt = iso();
		state.modal = { type: 'bom', pcbId };
		await saveDb();
		setStatus('success', t('BOM 明细已删除。', 'BOM item deleted.'));
		render();
	}

	async function submitStore(values) {
		const platform = String(values.platform || '').trim();
		const shopName = String(values.shopName || '').trim();
		if (!platform || !shopName) throw new Error(t('平台和店铺名称为必填项。', 'Platform and store name are required.'));
		if (values.storeId) {
			const item = state.db.stores.find((entry) => entry.id === values.storeId);
			if (!item) throw new Error(t('店铺不存在。', 'Store not found.'));
			Object.assign(item, nStore({ ...item, platform, shopName, qualityScore: values.qualityScore, priceScore: values.priceScore, shippingFee: values.shippingFee, referencePrice: values.referencePrice, mainProducts: values.mainProducts || '', note: values.note || '', updatedAt: iso() }));
		} else {
			state.db.stores.push(nStore({ id: id(), platform, shopName, qualityScore: values.qualityScore, priceScore: values.priceScore, shippingFee: values.shippingFee, referencePrice: values.referencePrice, mainProducts: values.mainProducts || '', note: values.note || '', createdAt: iso(), updatedAt: iso() }));
		}
		state.editingStoreId = null;
		await saveDb();
		setStatus('success', t('店铺评价已保存。', 'Store saved.'));
		render();
	}
	async function deleteStore(idValue) {
		if (state.db.components.some((item) => item.records.some((record) => record.storeId === idValue))) throw new Error(t('该店铺仍被采购记录引用。', 'This store is still referenced by purchase records.'));
		if (!window.confirm(t('确认删除该店铺？', 'Delete this store?'))) return;
		state.db.stores = state.db.stores.filter((item) => item.id !== idValue);
		if (state.editingStoreId === idValue) state.editingStoreId = null;
		await saveDb();
		setStatus('success', t('店铺评价已删除。', 'Store deleted.'));
		render();
	}
	async function deleteReport(idValue) {
		state.reportHistory = state.reportHistory.filter((item) => item.id !== idValue);
		await saveReportHistory();
		setStatus('success', t('报告记录已删除。', 'Report entry deleted.'));
		render();
	}

	app.addEventListener('input', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		if (target.dataset.filter === 'component-keyword') {
			state.componentFilter.keyword = target.value;
			render();
		}
	});
	app.addEventListener('change', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		if (target.dataset.filter === 'component-type') { state.componentFilter.typeId = target.value; render(); }
		if (target.dataset.filter === 'component-warning') { state.componentFilter.warningOnly = target.checked; render(); }
		if (target.dataset.filter === 'project-filter') { state.projectFilter = target.value; render(); }
		if (target.dataset.filter === 'purchase-scope') { state.purchase.scope = target.value === 'pcb' ? 'pcb' : 'project'; render(); }
		if (target.dataset.filter === 'purchase-project') {
			state.purchase.projectId = target.value || 'all';
			// Reset PCB filter when project changes to avoid empty result surprises.
			state.purchase.pcbId = 'all';
			render();
		}
		if (target.dataset.filter === 'purchase-pcb') { state.purchase.pcbId = target.value || 'all'; render(); }
		if (target.dataset.filter === 'purchase-shortage-only') { state.purchase.shortageOnly = target.checked; render(); }
		if (target.dataset.xlsxMap === 'sheet' && state.modal && state.modal.type === 'xlsx-map') { state.modal.sheetName = target.value; render(); }
		if (target.dataset.xlsxMap === 'target' && state.modal && state.modal.type === 'xlsx-map') { state.modal.targetKind = target.value; render(); }
	});
	app.addEventListener('click', (event) => {
		const rawTarget = event.target instanceof HTMLElement ? event.target : null;
		if (!rawTarget) return;
		const target = rawTarget.closest('button[data-action],a[data-action]') || (rawTarget.hasAttribute('data-action') ? rawTarget : null);
		if (!target) return;
		const action = target.dataset.action;
		const modalRoot = event.target instanceof HTMLElement ? event.target.closest('[data-modal-root]') : null;
		if (action === 'close-modal' && modalRoot && event.target !== target) return;
		Promise.resolve().then(async () => {
			try {
				state.status = '';
				if (action === 'view') { state.view = target.dataset.view || 'dashboard'; render(); return; }
				if (action === 'refresh-eda-snapshot') return refreshCurrentEdaSnapshot();
				if (action === 'generate-context-report') return generateContextReport();
				if (action === 'capture-canvas-current') return captureCanvas('current');
				if (action === 'capture-canvas-all') return captureCanvas('all');
				if (action === 'capture-canvas-selected') return captureCanvas('selected');
				if (action === 'zoom-canvas-all') return focusCanvas('all');
				if (action === 'zoom-canvas-selected') return focusCanvas('selected');
				if (action === 'mark-canvas-all') return showCanvasMarker('all');
				if (action === 'mark-canvas-selected') return showCanvasMarker('selected');
				if (action === 'clear-canvas-markers') return clearCanvasMarkers();
				if (action === 'clear-report-history') return clearReportHistory();
				if (action === 'export-report-json') return exportStoredReport(target.dataset.reportId, 'json');
				if (action === 'export-report-html') return exportStoredReport(target.dataset.reportId, 'html');
				if (action === 'delete-report') return deleteReport(target.dataset.reportId);
				if (action === 'export-manufacture') return exportManufactureAsset(target.dataset.kind);
				if (action === 'import-eda-project-bom') return importAllEdaPcbsFromCurrentProject();
				if (action === 'import') return importData();
				if (action === 'import-eda-bom') return importEdaBomFromCurrent();
				if (action === 'export-json') return exportJson();
				if (action === 'export-xlsx') return exportXlsx();
				if (action === 'export-xls') return exportXlsx();
				if (action === 'purchase-export-json') return exportPurchaseJson();
				if (action === 'purchase-export-csv') return exportPurchaseCsv();
				if (action === 'reset') return resetData();
				if (action === 'cancel-type') { state.editingTypeId = null; render(); return; }
				if (action === 'edit-type') { state.view = 'types'; state.editingTypeId = target.dataset.id; render(); return; }
				if (action === 'delete-type') return deleteType(target.dataset.id);
				if (action === 'cancel-component') { state.editingComponentId = null; render(); return; }
				if (action === 'edit-component') { state.view = 'components'; state.editingComponentId = target.dataset.id; render(); return; }
				if (action === 'delete-component') return deleteComponent(target.dataset.id);
				if (action === 'record-modal') { state.modal = { type: 'record', componentId: target.dataset.componentId, recordId: target.dataset.recordId || null }; render(); return; }
				if (action === 'delete-record') return deleteRecord(target.dataset.componentId, target.dataset.recordId);
				if (action === 'cancel-project') { state.editingProjectId = null; render(); return; }
				if (action === 'edit-project') { state.view = 'projects'; state.editingProjectId = target.dataset.id; render(); return; }
				if (action === 'delete-project') return deleteProject(target.dataset.id);
				if (action === 'cancel-pcb') { state.editingPcbId = null; render(); return; }
				if (action === 'edit-pcb') { state.view = 'projects'; state.editingPcbId = target.dataset.id; render(); return; }
				if (action === 'open-source-pcb') return openSourcePcb(target.dataset.pcbId);
				if (action === 'delete-pcb') return deletePcb(target.dataset.id);
				if (action === 'bom-modal') { state.modal = { type: 'bom', pcbId: target.dataset.pcbId, itemId: target.dataset.itemId || null }; render(); return; }
				if (action === 'delete-bom-item') return deleteBomItem(target.dataset.pcbId, target.dataset.itemId);
				if (action === 'cancel-store') { state.editingStoreId = null; render(); return; }
				if (action === 'edit-store') { state.view = 'stores'; state.editingStoreId = target.dataset.id; render(); return; }
				if (action === 'delete-store') return deleteStore(target.dataset.id);
				if (action === 'close-modal') { state.modal = null; render(); }
			} catch (error) {
				setStatus('error', error instanceof Error ? error.message : t('操作失败。', 'Operation failed.'));
				render();
			}
		});
	});
	app.addEventListener('submit', (event) => {
		const form = event.target;
		if (!(form instanceof HTMLFormElement)) return;
		event.preventDefault();
		const values = Object.fromEntries(new FormData(form).entries());
		Promise.resolve().then(async () => {
			try {
				state.status = '';
				if (form.id === 'type-form') return submitType(values);
				if (form.id === 'component-form') return submitComponent(values);
				if (form.id === 'record-form') return submitRecord(values);
				if (form.id === 'project-form') return submitProject(values);
				if (form.id === 'pcb-form') return submitPcb(values);
				if (form.id === 'bom-form') return submitBom(values);
				if (form.id === 'store-form') return submitStore(values);
				if (form.id === 'xlsx-map-form') return importXlsxMapped(values);
				if (form.id === 'prefs-form') {
					const checked = (name) => Object.prototype.hasOwnProperty.call(values, name);
					state.prefs = normalizePrefs({
						lang: values.lang,
						theme: values.theme,
						features: {
							showEdaSnapshot: checked('showEdaSnapshot'),
							enableCurrentPcbImport: checked('enableCurrentPcbImport'),
							enableProjectBatchImport: checked('enableProjectBatchImport'),
							enableOpenSourcePcb: checked('enableOpenSourcePcb'),
							enablePurchaseView: checked('enablePurchaseView'),
							enableStoresView: checked('enableStoresView'),
							enableReportsView: checked('enableReportsView'),
							enableExportHub: checked('enableExportHub'),
							enableCanvasTools: checked('enableCanvasTools'),
							autoLoadEdaSnapshot: checked('autoLoadEdaSnapshot'),
						},
					});
					if (!hasAnyEdaEntryEnabled()) state.edaSnapshot = null;
					await savePrefs();
					if (featureEnabled('autoLoadEdaSnapshot') && hasAnyEdaEntryEnabled() && !state.edaSnapshotLoading) {
						try {
							await refreshCurrentEdaSnapshot({ silent: true });
						} catch (_error) {
							setStatus('warning', t('偏好已保存，但自动读取工程快照失败，可稍后手动重试。', 'Preferences saved, but auto snapshot loading failed. Retry manually later.'));
							render();
							return;
						}
					}
					setStatus('success', t('偏好已保存。', 'Preferences saved.'));
					render();
					return;
				}
				if (form.id === 'export-prefs-form') {
					state.exportPrefs = normalizeExportPrefs({
						bomFileType: values.bomFileType,
						pickPlaceFileType: values.pickPlaceFileType,
						modelFileType: values.modelFileType,
						modelMode: values.modelMode,
						reportHistoryLimit: values.reportHistoryLimit,
						gerberColorSilkscreen: Object.prototype.hasOwnProperty.call(values, 'gerberColorSilkscreen'),
						autoGenerateModels: Object.prototype.hasOwnProperty.call(values, 'autoGenerateModels'),
					});
					await saveExportPrefs();
					await saveReportHistory();
					setStatus('success', t('导出预设已保存。', 'Export presets saved.'));
					render();
					return;
				}
			} catch (error) {
				setStatus('error', error instanceof Error ? error.message : t('操作失败。', 'Operation failed.'));
				render();
			}
		});
	});

	render();
	if (featureEnabled('autoLoadEdaSnapshot') && hasAnyEdaEntryEnabled()) {
		void refreshCurrentEdaSnapshot({ silent: true }).catch(() => undefined);
	}
})();
