// Iframe app (TypeScript)
// Compiled to iframe/app.js by config/esbuild.iframe.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */
(function () {
    const app = document.getElementById('app');
    const edaApi = window.eda || (window.parent && window.parent.eda) || (window.top && window.top.eda);
    const DB_KEY = 'bom-manager-db';
    const PREFS_KEY = 'bom-manager-prefs';
    if (!app)
        return;
    if (!edaApi) {
        app.innerHTML = '<div class="fatal-state">未检测到嘉立创插件运行环境（IFrame 内未注入 eda API）。</div>';
        return;
    }
    try {
        if (edaApi.sys_MessageBus && typeof edaApi.sys_MessageBus.publish === 'function') {
            edaApi.sys_MessageBus.publish('bom-manager-ready', { ts: Date.now() });
        }
    }
    catch (_error) { }
    const state = {
        view: 'dashboard',
        status: '',
        statusKind: 'info',
        prefs: loadPrefs(),
        db: loadDb(),
        componentFilter: { keyword: '', typeId: 'all', warningOnly: false },
        projectFilter: 'all',
        editingTypeId: null,
        editingComponentId: null,
        editingProjectId: null,
        editingPcbId: null,
        editingStoreId: null,
        modal: null,
    };
    function id() {
        return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
    function iso() {
        return new Date().toISOString();
    }
    function t(zh, en) {
        return state.prefs.lang === 'en' ? en : zh;
    }
    function locale() {
        return state.prefs.lang === 'en' ? 'en-US' : 'zh-CN';
    }
    function e(value) {
        return String(value !== null && value !== void 0 ? value : '')
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
        }
        catch (_error) { }
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
        return { id: input.id || id(), name: String(input.name || '').trim(), note: String(input.note || '').trim(), createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
    }
    function nBomItem(input) {
        return { id: input.id || id(), componentId: input.componentId || '', quantityPerBoard: Number(input.quantityPerBoard || 0), createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
    }
    function nPcb(input) {
        return { id: input.id || id(), projectId: input.projectId || '', name: String(input.name || '').trim(), version: String(input.version || '').trim(), boardQuantity: Number(input.boardQuantity || 1), note: String(input.note || '').trim(), items: (input.items || []).map(nBomItem), createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
    }
    function nStore(input) {
        return { id: input.id || id(), platform: String(input.platform || '').trim(), shopName: String(input.shopName || '').trim(), qualityScore: Number(input.qualityScore || 0), shippingFee: Number(input.shippingFee || 0), priceScore: Number(input.priceScore || 0), referencePrice: Number(input.referencePrice || 0), mainProducts: String(input.mainProducts || '').trim(), note: String(input.note || '').trim(), createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
    }
    function nDb(input) {
        const db = input && typeof input === 'object' ? input : defaultDb();
        return { types: (db.types || []).map(nType), components: (db.components || []).map(nComponent), projects: (db.projects || []).map(nProject), pcbs: (db.pcbs || []).map(nPcb), stores: (db.stores || []).map(nStore) };
    }
    function loadPrefs() {
        try {
            const value = edaApi.sys_Storage.getExtensionUserConfig(PREFS_KEY);
            return { lang: (value === null || value === void 0 ? void 0 : value.lang) === 'en' ? 'en' : 'zh', theme: (value === null || value === void 0 ? void 0 : value.theme) === 'dark' ? 'dark' : 'light' };
        }
        catch (_error) {
            return { lang: 'zh', theme: 'light' };
        }
    }
    function loadDb() {
        try {
            return nDb(edaApi.sys_Storage.getExtensionUserConfig(DB_KEY) || defaultDb());
        }
        catch (_error) {
            return defaultDb();
        }
    }
    async function savePrefs() {
        await edaApi.sys_Storage.setExtensionUserConfig(PREFS_KEY, state.prefs);
    }
    async function saveDb() {
        state.db = nDb(state.db);
        await edaApi.sys_Storage.setExtensionUserConfig(DB_KEY, state.db);
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
    function warning(component) {
        return component.warningThreshold > 0 && component.totalQuantity <= component.warningThreshold;
    }
    function active(name, idValue) {
        return idValue ? state.db[name].find((item) => item.id === idValue) || null : null;
    }
    function header() {
        return `<header class="app-header"><div><p class="eyebrow">JLCEDA Plugin</p><h1>${e(t('物料管理助手', 'BOM Manager'))}</h1><p class="hero-copy">${e(t('在插件窗口中统一维护类型、元器件、采购记录、项目、PCB 与 BOM。', 'Manage types, components, purchase records, projects, PCB and BOM in one place.'))}</p></div><div class="header-actions"><button class="ghost-button" data-action="import">${e(t('导入', 'Import'))}</button><button class="ghost-button" data-action="export-json">${e(t('导出 JSON', 'Export JSON'))}</button><button class="ghost-button" data-action="export-xlsx">${e(t('导出 Excel(.xlsx)', 'Export Excel (.xlsx)'))}</button></div></header>`;
    }
    function nav() {
        const items = [['dashboard', '概览', 'Overview'], ['components', '元器件', 'Components'], ['types', '类型', 'Types'], ['projects', '项目/PCB', 'Projects/PCB'], ['stores', '店铺', 'Stores'], ['settings', '设置', 'Settings']];
        return `<nav class="nav-strip">${items.map(([idValue, zh, en]) => `<button class="nav-link ${state.view === idValue ? 'active' : ''}" data-action="view" data-view="${idValue}">${e(t(zh, en))}</button>`).join('')}</nav>`;
    }
    function status() {
        return state.status ? `<div class="status-banner status-${e(state.statusKind)}">${e(state.status)}</div>` : '';
    }
    function render() {
        document.documentElement.setAttribute('data-theme', state.prefs.theme);
        app.innerHTML = `<div class="app-shell">${header()}${nav()}${status()}<main class="page-content">${view()}</main>${modal()}</div>`;
    }
    function view() {
        if (state.view === 'types')
            return typesView();
        if (state.view === 'components')
            return componentsView();
        if (state.view === 'projects')
            return projectsView();
        if (state.view === 'stores')
            return storesView();
        if (state.view === 'settings')
            return settingsView();
        return dashboardView();
    }
    function dashboardView() {
        const warningCount = state.db.components.filter(warning).length;
        const recordCount = state.db.components.reduce((sum, item) => sum + item.records.length, 0);
        const bomCount = state.db.pcbs.reduce((sum, item) => sum + item.items.length, 0);
        return `<section class="card-grid summary-grid"><article class="summary-card accent-blue"><span>${e(t('元器件', 'Components'))}</span><strong>${state.db.components.length}</strong></article><article class="summary-card accent-gold"><span>${e(t('库存预警', 'Warnings'))}</span><strong>${warningCount}</strong></article><article class="summary-card accent-green"><span>${e(t('采购记录', 'Records'))}</span><strong>${recordCount}</strong></article><article class="summary-card accent-red"><span>${e(t('BOM 明细', 'BOM Items'))}</span><strong>${bomCount}</strong></article></section><section class="card-grid two-col"><article class="panel-card"><h2>${e(t('快速入口', 'Quick Actions'))}</h2><div class="quick-actions"><button class="primary-button" data-action="view" data-view="components">${e(t('新增元器件', 'Add Component'))}</button><button class="ghost-button" data-action="view" data-view="projects">${e(t('维护项目/PCB', 'Manage Projects/PCB'))}</button><button class="ghost-button" data-action="view" data-view="stores">${e(t('维护店铺', 'Manage Stores'))}</button></div></article><article class="panel-card"><h2>${e(t('使用提示', 'Tips'))}</h2><ul class="info-list"><li>${e(t('建议定期导出 JSON 做离线备份。', 'Export JSON regularly for offline backup.'))}</li><li>${e(t('跨设备/跨账号可用导入恢复。', 'Use Import to restore across devices/accounts.'))}</li></ul></article></section>`;
    }
    function typesView() {
        const current = active('types', state.editingTypeId);
        const grouped = new Map();
        sort(state.db.types, (item) => item.name).forEach((item) => { const key = item.primaryName || t('未分类', 'Uncategorized'); if (!grouped.has(key))
            grouped.set(key, []); grouped.get(key).push(item); });
        return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(current ? t('编辑类型', 'Edit Type') : t('新增类型', 'New Type'))}</h2><form id="type-form" class="stack-form"><input type="hidden" name="typeId" value="${e((current === null || current === void 0 ? void 0 : current.id) || '')}" /><label><span>${e(t('一级类型', 'Primary Type'))}</span><input name="primaryName" required value="${e((current === null || current === void 0 ? void 0 : current.primaryName) || '')}" /></label><label><span>${e(t('二级类型', 'Secondary Type'))}</span><input name="secondaryName" value="${e((current === null || current === void 0 ? void 0 : current.secondaryName) || '')}" /></label><div class="inline-actions"><button class="primary-button" type="submit">${e(current ? t('更新', 'Update') : t('新增', 'Create'))}</button>${current ? `<button class="ghost-button" type="button" data-action="cancel-type">${e(t('取消', 'Cancel'))}</button>` : ''}</div></form></article><article class="panel-card"><h2>${e(t('类型列表', 'Type List'))}</h2><div class="stack-list">${Array.from(grouped.entries()).map(([name, items]) => `<section class="nested-section"><h3>${e(name)}</h3>${items.map((item) => `<div class="list-row"><div><strong>${e(item.name)}</strong><p>${e(time(item.updatedAt))}</p></div><div class="inline-actions"><button class="ghost-button" type="button" data-action="edit-type" data-id="${item.id}">${e(t('编辑', 'Edit'))}</button><button class="danger-button" type="button" data-action="delete-type" data-id="${item.id}">${e(t('删除', 'Delete'))}</button></div></div>`).join('')}</section>`).join('') || `<p class="empty-state">${e(t('暂无类型数据。', 'No type data.'))}</p>`}</div></article></section>`;
    }
    function componentsView() {
        const current = active('components', state.editingComponentId);
        const tMap = typeMap();
        const pMap = projectMap();
        const sMap = storeMap();
        const usage = new Map();
        state.db.pcbs.forEach((pcb) => pcb.items.forEach((item) => { var _a; if (!usage.has(item.componentId))
            usage.set(item.componentId, { total: 0, names: new Set() }); const row = usage.get(item.componentId); row.total += item.quantityPerBoard * pcb.boardQuantity; row.names.add(`${((_a = pMap.get(pcb.projectId)) === null || _a === void 0 ? void 0 : _a.name) || t('未知项目', 'Unknown Project')}/${pcb.name}${pcb.version ? `(${pcb.version})` : ''}`); }));
        const list = sort(state.db.components, (item) => item.model).filter((item) => { var _a; const keyword = state.componentFilter.keyword.trim().toLowerCase(); const typeName = ((_a = tMap.get(item.typeId)) === null || _a === void 0 ? void 0 : _a.name) || ''; const hit = !keyword || [item.model, item.auxInfo, item.note, typeName].join(' ').toLowerCase().includes(keyword); const hitType = state.componentFilter.typeId === 'all' || state.componentFilter.typeId === item.typeId; const hitWarning = !state.componentFilter.warningOnly || warning(item); return hit && hitType && hitWarning; });
        return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(current ? t('编辑元器件', 'Edit Component') : t('新增元器件', 'New Component'))}</h2><form id="component-form" class="stack-form"><input type="hidden" name="componentId" value="${e((current === null || current === void 0 ? void 0 : current.id) || '')}" /><label><span>${e(t('类型', 'Type'))}</span><select name="typeId" required><option value="">${e(t('请选择类型', 'Select type'))}</option>${sort(state.db.types, (item) => item.name).map((item) => `<option value="${item.id}" ${(current === null || current === void 0 ? void 0 : current.typeId) === item.id ? 'selected' : ''}>${e(item.name)}</option>`).join('')}</select></label><label><span>${e(t('型号', 'Model'))}</span><input name="model" required value="${e((current === null || current === void 0 ? void 0 : current.model) || '')}" /></label><label><span>${e(t('预警阈值', 'Warning Threshold'))}</span><input name="warningThreshold" type="number" min="0" step="1" value="${e((current === null || current === void 0 ? void 0 : current.warningThreshold) || 0)}" /></label><label><span>${e(t('辅助信息', 'Aux Info'))}</span><textarea name="auxInfo">${e((current === null || current === void 0 ? void 0 : current.auxInfo) || '')}</textarea></label><label><span>${e(t('备注', 'Note'))}</span><textarea name="note">${e((current === null || current === void 0 ? void 0 : current.note) || '')}</textarea></label><div class="inline-actions"><button class="primary-button" type="submit">${e(current ? t('更新', 'Update') : t('新增', 'Create'))}</button>${current ? `<button class="ghost-button" type="button" data-action="cancel-component">${e(t('取消', 'Cancel'))}</button>` : ''}</div></form></article><article class="panel-card"><h2>${e(t('搜索与筛选', 'Filter'))}</h2><div class="stack-form"><label><span>${e(t('关键词', 'Keyword'))}</span><input data-filter="component-keyword" value="${e(state.componentFilter.keyword)}" placeholder="${e(t('型号/备注/类型', 'Model/note/type'))}" /></label><label><span>${e(t('类型筛选', 'Type Filter'))}</span><select data-filter="component-type"><option value="all">${e(t('全部类型', 'All Types'))}</option>${sort(state.db.types, (item) => item.name).map((item) => `<option value="${item.id}" ${state.componentFilter.typeId === item.id ? 'selected' : ''}>${e(item.name)}</option>`).join('')}</select></label><label class="checkbox-row"><input data-filter="component-warning" type="checkbox" ${state.componentFilter.warningOnly ? 'checked' : ''} /><span>${e(t('仅显示库存预警', 'Only warnings'))}</span></label></div></article></section><section class="panel-card"><h2>${e(t('元器件列表', 'Component List'))}</h2><div class="stack-list">${list.map((item) => { var _a, _b; return `<article class="entity-card ${warning(item) ? 'warning-entity' : ''}"><header class="entity-header"><div><h3>${e(item.model)}</h3><p>${e(((_a = tMap.get(item.typeId)) === null || _a === void 0 ? void 0 : _a.name) || t('未知类型', 'Unknown Type'))}</p></div><div class="inline-actions">${warning(item) ? `<span class="pill pill-warning">${e(t('库存预警', 'Low Stock'))}</span>` : ''}<button class="ghost-button" type="button" data-action="edit-component" data-id="${item.id}">${e(t('编辑', 'Edit'))}</button><button class="danger-button" type="button" data-action="delete-component" data-id="${item.id}">${e(t('删除', 'Delete'))}</button></div></header><div class="meta-grid"><div><span>${e(t('总库存', 'Total'))}</span><strong>${item.totalQuantity}</strong></div><div><span>${e(t('最低价格', 'Lowest'))}</span><strong>${item.lowestPrice === null ? '-' : `¥${item.lowestPrice.toFixed(2)}`}</strong></div><div><span>${e(t('PCB 需求', 'PCB Demand'))}</span><strong>${((_b = usage.get(item.id)) === null || _b === void 0 ? void 0 : _b.total) || 0}</strong></div></div>${item.auxInfo ? `<p class="support-text">${e(item.auxInfo)}</p>` : ''}<div class="subsection-head"><h4>${e(t('采购记录', 'Purchase Records'))} (${item.records.length})</h4><button class="primary-button" type="button" data-action="record-modal" data-component-id="${item.id}">${e(t('新增记录', 'Add Record'))}</button></div><div class="table-wrap"><table><thead><tr><th>${e(t('店铺', 'Store'))}</th><th>${e(t('平台', 'Platform'))}</th><th>${e(t('数量', 'Qty'))}</th><th>${e(t('单价', 'Price'))}</th><th>${e(t('时间', 'Time'))}</th><th>${e(t('操作', 'Actions'))}</th></tr></thead><tbody>${sort(item.records, (record) => `${record.platform}-${record.purchasedAt}`).map((record) => { var _a, _b; return `<tr><td>${e(record.storeId ? `${((_a = sMap.get(record.storeId)) === null || _a === void 0 ? void 0 : _a.platform) || ''}/${((_b = sMap.get(record.storeId)) === null || _b === void 0 ? void 0 : _b.shopName) || ''}` : '-')}</td><td>${e(record.platform)}</td><td>${record.quantity}</td><td>${e(`¥${record.pricePerUnit.toFixed(2)}`)}</td><td>${e(time(record.purchasedAt))}</td><td><div class="inline-actions"><a class="text-link" href="${e(record.link)}" target="_blank" rel="noreferrer">${e(t('打开', 'Open'))}</a><button class="ghost-button" type="button" data-action="record-modal" data-component-id="${item.id}" data-record-id="${record.id}">${e(t('编辑', 'Edit'))}</button><button class="danger-button" type="button" data-action="delete-record" data-component-id="${item.id}" data-record-id="${record.id}">${e(t('删除', 'Delete'))}</button></div></td></tr>`; }).join('') || `<tr><td colspan="6" class="empty-state">${e(t('暂无采购记录。', 'No records.'))}</td></tr>`}</tbody></table></div></article>`; }).join('') || `<p class="empty-state">${e(t('暂无元器件数据。', 'No component data.'))}</p>`}</div></section>`;
    }
    function projectsView() {
        const currentProject = active('projects', state.editingProjectId);
        const currentPcb = active('pcbs', state.editingPcbId);
        const tMap = typeMap();
        const cMap = new Map(state.db.components.map((item) => [item.id, item]));
        const pMap = projectMap();
        const pcbs = state.projectFilter === 'all' ? state.db.pcbs : state.db.pcbs.filter((item) => item.projectId === state.projectFilter);
        const summary = new Map();
        pcbs.forEach((pcb) => pcb.items.forEach((item) => { var _a; if (!summary.has(item.componentId))
            summary.set(item.componentId, { total: 0, names: new Set() }); const row = summary.get(item.componentId); row.total += item.quantityPerBoard * pcb.boardQuantity; row.names.add(`${((_a = pMap.get(pcb.projectId)) === null || _a === void 0 ? void 0 : _a.name) || ''}/${pcb.name}`); }));
        return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(currentProject ? t('编辑项目', 'Edit Project') : t('新增项目', 'New Project'))}</h2><form id="project-form" class="stack-form"><input type="hidden" name="projectId" value="${e((currentProject === null || currentProject === void 0 ? void 0 : currentProject.id) || '')}" /><label><span>${e(t('项目名称', 'Project Name'))}</span><input name="name" required value="${e((currentProject === null || currentProject === void 0 ? void 0 : currentProject.name) || '')}" /></label><label><span>${e(t('备注', 'Note'))}</span><textarea name="note">${e((currentProject === null || currentProject === void 0 ? void 0 : currentProject.note) || '')}</textarea></label><div class="inline-actions"><button class="primary-button" type="submit">${e(currentProject ? t('更新', 'Update') : t('新增', 'Create'))}</button>${currentProject ? `<button class="ghost-button" type="button" data-action="cancel-project">${e(t('取消', 'Cancel'))}</button>` : ''}</div></form></article><article class="panel-card"><h2>${e(currentPcb ? t('编辑 PCB', 'Edit PCB') : t('新增 PCB', 'New PCB'))}</h2><form id="pcb-form" class="stack-form"><input type="hidden" name="pcbId" value="${e((currentPcb === null || currentPcb === void 0 ? void 0 : currentPcb.id) || '')}" /><label><span>${e(t('所属项目', 'Project'))}</span><select name="projectId" required><option value="">${e(t('请选择项目', 'Select project'))}</option>${sort(state.db.projects, (item) => item.name).map((item) => `<option value="${item.id}" ${(currentPcb === null || currentPcb === void 0 ? void 0 : currentPcb.projectId) === item.id ? 'selected' : ''}>${e(item.name)}</option>`).join('')}</select></label><label><span>${e(t('PCB 名称', 'PCB Name'))}</span><input name="name" required value="${e((currentPcb === null || currentPcb === void 0 ? void 0 : currentPcb.name) || '')}" /></label><label><span>${e(t('版本号', 'Version'))}</span><input name="version" value="${e((currentPcb === null || currentPcb === void 0 ? void 0 : currentPcb.version) || '')}" /></label><label><span>${e(t('项目用板数量', 'Board Qty'))}</span><input name="boardQuantity" type="number" min="1" step="1" value="${e((currentPcb === null || currentPcb === void 0 ? void 0 : currentPcb.boardQuantity) || 1)}" /></label><label><span>${e(t('备注', 'Note'))}</span><textarea name="note">${e((currentPcb === null || currentPcb === void 0 ? void 0 : currentPcb.note) || '')}</textarea></label><div class="inline-actions"><button class="primary-button" type="submit">${e(currentPcb ? t('更新', 'Update') : t('新增', 'Create'))}</button>${currentPcb ? `<button class="ghost-button" type="button" data-action="cancel-pcb">${e(t('取消', 'Cancel'))}</button>` : ''}</div></form></article></section><section class="panel-card"><div class="section-head"><h2>${e(t('需求统计', 'Requirement Summary'))}</h2><select data-filter="project-filter"><option value="all">${e(t('全部项目', 'All Projects'))}</option>${sort(state.db.projects, (item) => item.name).map((item) => `<option value="${item.id}" ${state.projectFilter === item.id ? 'selected' : ''}>${e(item.name)}</option>`).join('')}</select></div><div class="table-wrap"><table><thead><tr><th>${e(t('类型', 'Type'))}</th><th>${e(t('型号', 'Model'))}</th><th>${e(t('总需求', 'Demand'))}</th><th>${e(t('涉及 PCB', 'PCB'))}</th></tr></thead><tbody>${Array.from(summary.entries()).sort((a, b) => { var _a, _b; return (((_a = cMap.get(a[0])) === null || _a === void 0 ? void 0 : _a.model) || '').localeCompare(((_b = cMap.get(b[0])) === null || _b === void 0 ? void 0 : _b.model) || '', locale()); }).map(([componentId, info]) => { var _a, _b, _c; return `<tr><td>${e(((_b = tMap.get((_a = cMap.get(componentId)) === null || _a === void 0 ? void 0 : _a.typeId)) === null || _b === void 0 ? void 0 : _b.name) || t('未知类型', 'Unknown Type'))}</td><td>${e(((_c = cMap.get(componentId)) === null || _c === void 0 ? void 0 : _c.model) || t('未知元器件', 'Unknown Component'))}</td><td>${info.total}</td><td>${e(Array.from(info.names).join(t('，', ', ')))}</td></tr>`; }).join('') || `<tr><td colspan="4" class="empty-state">${e(t('暂无统计数据。', 'No summary data.'))}</td></tr>`}</tbody></table></div></section><section class="panel-card"><h2>${e(t('项目与 PCB', 'Projects and PCB'))}</h2><div class="stack-list">${sort(state.db.projects.filter((item) => state.projectFilter === 'all' || item.id === state.projectFilter), (item) => item.name).map((project) => `<article class="entity-card"><header class="entity-header"><div><h3>${e(project.name)}</h3><p>${e(project.note || t('无项目备注', 'No note'))}</p></div><div class="inline-actions"><button class="ghost-button" type="button" data-action="edit-project" data-id="${project.id}">${e(t('编辑', 'Edit'))}</button><button class="danger-button" type="button" data-action="delete-project" data-id="${project.id}">${e(t('删除', 'Delete'))}</button></div></header><div class="stack-list nested-list">${sort(state.db.pcbs.filter((item) => item.projectId === project.id), (item) => `${item.name}${item.version}`).map((pcb) => `<div class="list-row"><div><strong>${e(`${pcb.name}${pcb.version ? ` (${pcb.version})` : ''}`)}</strong><p>${e(t(`项目数量 ${pcb.boardQuantity} / BOM ${pcb.items.length}`, `Qty ${pcb.boardQuantity} / BOM ${pcb.items.length}`))}</p></div><div class="inline-actions"><button class="primary-button" type="button" data-action="bom-modal" data-pcb-id="${pcb.id}">${e(t('维护 BOM', 'Manage BOM'))}</button><button class="ghost-button" type="button" data-action="edit-pcb" data-id="${pcb.id}">${e(t('编辑', 'Edit'))}</button><button class="danger-button" type="button" data-action="delete-pcb" data-id="${pcb.id}">${e(t('删除', 'Delete'))}</button></div></div>`).join('') || `<p class="empty-state">${e(t('暂无 PCB。', 'No PCB.'))}</p>`}</div></article>`).join('') || `<p class="empty-state">${e(t('暂无项目数据。', 'No project data.'))}</p>`}</div></section>`;
    }
    function storesView() {
        const current = active('stores', state.editingStoreId);
        return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(current ? t('编辑店铺', 'Edit Store') : t('新增店铺', 'New Store'))}</h2><form id="store-form" class="stack-form"><input type="hidden" name="storeId" value="${e((current === null || current === void 0 ? void 0 : current.id) || '')}" /><label><span>${e(t('平台', 'Platform'))}</span><input name="platform" required value="${e((current === null || current === void 0 ? void 0 : current.platform) || '')}" /></label><label><span>${e(t('店铺名称', 'Store Name'))}</span><input name="shopName" required value="${e((current === null || current === void 0 ? void 0 : current.shopName) || '')}" /></label><label><span>${e(t('质量评分', 'Quality'))}</span><input name="qualityScore" type="number" min="0" max="5" step="0.1" value="${e((current === null || current === void 0 ? void 0 : current.qualityScore) || 5)}" /></label><label><span>${e(t('价格评分', 'Price'))}</span><input name="priceScore" type="number" min="0" max="5" step="0.1" value="${e((current === null || current === void 0 ? void 0 : current.priceScore) || 5)}" /></label><label><span>${e(t('邮费', 'Shipping'))}</span><input name="shippingFee" type="number" min="0" step="0.01" value="${e((current === null || current === void 0 ? void 0 : current.shippingFee) || 0)}" /></label><label><span>${e(t('参考价格', 'Reference Price'))}</span><input name="referencePrice" type="number" min="0" step="0.01" value="${e((current === null || current === void 0 ? void 0 : current.referencePrice) || 0)}" /></label><label><span>${e(t('主卖品', 'Products'))}</span><textarea name="mainProducts">${e((current === null || current === void 0 ? void 0 : current.mainProducts) || '')}</textarea></label><label><span>${e(t('备注', 'Note'))}</span><textarea name="note">${e((current === null || current === void 0 ? void 0 : current.note) || '')}</textarea></label><div class="inline-actions"><button class="primary-button" type="submit">${e(current ? t('更新', 'Update') : t('新增', 'Create'))}</button>${current ? `<button class="ghost-button" type="button" data-action="cancel-store">${e(t('取消', 'Cancel'))}</button>` : ''}</div></form></article><article class="panel-card"><h2>${e(t('店铺列表', 'Store List'))}</h2><div class="stack-list">${sort(state.db.stores, (item) => `${item.platform}${item.shopName}`).map((item) => `<div class="list-row"><div><strong>${e(`${item.platform} / ${item.shopName}`)}</strong><p>${e(`Q ${item.qualityScore.toFixed(1)} / P ${item.priceScore.toFixed(1)} / ¥${item.referencePrice.toFixed(2)}`)}</p>${item.mainProducts ? `<p>${e(item.mainProducts)}</p>` : ''}</div><div class="inline-actions"><button class="ghost-button" type="button" data-action="edit-store" data-id="${item.id}">${e(t('编辑', 'Edit'))}</button><button class="danger-button" type="button" data-action="delete-store" data-id="${item.id}">${e(t('删除', 'Delete'))}</button></div></div>`).join('') || `<p class="empty-state">${e(t('暂无店铺数据。', 'No store data.'))}</p>`}</div></article></section>`;
    }
    function settingsView() {
        return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(t('界面偏好', 'Preferences'))}</h2><form id="prefs-form" class="stack-form"><label><span>${e(t('语言', 'Language'))}</span><select name="lang"><option value="zh" ${state.prefs.lang === 'zh' ? 'selected' : ''}>中文</option><option value="en" ${state.prefs.lang === 'en' ? 'selected' : ''}>English</option></select></label><label><span>${e(t('主题', 'Theme'))}</span><select name="theme"><option value="light" ${state.prefs.theme === 'light' ? 'selected' : ''}>${e(t('亮色', 'Light'))}</option><option value="dark" ${state.prefs.theme === 'dark' ? 'selected' : ''}>${e(t('暗色', 'Dark'))}</option></select></label><button class="primary-button" type="submit">${e(t('保存偏好', 'Save'))}</button></form></article><article class="panel-card"><h2>${e(t('插件存储', 'Plugin Storage'))}</h2><ul class="info-list"><li>${e(t(`当前共 ${state.db.types.length} 个类型、${state.db.components.length} 个元器件、${state.db.projects.length} 个项目。`, `Current totals: ${state.db.types.length} types, ${state.db.components.length} components, ${state.db.projects.length} projects.`))}</li></ul><div class="inline-actions"><button class="ghost-button" data-action="import">${e(t('导入', 'Import'))}</button><button class="ghost-button" data-action="export-json">${e(t('导出 JSON', 'Export JSON'))}</button><button class="ghost-button" data-action="export-xlsx">${e(t('导出 Excel(.xlsx)', 'Export Excel (.xlsx)'))}</button><button class="danger-button" data-action="reset">${e(t('重置数据', 'Reset Data'))}</button></div></article></section>`;
    }
    function modal() {
        if (!state.modal)
            return '';
        if (state.modal.type === 'xlsx-map')
            return xlsxMapModal();
        if (state.modal.type === 'record')
            return recordModal();
        if (state.modal.type === 'bom')
            return bomModal();
        return '';
    }
    function xlsxMapModal() {
        var _a, _b, _c;
        const workbook = state.modal.workbook;
        const sheetName = state.modal.sheetName;
        const targetKind = state.modal.targetKind;
        const sheetNames = ((_a = workbook === null || workbook === void 0 ? void 0 : workbook.sheets) === null || _a === void 0 ? void 0 : _a.map((sheet) => sheet.name)) || [];
        const currentSheet = ((_b = workbook === null || workbook === void 0 ? void 0 : workbook.sheets) === null || _b === void 0 ? void 0 : _b.find((sheet) => sheet.name === sheetName)) || null;
        const headers = (((_c = currentSheet === null || currentSheet === void 0 ? void 0 : currentSheet.rows) === null || _c === void 0 ? void 0 : _c[0]) || []).map((item) => String(item || '').trim()).filter(Boolean);
        const options = (value) => `<option value="${e(value)}">${e(value)}</option>`;
        const mapRow = (idValue, labelZh, labelEn, required) => {
            return `<label><span>${e(t(labelZh, labelEn))}${required ? ' *' : ''}</span><select name="${e(idValue)}"><option value="">${e(t('不映射', 'Ignore'))}</option>${headers.map(options).join('')}</select></label>`;
        };
        return `<div class="modal-backdrop" data-action="close-modal"><div class="modal-panel wide-panel" data-modal-root="true"><div class="section-head"><h2>${e(t('Excel 导入映射', 'Excel Import Mapping'))}</h2><button class="ghost-button" type="button" data-action="close-modal">${e(t('关闭', 'Close'))}</button></div><form id="xlsx-map-form" class="stack-form"><div class="card-grid two-col"><label><span>${e(t('选择工作表', 'Worksheet'))}</span><select name="sheetName" data-xlsx-map="sheet">${sheetNames.map((name) => `<option value="${e(name)}" ${name === sheetName ? 'selected' : ''}>${e(name)}</option>`).join('')}</select></label><label><span>${e(t('导入为', 'Import As'))}</span><select name="targetKind" data-xlsx-map="target"><option value="components" ${targetKind === 'components' ? 'selected' : ''}>${e(t('元器件列表', 'Components'))}</option><option value="types" ${targetKind === 'types' ? 'selected' : ''}>${e(t('类型列表', 'Types'))}</option><option value="projects" ${targetKind === 'projects' ? 'selected' : ''}>${e(t('项目列表', 'Projects'))}</option><option value="stores" ${targetKind === 'stores' ? 'selected' : ''}>${e(t('店铺列表', 'Stores'))}</option></select></label></div>${currentSheet ? `<div class="card-grid two-col">${targetKind === 'components' ? `${mapRow('typeName', '类型列', 'Type column', true)}${mapRow('model', '型号列', 'Model column', true)}${mapRow('auxInfo', '辅助信息列', 'Aux info column', false)}${mapRow('note', '备注列', 'Note column', false)}${mapRow('warningThreshold', '预警阈值列', 'Warning threshold column', false)}` : ''}${targetKind === 'types' ? `${mapRow('name', '类型名称列', 'Type name column', true)}${mapRow('primaryName', '一级类型列', 'Primary type column', false)}${mapRow('secondaryName', '二级类型列', 'Secondary type column', false)}` : ''}${targetKind === 'projects' ? `${mapRow('name', '项目名称列', 'Project name column', true)}${mapRow('note', '备注列', 'Note column', false)}` : ''}${targetKind === 'stores' ? `${mapRow('platform', '平台列', 'Platform column', true)}${mapRow('shopName', '店铺名称列', 'Shop name column', true)}${mapRow('qualityScore', '质量评分列', 'Quality score column', false)}${mapRow('priceScore', '价格评分列', 'Price score column', false)}${mapRow('shippingFee', '邮费列', 'Shipping fee column', false)}${mapRow('referencePrice', '参考价格列', 'Reference price column', false)}${mapRow('mainProducts', '主卖品列', 'Main products column', false)}${mapRow('note', '备注列', 'Note column', false)}` : ''}</div>` : `<p class="empty-state">${e(t('未找到可用工作表。', 'No worksheet found.'))}</p>`}<button class="primary-button" type="submit">${e(t('开始导入', 'Import'))}</button></form></div></div>`;
    }
    function recordModal() {
        const component = state.db.components.find((item) => item.id === state.modal.componentId);
        if (!component)
            return '';
        const record = state.modal.recordId ? component.records.find((item) => item.id === state.modal.recordId) : null;
        return `<div class="modal-backdrop" data-action="close-modal"><div class="modal-panel" data-modal-root="true"><div class="section-head"><h2>${e(record ? t('编辑采购记录', 'Edit Record') : t('新增采购记录', 'Add Record'))}</h2><button class="ghost-button" type="button" data-action="close-modal">${e(t('关闭', 'Close'))}</button></div><form id="record-form" class="stack-form"><input type="hidden" name="componentId" value="${component.id}" /><input type="hidden" name="recordId" value="${e((record === null || record === void 0 ? void 0 : record.id) || '')}" /><label><span>${e(t('关联店铺', 'Linked Store'))}</span><select name="storeId"><option value="">${e(t('不关联店铺', 'No linked store'))}</option>${sort(state.db.stores, (item) => `${item.platform}${item.shopName}`).map((item) => `<option value="${item.id}" ${(record === null || record === void 0 ? void 0 : record.storeId) === item.id ? 'selected' : ''}>${e(`${item.platform} / ${item.shopName}`)}</option>`).join('')}</select></label><label><span>${e(t('平台', 'Platform'))}</span><input name="platform" required value="${e((record === null || record === void 0 ? void 0 : record.platform) || '')}" /></label><label><span>${e(t('购买链接', 'Link'))}</span><input name="link" required value="${e((record === null || record === void 0 ? void 0 : record.link) || '')}" /></label><label><span>${e(t('数量', 'Quantity'))}</span><input name="quantity" type="number" min="1" step="1" required value="${e((record === null || record === void 0 ? void 0 : record.quantity) || 1)}" /></label><label><span>${e(t('单价', 'Unit Price'))}</span><input name="pricePerUnit" type="number" min="0" step="0.01" required value="${e((record === null || record === void 0 ? void 0 : record.pricePerUnit) || 0)}" /></label><button class="primary-button" type="submit">${e(record ? t('保存', 'Save') : t('新增', 'Add'))}</button></form></div></div>`;
    }
    function bomModal() {
        const pcb = state.db.pcbs.find((item) => item.id === state.modal.pcbId);
        if (!pcb)
            return '';
        const current = state.modal.itemId ? pcb.items.find((item) => item.id === state.modal.itemId) : null;
        const cMap = new Map(state.db.components.map((item) => [item.id, item]));
        const tMap = typeMap();
        return `<div class="modal-backdrop" data-action="close-modal"><div class="modal-panel wide-panel" data-modal-root="true"><div class="section-head"><h2>${e(current ? t('编辑 BOM 明细', 'Edit BOM Item') : t('新增 BOM 明细', 'Add BOM Item'))}</h2><button class="ghost-button" type="button" data-action="close-modal">${e(t('关闭', 'Close'))}</button></div><form id="bom-form" class="stack-form"><input type="hidden" name="pcbId" value="${pcb.id}" /><input type="hidden" name="itemId" value="${e((current === null || current === void 0 ? void 0 : current.id) || '')}" /><label><span>${e(t('元器件', 'Component'))}</span><select name="componentId" required><option value="">${e(t('请选择元器件', 'Select Component'))}</option>${sort(state.db.components, (item) => item.model).map((item) => { var _a; return `<option value="${item.id}" ${(current === null || current === void 0 ? void 0 : current.componentId) === item.id ? 'selected' : ''}>${e(`${((_a = tMap.get(item.typeId)) === null || _a === void 0 ? void 0 : _a.name) || t('未知类型', 'Unknown Type')} / ${item.model}`)}</option>`; }).join('')}</select></label><label><span>${e(t('单板需求数量', 'Qty per Board'))}</span><input name="quantityPerBoard" type="number" min="1" step="1" required value="${e((current === null || current === void 0 ? void 0 : current.quantityPerBoard) || 1)}" /></label><button class="primary-button" type="submit">${e(current ? t('保存', 'Save') : t('新增', 'Add'))}</button></form><div class="table-wrap"><table><thead><tr><th>${e(t('类型', 'Type'))}</th><th>${e(t('型号', 'Model'))}</th><th>${e(t('单板需求', 'Per Board'))}</th><th>${e(t('项目总需求', 'Project Total'))}</th><th>${e(t('操作', 'Actions'))}</th></tr></thead><tbody>${sort(pcb.items, (item) => { var _a; return ((_a = cMap.get(item.componentId)) === null || _a === void 0 ? void 0 : _a.model) || ''; }).map((item) => { var _a, _b, _c; return `<tr><td>${e(((_b = tMap.get((_a = cMap.get(item.componentId)) === null || _a === void 0 ? void 0 : _a.typeId)) === null || _b === void 0 ? void 0 : _b.name) || t('未知类型', 'Unknown Type'))}</td><td>${e(((_c = cMap.get(item.componentId)) === null || _c === void 0 ? void 0 : _c.model) || t('未知元器件', 'Unknown Component'))}</td><td>${item.quantityPerBoard}</td><td>${item.quantityPerBoard * pcb.boardQuantity}</td><td><div class="inline-actions"><button class="ghost-button" type="button" data-action="bom-modal" data-pcb-id="${pcb.id}" data-item-id="${item.id}">${e(t('编辑', 'Edit'))}</button><button class="danger-button" type="button" data-action="delete-bom-item" data-pcb-id="${pcb.id}" data-item-id="${item.id}">${e(t('删除', 'Delete'))}</button></div></td></tr>`; }).join('') || `<tr><td colspan="5" class="empty-state">${e(t('暂无 BOM 明细。', 'No BOM items.'))}</td></tr>`}</tbody></table></div></div></div>`;
    }
    function jsonText() {
        return `${JSON.stringify(state.db, null, 2)}\n`;
    }
    function excelText() {
        const tMap = typeMap();
        const pMap = projectMap();
        const sMap = storeMap();
        const table = (title, headers, rows) => `<h2>${e(title)}</h2><table><thead><tr>${headers.map((item) => `<th>${e(item)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((item) => `<td>${e(item)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
        return `\uFEFF<html><head><meta charset="utf-8" /><style>body{font-family:"Microsoft YaHei",sans-serif}table{border-collapse:collapse;width:100%;margin-bottom:14px}th,td{border:1px solid #ccd4e4;padding:6px 8px;font-size:12px}th{background:#edf2ff}</style></head><body>${table('类型', ['id', '名称', '一级类型', '二级类型'], state.db.types.map((item) => [item.id, item.name, item.primaryName, item.secondaryName || '']))}${table('项目', ['id', '名称', '备注'], state.db.projects.map((item) => [item.id, item.name, item.note]))}${table('元器件', ['id', '类型', '型号', '总库存', '预警阈值', '最低价格'], state.db.components.map((item) => { var _a, _b; return [item.id, ((_a = tMap.get(item.typeId)) === null || _a === void 0 ? void 0 : _a.name) || '未知类型', item.model, item.totalQuantity, item.warningThreshold, (_b = item.lowestPrice) !== null && _b !== void 0 ? _b : '']; }))}${table('采购记录', ['记录id', '元器件', '店铺', '平台', '数量', '单价', '时间'], state.db.components.flatMap((component) => component.records.map((record) => { var _a, _b; return [record.id, component.model, record.storeId ? `${((_a = sMap.get(record.storeId)) === null || _a === void 0 ? void 0 : _a.platform) || ''}/${((_b = sMap.get(record.storeId)) === null || _b === void 0 ? void 0 : _b.shopName) || ''}` : '-', record.platform, record.quantity, record.pricePerUnit, record.purchasedAt]; })))}${table('PCB', ['id', '项目', 'PCB', '版本', '数量'], state.db.pcbs.map((item) => { var _a; return [item.id, ((_a = pMap.get(item.projectId)) === null || _a === void 0 ? void 0 : _a.name) || '未知项目', item.name, item.version, item.boardQuantity]; }))}</body></html>`;
    }
    function parseCsv(text) {
        const split = (line) => { const result = []; let current = ''; let quoted = false; for (let i = 0; i < line.length; i += 1) {
            const char = line[i];
            if (char === '"') {
                if (quoted && line[i + 1] === '"') {
                    current += '"';
                    i += 1;
                }
                else {
                    quoted = !quoted;
                }
            }
            else if (char === ',' && !quoted) {
                result.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        } result.push(current.trim()); return result; };
        const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        if (lines.length < 2)
            return [];
        const headers = split(lines[0]);
        return lines.slice(1).map((line) => { const values = split(line); const row = {}; headers.forEach((header, index) => { row[header] = values[index] || ''; }); return row; });
    }
    function importItems(items) {
        let count = 0;
        items.forEach((item) => {
            const typeName = String(item.typeName || item.type || '').trim();
            const model = String(item.model || '').trim();
            if (!typeName || !model)
                return;
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
        return String(value !== null && value !== void 0 ? value : '')
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
            for (let k = 0; k < 8; k += 1)
                c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            table[i] = c >>> 0;
        }
        return table;
    }
    const _crc32Table = crc32Table();
    function crc32(bytes) {
        let c = 0xffffffff;
        for (let i = 0; i < bytes.length; i += 1)
            c = _crc32Table[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
        return (c ^ 0xffffffff) >>> 0;
    }
    function u16(dv, off) { return dv.getUint16(off, true); }
    function u32(dv, off) { return dv.getUint32(off, true); }
    function setU16(dv, off, value) { dv.setUint16(off, value, true); }
    function setU32(dv, off, value) { dv.setUint32(off, value, true); }
    function utf8Encode(text) {
        return new TextEncoder().encode(String(text !== null && text !== void 0 ? text : ''));
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
            if (u32(dv, i) === SIG_EOCD) {
                eocd = i;
                break;
            }
        }
        if (eocd < 0)
            throw new Error(t('不是有效的 xlsx 文件（缺少 EOCD）。', 'Invalid .xlsx (missing EOCD).'));
        const totalEntries = u16(dv, eocd + 10);
        const cdirSize = u32(dv, eocd + 12);
        const cdirOffset = u32(dv, eocd + 16);
        if (cdirOffset + cdirSize > bytes.length)
            throw new Error(t('xlsx 文件已损坏（中央目录越界）。', 'Corrupted .xlsx (central directory out of range).'));
        const out = new Map();
        let off = cdirOffset;
        for (let i = 0; i < totalEntries; i += 1) {
            if (u32(dv, off) !== SIG_CDIR)
                throw new Error(t('xlsx 文件已损坏（中央目录签名错误）。', 'Corrupted .xlsx (bad central directory signature).'));
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
            if (u32(dv, localOffset) !== SIG_LFH)
                throw new Error(t('xlsx 文件已损坏（本地头签名错误）。', 'Corrupted .xlsx (bad local header signature).'));
            const localNameLen = u16(dv, localOffset + 26);
            const localExtraLen = u16(dv, localOffset + 28);
            const dataStart = localOffset + 30 + localNameLen + localExtraLen;
            const dataEnd = dataStart + compSize;
            if (dataEnd > bytes.length)
                throw new Error(t('xlsx 文件已损坏（数据越界）。', 'Corrupted .xlsx (data out of range).'));
            const compData = bytes.slice(dataStart, dataEnd);
            let data;
            if (compMethod === 0)
                data = compData;
            else if (compMethod === 8)
                data = await inflateRaw(compData);
            else
                throw new Error(t(`不支持的压缩方式: ${compMethod}`, `Unsupported compression method: ${compMethod}`));
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
        for (const part of localParts) {
            out.set(part, w);
            w += part.length;
        }
        for (const part of centralParts) {
            out.set(part, w);
            w += part.length;
        }
        out.set(eocd, w);
        return out;
    }
    function sheetXml(rows) {
        const safeRows = Array.isArray(rows) ? rows : [];
        let maxCol = 1;
        for (const row of safeRows)
            maxCol = Math.max(maxCol, Array.isArray(row) ? row.length : 0);
        const maxRow = Math.max(1, safeRows.length || 1);
        const dim = `A1:${colName(maxCol || 1)}${maxRow}`;
        const rowXml = safeRows.map((row, rowIndex) => {
            const r = rowIndex + 1;
            const cells = (row || []).map((value, colIndex) => {
                if (value === null || value === undefined || value === '')
                    return '';
                const ref = `${colName(colIndex + 1)}${r}`;
                if (typeof value === 'number' && Number.isFinite(value))
                    return `<c r="${ref}"><v>${value}</v></c>`;
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
        const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
            `<sheets>${workbookSheetsXml}</sheets>` +
            `</workbook>`;
        const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
            visibleSheets.map((sheet, idx) => `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`).join('') +
            `<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
            `</Relationships>`;
        const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
            `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
            `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>` +
            `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>` +
            `</Relationships>`;
        const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
            `<fonts count="1"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font></fonts>` +
            `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
            `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
            `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
            `<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>` +
            `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
            `</styleSheet>`;
        const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
            `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
            `<Default Extension="xml" ContentType="application/xml"/>` +
            `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
            visibleSheets.map((sheet, idx) => `<Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
            `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
            `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
            `<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>` +
            `</Types>`;
        const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
            `<dc:title>bom-manager</dc:title>` +
            `<dc:creator>bom-manager</dc:creator>` +
            `<cp:lastModifiedBy>bom-manager</cp:lastModifiedBy>` +
            `<dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created>` +
            `<dcterms:modified xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:modified>` +
            `</cp:coreProperties>`;
        const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
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
        if (!m)
            return 0;
        const letters = m[0].toUpperCase();
        let n = 0;
        for (let i = 0; i < letters.length; i += 1)
            n = n * 26 + (letters.charCodeAt(i) - 64);
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
        var _a, _b, _c;
        const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
        const sheetData = doc.getElementsByTagName('sheetData')[0];
        if (!sheetData)
            return [];
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
                    const v = ((_a = cell.getElementsByTagName('v')[0]) === null || _a === void 0 ? void 0 : _a.textContent) || '';
                    const idx = Number(v);
                    value = (_b = sharedStrings[idx]) !== null && _b !== void 0 ? _b : '';
                }
                else if (type === 'inlineStr') {
                    const tNode = cell.getElementsByTagName('t')[0];
                    value = (tNode === null || tNode === void 0 ? void 0 : tNode.textContent) || '';
                }
                else {
                    const v = ((_c = cell.getElementsByTagName('v')[0]) === null || _c === void 0 ? void 0 : _c.textContent) || '';
                    value = v;
                }
                row[col] = value;
            }
            for (let i = 0; i <= maxCol; i += 1)
                if (row[i] === undefined)
                    row[i] = '';
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
        if (!workbookXml)
            throw new Error(t('xlsx 文件缺少 workbook.xml。', 'Missing xl/workbook.xml.'));
        const workbookDoc = new DOMParser().parseFromString(workbookXml, 'application/xml');
        const sheetNodes = Array.from(workbookDoc.getElementsByTagName('sheet'));
        const relsXml = getText('xl/_rels/workbook.xml.rels');
        const relDoc = relsXml ? new DOMParser().parseFromString(relsXml, 'application/xml') : null;
        const rels = new Map();
        if (relDoc) {
            for (const rel of Array.from(relDoc.getElementsByTagName('Relationship'))) {
                const idValue = rel.getAttribute('Id') || '';
                const target = rel.getAttribute('Target') || '';
                if (idValue && target)
                    rels.set(idValue, target);
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
        var _a, _b;
        const meta = workbook.sheets.find((sheet) => sheet.name === '__BOM_MANAGER__');
        if (!meta)
            return false;
        const first = String(((_b = (_a = meta.rows) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b[0]) || '').trim();
        return first === 'bom-manager-export';
    }
    async function importBomManagerExportXlsx(workbook) {
        const dbSheet = workbook.sheets.find((sheet) => sheet.name === '__BOM_DB__');
        if (!dbSheet)
            throw new Error(t('未找到内置数据库工作表（__BOM_DB__）。', 'Missing embedded database sheet (__BOM_DB__).'));
        const chunks = (dbSheet.rows || []).map((row) => String((row === null || row === void 0 ? void 0 : row[0]) || '')).join('');
        if (!chunks.trim())
            throw new Error(t('内置数据库为空。', 'Embedded database is empty.'));
        const parsed = JSON.parse(chunks);
        state.db = nDb(parsed);
        await saveDb();
        setStatus('success', t('xlsx 数据库已导入。', 'XLSX database imported.'));
        render();
    }
    function openXlsxMapping(workbook, fileName) {
        const firstVisible = workbook.sheets.find((sheet) => !sheet.hidden) || workbook.sheets[0] || null;
        if (!firstVisible)
            throw new Error(t('xlsx 内没有可用工作表。', 'No worksheet found in .xlsx.'));
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
        var _a;
        if (!headerName)
            return '';
        const idx = headers.findIndex((h) => String(h || '').trim() === String(headerName || '').trim());
        return idx >= 0 ? String((_a = row === null || row === void 0 ? void 0 : row[idx]) !== null && _a !== void 0 ? _a : '').trim() : '';
    }
    async function importXlsxMapped(values) {
        if (!state.modal || state.modal.type !== 'xlsx-map')
            return;
        const workbook = state.modal.workbook;
        const sheetName = String(values.sheetName || state.modal.sheetName || '').trim();
        const targetKind = String(values.targetKind || state.modal.targetKind || '').trim();
        const sheet = workbook.sheets.find((item) => item.name === sheetName);
        if (!sheet)
            throw new Error(t('选择的工作表不存在。', 'Selected worksheet not found.'));
        const rows = sheet.rows || [];
        if (rows.length < 2)
            throw new Error(t('工作表没有数据行。', 'Worksheet has no data rows.'));
        const headers = (rows[0] || []).map((h) => String(h || '').trim());
        const body = rows.slice(1);
        if (targetKind === 'components') {
            const typeHeader = String(values.typeName || '').trim();
            const modelHeader = String(values.model || '').trim();
            if (!typeHeader || !modelHeader)
                throw new Error(t('请映射 类型列 与 型号列。', 'Please map Type column and Model column.'));
            const items = [];
            for (const row of body) {
                const typeName = pickRowValueByHeader(headers, row, typeHeader);
                const model = pickRowValueByHeader(headers, row, modelHeader);
                if (!typeName || !model)
                    continue;
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
            if (!nameHeader && !primaryHeader)
                throw new Error(t('请映射 类型名称列 或 一级类型列。', 'Please map Type name column or Primary type column.'));
            let count = 0;
            for (const row of body) {
                const name = nameHeader ? pickRowValueByHeader(headers, row, nameHeader) : '';
                const primaryName = primaryHeader ? pickRowValueByHeader(headers, row, primaryHeader) : '';
                const secondaryName = secondaryHeader ? pickRowValueByHeader(headers, row, secondaryHeader) : '';
                const resolved = String(name || (secondaryName ? `${primaryName}/${secondaryName}` : primaryName) || '').trim();
                if (!resolved)
                    continue;
                if (state.db.types.some((item) => item.name.toLowerCase() === resolved.toLowerCase()))
                    continue;
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
            if (!nameHeader)
                throw new Error(t('请映射 项目名称列。', 'Please map Project name column.'));
            const noteHeader = String(values.note || '').trim();
            let count = 0;
            for (const row of body) {
                const name = pickRowValueByHeader(headers, row, nameHeader);
                if (!name)
                    continue;
                const note = noteHeader ? pickRowValueByHeader(headers, row, noteHeader) : '';
                if (state.db.projects.some((item) => item.name.toLowerCase() === name.toLowerCase()))
                    continue;
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
            if (!platformHeader || !shopHeader)
                throw new Error(t('请映射 平台列 与 店铺名称列。', 'Please map Platform column and Shop name column.'));
            const pickNum = (row, header) => {
                const raw = header ? pickRowValueByHeader(headers, row, header) : '';
                const n = Number(raw);
                return Number.isFinite(n) ? n : 0;
            };
            let count = 0;
            for (const row of body) {
                const platform = pickRowValueByHeader(headers, row, platformHeader);
                const shopName = pickRowValueByHeader(headers, row, shopHeader);
                if (!platform || !shopName)
                    continue;
                const key = `${platform}`.toLowerCase() + '::' + `${shopName}`.toLowerCase();
                if (state.db.stores.some((item) => `${item.platform}`.toLowerCase() + '::' + `${item.shopName}`.toLowerCase() === key))
                    continue;
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
        if (!file)
            return;
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
            if (!map.typeName || !map.model)
                throw new Error(t('CSV 缺少可识别的类型或型号列。', 'CSV is missing recognizable type/model columns.'));
            const items = [];
            const grouped = new Map();
            rows.forEach((row) => {
                const pick = (field) => (map[field] ? String(row[map[field]] || '').trim() : '');
                const typeName = pick('typeName');
                const model = pick('model');
                if (!typeName || !model)
                    return;
                const groupKey = `${typeName}::${model}`;
                if (!grouped.has(groupKey))
                    grouped.set(groupKey, { typeName, model, auxInfo: pick('auxInfo'), note: pick('note'), warningThreshold: Number(pick('warningThreshold') || 0), records: [] });
                if (pick('platform') && pick('link') && Number(pick('quantity') || 0) > 0)
                    grouped.get(groupKey).records.push({ platform: pick('platform'), link: pick('link'), quantity: Number(pick('quantity') || 0), pricePerUnit: Number(pick('pricePerUnit') || 0) });
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
    async function exportJson() {
        await edaApi.sys_FileSystem.saveFile(new Blob([jsonText()], { type: 'application/json;charset=utf-8' }), 'bom-data.json');
        setStatus('success', t('JSON 已导出。', 'JSON exported.'));
        render();
    }
    function bomManagerExportSheets() {
        const tMap = typeMap();
        const pMap = projectMap();
        const sMap = storeMap();
        const dbJson = JSON.stringify(state.db);
        const chunkSize = 20000;
        const chunks = [];
        for (let i = 0; i < dbJson.length; i += chunkSize)
            chunks.push([dbJson.slice(i, i + chunkSize)]);
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
            ...sort(state.db.components, (item) => { var _a; return `${((_a = tMap.get(item.typeId)) === null || _a === void 0 ? void 0 : _a.name) || ''}${item.model}`; }).map((item) => {
                var _a;
                return [
                    ((_a = tMap.get(item.typeId)) === null || _a === void 0 ? void 0 : _a.name) || '',
                    item.model,
                    item.totalQuantity,
                    item.warningThreshold,
                    item.lowestPrice === null ? '' : item.lowestPrice,
                    item.auxInfo || '',
                    item.note || '',
                ];
            }),
        ];
        const recordsRows = [
            [t('类型', 'Type'), t('型号', 'Model'), t('店铺', 'Store'), t('平台', 'Platform'), t('链接', 'Link'), t('数量', 'Qty'), t('单价', 'Price'), t('时间', 'Purchased At')],
            ...state.db.components.flatMap((component) => component.records.map((record) => {
                var _a, _b, _c;
                return [
                    ((_a = tMap.get(component.typeId)) === null || _a === void 0 ? void 0 : _a.name) || '',
                    component.model,
                    record.storeId ? `${((_b = sMap.get(record.storeId)) === null || _b === void 0 ? void 0 : _b.platform) || ''}/${((_c = sMap.get(record.storeId)) === null || _c === void 0 ? void 0 : _c.shopName) || ''}` : '',
                    record.platform,
                    record.link,
                    record.quantity,
                    record.pricePerUnit,
                    record.purchasedAt,
                ];
            })),
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
            ...sort(state.db.pcbs, (item) => { var _a; return `${((_a = pMap.get(item.projectId)) === null || _a === void 0 ? void 0 : _a.name) || ''}${item.name}${item.version}`; }).map((item) => {
                var _a;
                return [
                    ((_a = pMap.get(item.projectId)) === null || _a === void 0 ? void 0 : _a.name) || '',
                    item.name,
                    item.version || '',
                    item.boardQuantity,
                    item.note || '',
                ];
            }),
        ];
        const bomRows = [
            [t('项目', 'Project'), t('PCB', 'PCB'), t('版本', 'Version'), t('类型', 'Type'), t('型号', 'Model'), t('单板需求', 'Qty per Board')],
            ...state.db.pcbs.flatMap((pcb) => pcb.items.map((bom) => {
                var _a, _b;
                const c = state.db.components.find((it) => it.id === bom.componentId);
                return [
                    ((_a = pMap.get(pcb.projectId)) === null || _a === void 0 ? void 0 : _a.name) || '',
                    pcb.name,
                    pcb.version || '',
                    c ? (((_b = tMap.get(c.typeId)) === null || _b === void 0 ? void 0 : _b.name) || '') : '',
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
        await edaApi.sys_FileSystem.saveFile(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'bom-data.xlsx');
        setStatus('success', t('Excel(xlsx) 已导出。', 'Excel (.xlsx) exported.'));
        render();
    }
    // Backward compatibility for older UI bindings.
    async function exportXls() {
        return exportXlsx();
    }
    async function resetData() {
        if (!window.confirm(t('确认清空全部数据？', 'Clear all data?')))
            return;
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
        if (!primaryName)
            throw new Error(t('一级类型不能为空。', 'Primary type is required.'));
        const name = secondaryName ? `${primaryName}/${secondaryName}` : primaryName;
        if (state.db.types.some((item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== values.typeId))
            throw new Error(t('类型已存在。', 'Type already exists.'));
        if (values.typeId) {
            const item = state.db.types.find((entry) => entry.id === values.typeId);
            if (!item)
                throw new Error(t('类型不存在。', 'Type not found.'));
            Object.assign(item, nType({ ...item, name, primaryName, secondaryName, updatedAt: iso() }));
        }
        else {
            state.db.types.push(nType({ id: id(), name, primaryName, secondaryName, createdAt: iso(), updatedAt: iso() }));
        }
        state.editingTypeId = null;
        await saveDb();
        setStatus('success', t('类型已保存。', 'Type saved.'));
        render();
    }
    async function deleteType(idValue) {
        if (state.db.components.some((item) => item.typeId === idValue))
            throw new Error(t('该类型仍被元器件引用。', 'This type is still referenced by components.'));
        if (!window.confirm(t('确认删除该类型？', 'Delete this type?')))
            return;
        state.db.types = state.db.types.filter((item) => item.id !== idValue);
        if (state.editingTypeId === idValue)
            state.editingTypeId = null;
        await saveDb();
        setStatus('success', t('类型已删除。', 'Type deleted.'));
        render();
    }
    async function submitComponent(values) {
        const typeId = String(values.typeId || '').trim();
        const model = String(values.model || '').trim();
        const warningThreshold = Number(values.warningThreshold || 0);
        if (!typeId || !model)
            throw new Error(t('类型和型号为必填项。', 'Type and model are required.'));
        if (warningThreshold < 0 || Number.isNaN(warningThreshold))
            throw new Error(t('预警阈值必须大于等于 0。', 'Warning threshold must be greater than or equal to 0.'));
        if (values.componentId) {
            const item = state.db.components.find((entry) => entry.id === values.componentId);
            if (!item)
                throw new Error(t('元器件不存在。', 'Component not found.'));
            Object.assign(item, nComponent({ ...item, typeId, model, auxInfo: values.auxInfo || '', note: values.note || '', warningThreshold, updatedAt: iso() }));
        }
        else {
            state.db.components.push(nComponent({ id: id(), typeId, model, auxInfo: values.auxInfo || '', note: values.note || '', warningThreshold, records: [], createdAt: iso(), updatedAt: iso() }));
        }
        state.editingComponentId = null;
        await saveDb();
        setStatus('success', t('元器件已保存。', 'Component saved.'));
        render();
    }
    async function deleteComponent(idValue) {
        if (state.db.pcbs.some((pcb) => pcb.items.some((item) => item.componentId === idValue)))
            throw new Error(t('该元器件已被 PCB BOM 引用。', 'This component is referenced by PCB BOM items.'));
        if (!window.confirm(t('确认删除该元器件？', 'Delete this component?')))
            return;
        state.db.components = state.db.components.filter((item) => item.id !== idValue);
        if (state.editingComponentId === idValue)
            state.editingComponentId = null;
        await saveDb();
        setStatus('success', t('元器件已删除。', 'Component deleted.'));
        render();
    }
    async function submitRecord(values) {
        const component = state.db.components.find((item) => item.id === values.componentId);
        if (!component)
            throw new Error(t('元器件不存在。', 'Component not found.'));
        const quantity = Number(values.quantity || 0);
        const pricePerUnit = Number(values.pricePerUnit || 0);
        if (quantity <= 0)
            throw new Error(t('数量必须大于 0。', 'Quantity must be greater than 0.'));
        if (pricePerUnit < 0)
            throw new Error(t('价格不能小于 0。', 'Price cannot be below 0.'));
        if (values.recordId) {
            const record = component.records.find((item) => item.id === values.recordId);
            if (!record)
                throw new Error(t('采购记录不存在。', 'Record not found.'));
            Object.assign(record, nRecord({ ...record, storeId: values.storeId || undefined, platform: values.platform || '', link: values.link || '', quantity, pricePerUnit, updatedAt: iso() }));
        }
        else {
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
        if (!component)
            return;
        if (!window.confirm(t('确认删除这条采购记录？', 'Delete this record?')))
            return;
        component.records = component.records.filter((item) => item.id !== recordId);
        const index = state.db.components.findIndex((item) => item.id === component.id);
        state.db.components[index] = nComponent(component);
        await saveDb();
        setStatus('success', t('采购记录已删除。', 'Record deleted.'));
        render();
    }
    async function submitProject(values) {
        const name = String(values.name || '').trim();
        if (!name)
            throw new Error(t('项目名称不能为空。', 'Project name is required.'));
        if (state.db.projects.some((item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== values.projectId))
            throw new Error(t('项目名称已存在。', 'Project name already exists.'));
        if (values.projectId) {
            const item = state.db.projects.find((entry) => entry.id === values.projectId);
            if (!item)
                throw new Error(t('项目不存在。', 'Project not found.'));
            Object.assign(item, nProject({ ...item, name, note: values.note || '', updatedAt: iso() }));
        }
        else {
            state.db.projects.push(nProject({ id: id(), name, note: values.note || '', createdAt: iso(), updatedAt: iso() }));
        }
        state.editingProjectId = null;
        await saveDb();
        setStatus('success', t('项目已保存。', 'Project saved.'));
        render();
    }
    async function deleteProject(idValue) {
        if (state.db.pcbs.some((item) => item.projectId === idValue))
            throw new Error(t('该项目下仍有 PCB。', 'This project still contains PCBs.'));
        if (!window.confirm(t('确认删除该项目？', 'Delete this project?')))
            return;
        state.db.projects = state.db.projects.filter((item) => item.id !== idValue);
        if (state.editingProjectId === idValue)
            state.editingProjectId = null;
        await saveDb();
        setStatus('success', t('项目已删除。', 'Project deleted.'));
        render();
    }
    async function submitPcb(values) {
        const projectId = String(values.projectId || '').trim();
        const name = String(values.name || '').trim();
        const version = String(values.version || '').trim();
        const boardQuantity = Number(values.boardQuantity || 1);
        if (!projectId || !name)
            throw new Error(t('所属项目和 PCB 名称为必填项。', 'Project and PCB name are required.'));
        if (boardQuantity <= 0 || Number.isNaN(boardQuantity))
            throw new Error(t('项目用板数量必须大于 0。', 'Board quantity must be greater than 0.'));
        if (state.db.pcbs.some((item) => item.projectId === projectId && item.name.toLowerCase() === name.toLowerCase() && item.version.toLowerCase() === version.toLowerCase() && item.id !== values.pcbId))
            throw new Error(t('该项目下同名同版本 PCB 已存在。', 'A PCB with the same name/version already exists in this project.'));
        if (values.pcbId) {
            const item = state.db.pcbs.find((entry) => entry.id === values.pcbId);
            if (!item)
                throw new Error(t('PCB 不存在。', 'PCB not found.'));
            Object.assign(item, nPcb({ ...item, projectId, name, version, boardQuantity, note: values.note || '', updatedAt: iso() }));
        }
        else {
            state.db.pcbs.push(nPcb({ id: id(), projectId, name, version, boardQuantity, note: values.note || '', items: [], createdAt: iso(), updatedAt: iso() }));
        }
        state.editingPcbId = null;
        await saveDb();
        setStatus('success', t('PCB 已保存。', 'PCB saved.'));
        render();
    }
    async function deletePcb(idValue) {
        if (!window.confirm(t('确认删除该 PCB？', 'Delete this PCB?')))
            return;
        state.db.pcbs = state.db.pcbs.filter((item) => item.id !== idValue);
        if (state.editingPcbId === idValue)
            state.editingPcbId = null;
        await saveDb();
        setStatus('success', t('PCB 已删除。', 'PCB deleted.'));
        render();
    }
    async function submitBom(values) {
        const pcb = state.db.pcbs.find((item) => item.id === values.pcbId);
        if (!pcb)
            throw new Error(t('PCB 不存在。', 'PCB not found.'));
        const componentId = String(values.componentId || '').trim();
        const quantityPerBoard = Number(values.quantityPerBoard || 0);
        if (!componentId || quantityPerBoard <= 0)
            throw new Error(t('元器件和数量必须有效。', 'Component and quantity are required.'));
        if (pcb.items.some((item) => item.componentId === componentId && item.id !== values.itemId))
            throw new Error(t('该 PCB 已存在相同元器件明细。', 'This PCB already contains the selected component.'));
        if (values.itemId) {
            const item = pcb.items.find((entry) => entry.id === values.itemId);
            if (!item)
                throw new Error(t('BOM 明细不存在。', 'BOM item not found.'));
            Object.assign(item, nBomItem({ ...item, componentId, quantityPerBoard, updatedAt: iso() }));
        }
        else {
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
        if (!pcb)
            return;
        if (!window.confirm(t('确认删除这条 BOM 明细？', 'Delete this BOM item?')))
            return;
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
        if (!platform || !shopName)
            throw new Error(t('平台和店铺名称为必填项。', 'Platform and store name are required.'));
        if (values.storeId) {
            const item = state.db.stores.find((entry) => entry.id === values.storeId);
            if (!item)
                throw new Error(t('店铺不存在。', 'Store not found.'));
            Object.assign(item, nStore({ ...item, platform, shopName, qualityScore: values.qualityScore, priceScore: values.priceScore, shippingFee: values.shippingFee, referencePrice: values.referencePrice, mainProducts: values.mainProducts || '', note: values.note || '', updatedAt: iso() }));
        }
        else {
            state.db.stores.push(nStore({ id: id(), platform, shopName, qualityScore: values.qualityScore, priceScore: values.priceScore, shippingFee: values.shippingFee, referencePrice: values.referencePrice, mainProducts: values.mainProducts || '', note: values.note || '', createdAt: iso(), updatedAt: iso() }));
        }
        state.editingStoreId = null;
        await saveDb();
        setStatus('success', t('店铺评价已保存。', 'Store saved.'));
        render();
    }
    async function deleteStore(idValue) {
        if (state.db.components.some((item) => item.records.some((record) => record.storeId === idValue)))
            throw new Error(t('该店铺仍被采购记录引用。', 'This store is still referenced by purchase records.'));
        if (!window.confirm(t('确认删除该店铺？', 'Delete this store?')))
            return;
        state.db.stores = state.db.stores.filter((item) => item.id !== idValue);
        if (state.editingStoreId === idValue)
            state.editingStoreId = null;
        await saveDb();
        setStatus('success', t('店铺评价已删除。', 'Store deleted.'));
        render();
    }
    app.addEventListener('input', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement))
            return;
        if (target.dataset.filter === 'component-keyword') {
            state.componentFilter.keyword = target.value;
            render();
        }
    });
    app.addEventListener('change', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement))
            return;
        if (target.dataset.filter === 'component-type') {
            state.componentFilter.typeId = target.value;
            render();
        }
        if (target.dataset.filter === 'component-warning') {
            state.componentFilter.warningOnly = target.checked;
            render();
        }
        if (target.dataset.filter === 'project-filter') {
            state.projectFilter = target.value;
            render();
        }
        if (target.dataset.xlsxMap === 'sheet' && state.modal && state.modal.type === 'xlsx-map') {
            state.modal.sheetName = target.value;
            render();
        }
        if (target.dataset.xlsxMap === 'target' && state.modal && state.modal.type === 'xlsx-map') {
            state.modal.targetKind = target.value;
            render();
        }
    });
    app.addEventListener('click', (event) => {
        const rawTarget = event.target instanceof HTMLElement ? event.target : null;
        if (!rawTarget)
            return;
        const target = rawTarget.closest('button[data-action],a[data-action]') || (rawTarget.hasAttribute('data-action') ? rawTarget : null);
        if (!target)
            return;
        const action = target.dataset.action;
        const modalRoot = event.target instanceof HTMLElement ? event.target.closest('[data-modal-root]') : null;
        if (action === 'close-modal' && modalRoot && event.target !== target)
            return;
        Promise.resolve().then(async () => {
            try {
                state.status = '';
                if (action === 'view') {
                    state.view = target.dataset.view || 'dashboard';
                    render();
                    return;
                }
                if (action === 'import')
                    return importData();
                if (action === 'export-json')
                    return exportJson();
                if (action === 'export-xlsx')
                    return exportXlsx();
                if (action === 'export-xls')
                    return exportXlsx();
                if (action === 'reset')
                    return resetData();
                if (action === 'cancel-type') {
                    state.editingTypeId = null;
                    render();
                    return;
                }
                if (action === 'edit-type') {
                    state.view = 'types';
                    state.editingTypeId = target.dataset.id;
                    render();
                    return;
                }
                if (action === 'delete-type')
                    return deleteType(target.dataset.id);
                if (action === 'cancel-component') {
                    state.editingComponentId = null;
                    render();
                    return;
                }
                if (action === 'edit-component') {
                    state.view = 'components';
                    state.editingComponentId = target.dataset.id;
                    render();
                    return;
                }
                if (action === 'delete-component')
                    return deleteComponent(target.dataset.id);
                if (action === 'record-modal') {
                    state.modal = { type: 'record', componentId: target.dataset.componentId, recordId: target.dataset.recordId || null };
                    render();
                    return;
                }
                if (action === 'delete-record')
                    return deleteRecord(target.dataset.componentId, target.dataset.recordId);
                if (action === 'cancel-project') {
                    state.editingProjectId = null;
                    render();
                    return;
                }
                if (action === 'edit-project') {
                    state.view = 'projects';
                    state.editingProjectId = target.dataset.id;
                    render();
                    return;
                }
                if (action === 'delete-project')
                    return deleteProject(target.dataset.id);
                if (action === 'cancel-pcb') {
                    state.editingPcbId = null;
                    render();
                    return;
                }
                if (action === 'edit-pcb') {
                    state.view = 'projects';
                    state.editingPcbId = target.dataset.id;
                    render();
                    return;
                }
                if (action === 'delete-pcb')
                    return deletePcb(target.dataset.id);
                if (action === 'bom-modal') {
                    state.modal = { type: 'bom', pcbId: target.dataset.pcbId, itemId: target.dataset.itemId || null };
                    render();
                    return;
                }
                if (action === 'delete-bom-item')
                    return deleteBomItem(target.dataset.pcbId, target.dataset.itemId);
                if (action === 'cancel-store') {
                    state.editingStoreId = null;
                    render();
                    return;
                }
                if (action === 'edit-store') {
                    state.view = 'stores';
                    state.editingStoreId = target.dataset.id;
                    render();
                    return;
                }
                if (action === 'delete-store')
                    return deleteStore(target.dataset.id);
                if (action === 'close-modal') {
                    state.modal = null;
                    render();
                }
            }
            catch (error) {
                setStatus('error', error instanceof Error ? error.message : t('操作失败。', 'Operation failed.'));
                render();
            }
        });
    });
    app.addEventListener('submit', (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement))
            return;
        event.preventDefault();
        const values = Object.fromEntries(new FormData(form).entries());
        Promise.resolve().then(async () => {
            try {
                state.status = '';
                if (form.id === 'type-form')
                    return submitType(values);
                if (form.id === 'component-form')
                    return submitComponent(values);
                if (form.id === 'record-form')
                    return submitRecord(values);
                if (form.id === 'project-form')
                    return submitProject(values);
                if (form.id === 'pcb-form')
                    return submitPcb(values);
                if (form.id === 'bom-form')
                    return submitBom(values);
                if (form.id === 'store-form')
                    return submitStore(values);
                if (form.id === 'xlsx-map-form')
                    return importXlsxMapped(values);
                if (form.id === 'prefs-form') {
                    state.prefs = { lang: values.lang === 'en' ? 'en' : 'zh', theme: values.theme === 'dark' ? 'dark' : 'light' };
                    await savePrefs();
                    setStatus('success', t('偏好已保存。', 'Preferences saved.'));
                    render();
                }
            }
            catch (error) {
                setStatus('error', error instanceof Error ? error.message : t('操作失败。', 'Operation failed.'));
                render();
            }
        });
    });
    render();
})();
