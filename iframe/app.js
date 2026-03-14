"use strict";
(function() {
  var _a, _b;
  const app = document.getElementById("app");
  const edaApi = window.eda || window.parent && window.parent.eda || window.top && window.top.eda;
  const DB_KEY = "bom-manager-db";
  const PREFS_KEY = "bom-manager-prefs";
  if (!app) return;
  if (!edaApi) {
    app.innerHTML = '<div class="fatal-state">\u672A\u68C0\u6D4B\u5230\u5609\u7ACB\u521B\u63D2\u4EF6\u8FD0\u884C\u73AF\u5883\uFF08IFrame \u5185\u672A\u6CE8\u5165 eda API\uFF09\u3002</div>';
    return;
  }
  try {
    const now = Date.now();
    const writeLastError = (payload) => {
      try {
        if (edaApi.sys_Storage && typeof edaApi.sys_Storage.setExtensionUserConfig === "function") {
          void edaApi.sys_Storage.setExtensionUserConfig("bom-manager-last-error", payload);
        }
      } catch (_e) {
      }
    };
    window.addEventListener("error", (event) => {
      try {
        const err = event && event.error instanceof Error ? event.error : null;
        writeLastError({
          ts: Date.now(),
          type: "error",
          message: String((event == null ? void 0 : event.message) || (err == null ? void 0 : err.message) || "unknown"),
          filename: String((event == null ? void 0 : event.filename) || ""),
          lineno: Number((event == null ? void 0 : event.lineno) || 0),
          colno: Number((event == null ? void 0 : event.colno) || 0),
          stack: (err == null ? void 0 : err.stack) ? String(err.stack) : ""
        });
      } catch (_e) {
      }
    });
    window.addEventListener("unhandledrejection", (event) => {
      try {
        const reason = event && event.reason ? event.reason : null;
        const msg = reason instanceof Error ? `${reason.name}: ${reason.message}` : typeof reason === "string" ? reason : reason ? (() => {
          try {
            return JSON.stringify(reason);
          } catch (_e) {
            return String(reason);
          }
        })() : "unknown";
        writeLastError({
          ts: Date.now(),
          type: "unhandledrejection",
          message: msg,
          stack: reason instanceof Error && reason.stack ? String(reason.stack) : ""
        });
      } catch (_e) {
      }
    });
    if (edaApi.sys_Storage && typeof edaApi.sys_Storage.setExtensionUserConfig === "function") {
      const bootInfo = {
        ts: now,
        href: String((location == null ? void 0 : location.href) || ""),
        baseURI: String((document == null ? void 0 : document.baseURI) || ""),
        userAgent: String((navigator == null ? void 0 : navigator.userAgent) || "")
      };
      void edaApi.sys_Storage.setExtensionUserConfig("bom-manager-last-boot-ts", now);
      void edaApi.sys_Storage.setExtensionUserConfig("bom-manager-last-boot", bootInfo);
    }
    if (edaApi.sys_MessageBus && typeof edaApi.sys_MessageBus.publish === "function") {
      edaApi.sys_MessageBus.publish("bom-manager-ready", { ts: now });
    }
    try {
      (_b = (_a = edaApi.sys_Log) == null ? void 0 : _a.add) == null ? void 0 : _b.call(
        _a,
        `[bom-manager iframe] boot ok ts=${now} baseURI=${String((document == null ? void 0 : document.baseURI) || "")}`,
        "info"
      );
    } catch (_e) {
    }
  } catch (_error) {
  }
  const state = {
    view: "dashboard",
    status: "",
    statusKind: "info",
    prefs: loadPrefs(),
    db: loadDb(),
    componentFilter: { keyword: "", typeId: "all", warningOnly: false },
    projectFilter: "all",
    purchase: {
      scope: "project",
      // 'project' | 'pcb'
      projectId: "all",
      pcbId: "all",
      shortageOnly: true
    },
    editingTypeId: null,
    editingComponentId: null,
    editingProjectId: null,
    editingPcbId: null,
    editingStoreId: null,
    modal: null
  };
  function id() {
    return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  function iso() {
    return (/* @__PURE__ */ new Date()).toISOString();
  }
  function t(zh, en) {
    return state.prefs.lang === "en" ? en : zh;
  }
  function locale() {
    return state.prefs.lang === "en" ? "en-US" : "zh-CN";
  }
  function e(value) {
    return String(value != null ? value : "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }
  function time(value) {
    return value ? new Date(value).toLocaleString(locale(), { hour12: false }) : "-";
  }
  function sort(list, getter) {
    return [...list].sort((a, b) => getter(a).localeCompare(getter(b), locale()));
  }
  function setStatus(kind, message) {
    state.statusKind = kind;
    state.status = message;
    try {
      edaApi.sys_Message.showToastMessage(message, kind === "error" ? "error" : "success", 3);
    } catch (_error) {
    }
  }
  function defaultDb() {
    const now = iso();
    return {
      types: [
        { id: id(), name: "\u7535\u963B", primaryName: "\u7535\u963B", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u7535\u5BB9", primaryName: "\u7535\u5BB9", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u7535\u611F", primaryName: "\u7535\u611F", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u78C1\u73E0", primaryName: "\u78C1\u73E0", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u6676\u632F", primaryName: "\u6676\u632F", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u7535\u4F4D\u5668", primaryName: "\u7535\u4F4D\u5668", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u6EE4\u6CE2\u5668", primaryName: "\u6EE4\u6CE2\u5668", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u4E8C\u6781\u7BA1", primaryName: "\u4E8C\u6781\u7BA1", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u7A33\u538B\u4E8C\u6781\u7BA1", primaryName: "\u7A33\u538B\u4E8C\u6781\u7BA1", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u4E09\u6781\u7BA1", primaryName: "\u4E09\u6781\u7BA1", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "MOSFET", primaryName: "MOSFET", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u6574\u6D41\u6865", primaryName: "\u6574\u6D41\u6865", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u5149\u8026", primaryName: "\u5149\u8026", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "LED", primaryName: "LED", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "MCU", primaryName: "MCU", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u903B\u8F91IC", primaryName: "\u903B\u8F91IC", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u5B58\u50A8\u5668", primaryName: "\u5B58\u50A8\u5668", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u8FD0\u653E", primaryName: "\u8FD0\u653E", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u6BD4\u8F83\u5668", primaryName: "\u6BD4\u8F83\u5668", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "ADC-DAC", primaryName: "ADC-DAC", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u63A5\u53E3\u8F6C\u6362", primaryName: "\u63A5\u53E3\u8F6C\u6362", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u9A71\u52A8\u5668", primaryName: "\u9A71\u52A8\u5668", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "PMIC", primaryName: "PMIC", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "LDO", primaryName: "LDO", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "DC-DC", primaryName: "DC-DC", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "TVS-ESD", primaryName: "TVS-ESD", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u4FDD\u9669\u4E1D", primaryName: "\u4FDD\u9669\u4E1D", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u81EA\u6062\u590D\u4FDD\u9669\u4E1D", primaryName: "\u81EA\u6062\u590D\u4FDD\u9669\u4E1D", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u6392\u9488\u6392\u6BCD", primaryName: "\u6392\u9488\u6392\u6BCD", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u7AEF\u5B50\u53F0", primaryName: "\u7AEF\u5B50\u53F0", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "USB", primaryName: "USB", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "Type-C", primaryName: "Type-C", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "FFC-FPC", primaryName: "FFC-FPC", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u5C04\u9891(SMA)", primaryName: "\u5C04\u9891(SMA)", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u6309\u952E", primaryName: "\u6309\u952E", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u62E8\u7801", primaryName: "\u62E8\u7801", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u65CB\u8F6C\u7F16\u7801\u5668", primaryName: "\u65CB\u8F6C\u7F16\u7801\u5668", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u7EE7\u7535\u5668", primaryName: "\u7EE7\u7535\u5668", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u8702\u9E23\u5668", primaryName: "\u8702\u9E23\u5668", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u6E29\u5EA6\u4F20\u611F\u5668", primaryName: "\u6E29\u5EA6\u4F20\u611F\u5668", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u52A0\u901F\u5EA6-\u9640\u87BA\u4EEA", primaryName: "\u52A0\u901F\u5EA6-\u9640\u87BA\u4EEA", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u5149\u5B66\u4F20\u611F\u5668", primaryName: "\u5149\u5B66\u4F20\u611F\u5668", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "\u65E0\u7EBF\u6A21\u5757(WiFi-BT)", primaryName: "\u65E0\u7EBF\u6A21\u5757(WiFi-BT)", secondaryName: "", createdAt: now, updatedAt: now },
        { id: id(), name: "GNSS", primaryName: "GNSS", secondaryName: "", createdAt: now, updatedAt: now }
      ],
      components: [],
      projects: [],
      pcbs: [],
      stores: []
    };
  }
  function emptyDb() {
    return { types: [], components: [], projects: [], pcbs: [], stores: [] };
  }
  function nType(input) {
    const primary = String(input.primaryName || input.name || "").split("/")[0].trim();
    const secondary = String(input.secondaryName || String(input.name || "").split("/")[1] || "").trim();
    return { id: input.id || id(), name: secondary ? `${primary}/${secondary}` : primary, primaryName: primary, secondaryName: secondary, createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
  }
  function nRecord(input) {
    return { id: input.id || id(), storeId: input.storeId ? String(input.storeId).trim() : void 0, platform: String(input.platform || "").trim(), link: String(input.link || "").trim(), quantity: Number(input.quantity || 0), pricePerUnit: Number(input.pricePerUnit || 0), purchasedAt: input.purchasedAt || iso(), createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
  }
  function nComponent(input) {
    const records = (input.records || []).map(nRecord);
    const totalQuantity = records.reduce((sum, item) => sum + item.quantity, 0);
    const lowestPrice = records.length ? records.reduce((min, item) => Math.min(min, item.pricePerUnit), records[0].pricePerUnit) : null;
    return { id: input.id || id(), typeId: input.typeId || "", model: String(input.model || "").trim(), auxInfo: String(input.auxInfo || "").trim(), note: String(input.note || "").trim(), warningThreshold: Number(input.warningThreshold || 0), records, totalQuantity, lowestPrice, createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
  }
  function nProject(input) {
    return { id: input.id || id(), name: String(input.name || "").trim(), note: String(input.note || "").trim(), createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
  }
  function nBomItem(input) {
    return { id: input.id || id(), componentId: input.componentId || "", quantityPerBoard: Number(input.quantityPerBoard || 0), createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
  }
  function nPcb(input) {
    return { id: input.id || id(), projectId: input.projectId || "", name: String(input.name || "").trim(), version: String(input.version || "").trim(), boardQuantity: Number(input.boardQuantity || 1), note: String(input.note || "").trim(), items: (input.items || []).map(nBomItem), createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
  }
  function nStore(input) {
    return { id: input.id || id(), platform: String(input.platform || "").trim(), shopName: String(input.shopName || "").trim(), qualityScore: Number(input.qualityScore || 0), shippingFee: Number(input.shippingFee || 0), priceScore: Number(input.priceScore || 0), referencePrice: Number(input.referencePrice || 0), mainProducts: String(input.mainProducts || "").trim(), note: String(input.note || "").trim(), createdAt: input.createdAt || iso(), updatedAt: input.updatedAt || iso() };
  }
  function nDb(input) {
    const db = input && typeof input === "object" ? input : defaultDb();
    return { types: (db.types || []).map(nType), components: (db.components || []).map(nComponent), projects: (db.projects || []).map(nProject), pcbs: (db.pcbs || []).map(nPcb), stores: (db.stores || []).map(nStore) };
  }
  function loadPrefs() {
    try {
      const value = edaApi.sys_Storage.getExtensionUserConfig(PREFS_KEY);
      return { lang: (value == null ? void 0 : value.lang) === "en" ? "en" : "zh", theme: (value == null ? void 0 : value.theme) === "dark" ? "dark" : "light" };
    } catch (_error) {
      return { lang: "zh", theme: "light" };
    }
  }
  function loadDb() {
    try {
      return nDb(edaApi.sys_Storage.getExtensionUserConfig(DB_KEY) || defaultDb());
    } catch (_error) {
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
    return `<header class="app-header"><div><p class="eyebrow">JLCEDA Plugin</p><h1>${e(t("\u7269\u6599\u7BA1\u7406\u52A9\u624B", "BOM Manager"))}</h1><p class="hero-copy">${e(t("\u5728\u63D2\u4EF6\u7A97\u53E3\u4E2D\u7EDF\u4E00\u7EF4\u62A4\u7C7B\u578B\u3001\u5143\u5668\u4EF6\u3001\u91C7\u8D2D\u8BB0\u5F55\u3001\u9879\u76EE\u3001PCB \u4E0E BOM\u3002", "Manage types, components, purchase records, projects, PCB and BOM in one place."))}</p></div><div class="header-actions"><button class="ghost-button" data-action="import">${e(t("\u5BFC\u5165", "Import"))}</button><button class="ghost-button" data-action="import-eda-bom">${e(t("\u4ECE\u5F53\u524D\u5DE5\u7A0B\u5BFC\u5165 BOM", "Import BOM from EDA"))}</button><button class="ghost-button" data-action="export-json">${e(t("\u5BFC\u51FA JSON", "Export JSON"))}</button><button class="ghost-button" data-action="export-xlsx">${e(t("\u5BFC\u51FA Excel(.xlsx)", "Export Excel (.xlsx)"))}</button></div></header>`;
  }
  function nav() {
    const items = [["dashboard", "\u6982\u89C8", "Overview"], ["components", "\u5143\u5668\u4EF6", "Components"], ["types", "\u7C7B\u578B", "Types"], ["projects", "\u9879\u76EE/PCB", "Projects/PCB"], ["purchase", "\u91C7\u8D2D\u6E05\u5355", "Purchase"], ["stores", "\u5E97\u94FA", "Stores"], ["settings", "\u8BBE\u7F6E", "Settings"]];
    return `<nav class="nav-strip">${items.map(([idValue, zh, en]) => `<button class="nav-link ${state.view === idValue ? "active" : ""}" data-action="view" data-view="${idValue}">${e(t(zh, en))}</button>`).join("")}</nav>`;
  }
  function status() {
    return state.status ? `<div class="status-banner status-${e(state.statusKind)}">${e(state.status)}</div>` : "";
  }
  function render() {
    document.documentElement.setAttribute("data-theme", state.prefs.theme);
    app.innerHTML = `<div class="app-shell">${header()}${nav()}${status()}<main class="page-content">${view()}</main>${modal()}</div>`;
  }
  function view() {
    if (state.view === "types") return typesView();
    if (state.view === "components") return componentsView();
    if (state.view === "projects") return projectsView();
    if (state.view === "purchase") return purchaseView();
    if (state.view === "stores") return storesView();
    if (state.view === "settings") return settingsView();
    return dashboardView();
  }
  function dashboardView() {
    const warningCount = state.db.components.filter(warning).length;
    const recordCount = state.db.components.reduce((sum, item) => sum + item.records.length, 0);
    const bomCount = state.db.pcbs.reduce((sum, item) => sum + item.items.length, 0);
    return `<section class="card-grid summary-grid"><article class="summary-card accent-blue"><span>${e(t("\u5143\u5668\u4EF6", "Components"))}</span><strong>${state.db.components.length}</strong></article><article class="summary-card accent-gold"><span>${e(t("\u5E93\u5B58\u9884\u8B66", "Warnings"))}</span><strong>${warningCount}</strong></article><article class="summary-card accent-green"><span>${e(t("\u91C7\u8D2D\u8BB0\u5F55", "Records"))}</span><strong>${recordCount}</strong></article><article class="summary-card accent-red"><span>${e(t("BOM \u660E\u7EC6", "BOM Items"))}</span><strong>${bomCount}</strong></article></section><section class="card-grid two-col"><article class="panel-card"><h2>${e(t("\u5FEB\u901F\u5165\u53E3", "Quick Actions"))}</h2><div class="quick-actions"><button class="primary-button" data-action="view" data-view="components">${e(t("\u65B0\u589E\u5143\u5668\u4EF6", "Add Component"))}</button><button class="ghost-button" data-action="view" data-view="projects">${e(t("\u7EF4\u62A4\u9879\u76EE/PCB", "Manage Projects/PCB"))}</button><button class="ghost-button" data-action="view" data-view="stores">${e(t("\u7EF4\u62A4\u5E97\u94FA", "Manage Stores"))}</button></div></article><article class="panel-card"><h2>${e(t("\u4F7F\u7528\u63D0\u793A", "Tips"))}</h2><ul class="info-list"><li>${e(t("\u5EFA\u8BAE\u5B9A\u671F\u5BFC\u51FA JSON \u505A\u79BB\u7EBF\u5907\u4EFD\u3002", "Export JSON regularly for offline backup."))}</li><li>${e(t("\u8DE8\u8BBE\u5907/\u8DE8\u8D26\u53F7\u53EF\u7528\u5BFC\u5165\u6062\u590D\u3002", "Use Import to restore across devices/accounts."))}</li></ul></article></section>`;
  }
  function typesView() {
    const current = active("types", state.editingTypeId);
    const grouped = /* @__PURE__ */ new Map();
    sort(state.db.types, (item) => item.name).forEach((item) => {
      const key = item.primaryName || t("\u672A\u5206\u7C7B", "Uncategorized");
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    });
    return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(current ? t("\u7F16\u8F91\u7C7B\u578B", "Edit Type") : t("\u65B0\u589E\u7C7B\u578B", "New Type"))}</h2><form id="type-form" class="stack-form"><input type="hidden" name="typeId" value="${e((current == null ? void 0 : current.id) || "")}" /><label><span>${e(t("\u4E00\u7EA7\u7C7B\u578B", "Primary Type"))}</span><input name="primaryName" required value="${e((current == null ? void 0 : current.primaryName) || "")}" /></label><label><span>${e(t("\u4E8C\u7EA7\u7C7B\u578B", "Secondary Type"))}</span><input name="secondaryName" value="${e((current == null ? void 0 : current.secondaryName) || "")}" /></label><div class="inline-actions"><button class="primary-button" type="submit">${e(current ? t("\u66F4\u65B0", "Update") : t("\u65B0\u589E", "Create"))}</button>${current ? `<button class="ghost-button" type="button" data-action="cancel-type">${e(t("\u53D6\u6D88", "Cancel"))}</button>` : ""}</div></form></article><article class="panel-card"><h2>${e(t("\u7C7B\u578B\u5217\u8868", "Type List"))}</h2><div class="stack-list">${Array.from(grouped.entries()).map(([name, items]) => `<section class="nested-section"><h3>${e(name)}</h3>${items.map((item) => `<div class="list-row"><div><strong>${e(item.name)}</strong><p>${e(time(item.updatedAt))}</p></div><div class="inline-actions"><button class="ghost-button" type="button" data-action="edit-type" data-id="${item.id}">${e(t("\u7F16\u8F91", "Edit"))}</button><button class="danger-button" type="button" data-action="delete-type" data-id="${item.id}">${e(t("\u5220\u9664", "Delete"))}</button></div></div>`).join("")}</section>`).join("") || `<p class="empty-state">${e(t("\u6682\u65E0\u7C7B\u578B\u6570\u636E\u3002", "No type data."))}</p>`}</div></article></section>`;
  }
  function componentsView() {
    const current = active("components", state.editingComponentId);
    const tMap = typeMap();
    const pMap = projectMap();
    const sMap = storeMap();
    const usage = /* @__PURE__ */ new Map();
    state.db.pcbs.forEach((pcb) => pcb.items.forEach((item) => {
      var _a2;
      if (!usage.has(item.componentId)) usage.set(item.componentId, { total: 0, names: /* @__PURE__ */ new Set() });
      const row = usage.get(item.componentId);
      row.total += item.quantityPerBoard * pcb.boardQuantity;
      row.names.add(`${((_a2 = pMap.get(pcb.projectId)) == null ? void 0 : _a2.name) || t("\u672A\u77E5\u9879\u76EE", "Unknown Project")}/${pcb.name}${pcb.version ? `(${pcb.version})` : ""}`);
    }));
    const list = sort(state.db.components, (item) => item.model).filter((item) => {
      var _a2;
      const keyword = state.componentFilter.keyword.trim().toLowerCase();
      const typeName = ((_a2 = tMap.get(item.typeId)) == null ? void 0 : _a2.name) || "";
      const hit = !keyword || [item.model, item.auxInfo, item.note, typeName].join(" ").toLowerCase().includes(keyword);
      const hitType = state.componentFilter.typeId === "all" || state.componentFilter.typeId === item.typeId;
      const hitWarning = !state.componentFilter.warningOnly || warning(item);
      return hit && hitType && hitWarning;
    });
    return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(current ? t("\u7F16\u8F91\u5143\u5668\u4EF6", "Edit Component") : t("\u65B0\u589E\u5143\u5668\u4EF6", "New Component"))}</h2><form id="component-form" class="stack-form"><input type="hidden" name="componentId" value="${e((current == null ? void 0 : current.id) || "")}" /><label><span>${e(t("\u7C7B\u578B", "Type"))}</span><select name="typeId" required><option value="">${e(t("\u8BF7\u9009\u62E9\u7C7B\u578B", "Select type"))}</option>${sort(state.db.types, (item) => item.name).map((item) => `<option value="${item.id}" ${(current == null ? void 0 : current.typeId) === item.id ? "selected" : ""}>${e(item.name)}</option>`).join("")}</select></label><label><span>${e(t("\u578B\u53F7", "Model"))}</span><input name="model" required value="${e((current == null ? void 0 : current.model) || "")}" /></label><label><span>${e(t("\u9884\u8B66\u9608\u503C", "Warning Threshold"))}</span><input name="warningThreshold" type="number" min="0" step="1" value="${e((current == null ? void 0 : current.warningThreshold) || 0)}" /></label><label><span>${e(t("\u8F85\u52A9\u4FE1\u606F", "Aux Info"))}</span><textarea name="auxInfo">${e((current == null ? void 0 : current.auxInfo) || "")}</textarea></label><label><span>${e(t("\u5907\u6CE8", "Note"))}</span><textarea name="note">${e((current == null ? void 0 : current.note) || "")}</textarea></label><div class="inline-actions"><button class="primary-button" type="submit">${e(current ? t("\u66F4\u65B0", "Update") : t("\u65B0\u589E", "Create"))}</button>${current ? `<button class="ghost-button" type="button" data-action="cancel-component">${e(t("\u53D6\u6D88", "Cancel"))}</button>` : ""}</div></form></article><article class="panel-card"><h2>${e(t("\u641C\u7D22\u4E0E\u7B5B\u9009", "Filter"))}</h2><div class="stack-form"><label><span>${e(t("\u5173\u952E\u8BCD", "Keyword"))}</span><input data-filter="component-keyword" value="${e(state.componentFilter.keyword)}" placeholder="${e(t("\u578B\u53F7/\u5907\u6CE8/\u7C7B\u578B", "Model/note/type"))}" /></label><label><span>${e(t("\u7C7B\u578B\u7B5B\u9009", "Type Filter"))}</span><select data-filter="component-type"><option value="all">${e(t("\u5168\u90E8\u7C7B\u578B", "All Types"))}</option>${sort(state.db.types, (item) => item.name).map((item) => `<option value="${item.id}" ${state.componentFilter.typeId === item.id ? "selected" : ""}>${e(item.name)}</option>`).join("")}</select></label><label class="checkbox-row"><input data-filter="component-warning" type="checkbox" ${state.componentFilter.warningOnly ? "checked" : ""} /><span>${e(t("\u4EC5\u663E\u793A\u5E93\u5B58\u9884\u8B66", "Only warnings"))}</span></label></div></article></section><section class="panel-card"><h2>${e(t("\u5143\u5668\u4EF6\u5217\u8868", "Component List"))}</h2><div class="stack-list">${list.map((item) => {
      var _a2, _b2;
      return `<article class="entity-card ${warning(item) ? "warning-entity" : ""}"><header class="entity-header"><div><h3>${e(item.model)}</h3><p>${e(((_a2 = tMap.get(item.typeId)) == null ? void 0 : _a2.name) || t("\u672A\u77E5\u7C7B\u578B", "Unknown Type"))}</p></div><div class="inline-actions">${warning(item) ? `<span class="pill pill-warning">${e(t("\u5E93\u5B58\u9884\u8B66", "Low Stock"))}</span>` : ""}<button class="ghost-button" type="button" data-action="edit-component" data-id="${item.id}">${e(t("\u7F16\u8F91", "Edit"))}</button><button class="danger-button" type="button" data-action="delete-component" data-id="${item.id}">${e(t("\u5220\u9664", "Delete"))}</button></div></header><div class="meta-grid"><div><span>${e(t("\u603B\u5E93\u5B58", "Total"))}</span><strong>${item.totalQuantity}</strong></div><div><span>${e(t("\u6700\u4F4E\u4EF7\u683C", "Lowest"))}</span><strong>${item.lowestPrice === null ? "-" : `\xA5${item.lowestPrice.toFixed(2)}`}</strong></div><div><span>${e(t("PCB \u9700\u6C42", "PCB Demand"))}</span><strong>${((_b2 = usage.get(item.id)) == null ? void 0 : _b2.total) || 0}</strong></div></div>${item.auxInfo ? `<p class="support-text">${e(item.auxInfo)}</p>` : ""}<div class="subsection-head"><h4>${e(t("\u91C7\u8D2D\u8BB0\u5F55", "Purchase Records"))} (${item.records.length})</h4><button class="primary-button" type="button" data-action="record-modal" data-component-id="${item.id}">${e(t("\u65B0\u589E\u8BB0\u5F55", "Add Record"))}</button></div><div class="table-wrap"><table><thead><tr><th>${e(t("\u5E97\u94FA", "Store"))}</th><th>${e(t("\u5E73\u53F0", "Platform"))}</th><th>${e(t("\u6570\u91CF", "Qty"))}</th><th>${e(t("\u5355\u4EF7", "Price"))}</th><th>${e(t("\u65F6\u95F4", "Time"))}</th><th>${e(t("\u64CD\u4F5C", "Actions"))}</th></tr></thead><tbody>${sort(item.records, (record) => `${record.platform}-${record.purchasedAt}`).map((record) => {
        var _a3, _b3;
        return `<tr><td>${e(record.storeId ? `${((_a3 = sMap.get(record.storeId)) == null ? void 0 : _a3.platform) || ""}/${((_b3 = sMap.get(record.storeId)) == null ? void 0 : _b3.shopName) || ""}` : "-")}</td><td>${e(record.platform)}</td><td>${record.quantity}</td><td>${e(`\xA5${record.pricePerUnit.toFixed(2)}`)}</td><td>${e(time(record.purchasedAt))}</td><td><div class="inline-actions"><a class="text-link" href="${e(record.link)}" target="_blank" rel="noreferrer">${e(t("\u6253\u5F00", "Open"))}</a><button class="ghost-button" type="button" data-action="record-modal" data-component-id="${item.id}" data-record-id="${record.id}">${e(t("\u7F16\u8F91", "Edit"))}</button><button class="danger-button" type="button" data-action="delete-record" data-component-id="${item.id}" data-record-id="${record.id}">${e(t("\u5220\u9664", "Delete"))}</button></div></td></tr>`;
      }).join("") || `<tr><td colspan="6" class="empty-state">${e(t("\u6682\u65E0\u91C7\u8D2D\u8BB0\u5F55\u3002", "No records."))}</td></tr>`}</tbody></table></div></article>`;
    }).join("") || `<p class="empty-state">${e(t("\u6682\u65E0\u5143\u5668\u4EF6\u6570\u636E\u3002", "No component data."))}</p>`}</div></section>`;
  }
  function projectsView() {
    const currentProject = active("projects", state.editingProjectId);
    const currentPcb = active("pcbs", state.editingPcbId);
    const tMap = typeMap();
    const cMap = new Map(state.db.components.map((item) => [item.id, item]));
    const pMap = projectMap();
    const pcbs = state.projectFilter === "all" ? state.db.pcbs : state.db.pcbs.filter((item) => item.projectId === state.projectFilter);
    const summary = /* @__PURE__ */ new Map();
    pcbs.forEach((pcb) => pcb.items.forEach((item) => {
      var _a2;
      if (!summary.has(item.componentId)) summary.set(item.componentId, { total: 0, names: /* @__PURE__ */ new Set() });
      const row = summary.get(item.componentId);
      row.total += item.quantityPerBoard * pcb.boardQuantity;
      row.names.add(`${((_a2 = pMap.get(pcb.projectId)) == null ? void 0 : _a2.name) || ""}/${pcb.name}`);
    }));
    return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(currentProject ? t("\u7F16\u8F91\u9879\u76EE", "Edit Project") : t("\u65B0\u589E\u9879\u76EE", "New Project"))}</h2><form id="project-form" class="stack-form"><input type="hidden" name="projectId" value="${e((currentProject == null ? void 0 : currentProject.id) || "")}" /><label><span>${e(t("\u9879\u76EE\u540D\u79F0", "Project Name"))}</span><input name="name" required value="${e((currentProject == null ? void 0 : currentProject.name) || "")}" /></label><label><span>${e(t("\u5907\u6CE8", "Note"))}</span><textarea name="note">${e((currentProject == null ? void 0 : currentProject.note) || "")}</textarea></label><div class="inline-actions"><button class="primary-button" type="submit">${e(currentProject ? t("\u66F4\u65B0", "Update") : t("\u65B0\u589E", "Create"))}</button>${currentProject ? `<button class="ghost-button" type="button" data-action="cancel-project">${e(t("\u53D6\u6D88", "Cancel"))}</button>` : ""}</div></form></article><article class="panel-card"><h2>${e(currentPcb ? t("\u7F16\u8F91 PCB", "Edit PCB") : t("\u65B0\u589E PCB", "New PCB"))}</h2><form id="pcb-form" class="stack-form"><input type="hidden" name="pcbId" value="${e((currentPcb == null ? void 0 : currentPcb.id) || "")}" /><label><span>${e(t("\u6240\u5C5E\u9879\u76EE", "Project"))}</span><select name="projectId" required><option value="">${e(t("\u8BF7\u9009\u62E9\u9879\u76EE", "Select project"))}</option>${sort(state.db.projects, (item) => item.name).map((item) => `<option value="${item.id}" ${(currentPcb == null ? void 0 : currentPcb.projectId) === item.id ? "selected" : ""}>${e(item.name)}</option>`).join("")}</select></label><label><span>${e(t("PCB \u540D\u79F0", "PCB Name"))}</span><input name="name" required value="${e((currentPcb == null ? void 0 : currentPcb.name) || "")}" /></label><label><span>${e(t("\u7248\u672C\u53F7", "Version"))}</span><input name="version" value="${e((currentPcb == null ? void 0 : currentPcb.version) || "")}" /></label><label><span>${e(t("\u9879\u76EE\u7528\u677F\u6570\u91CF", "Board Qty"))}</span><input name="boardQuantity" type="number" min="1" step="1" value="${e((currentPcb == null ? void 0 : currentPcb.boardQuantity) || 1)}" /></label><label><span>${e(t("\u5907\u6CE8", "Note"))}</span><textarea name="note">${e((currentPcb == null ? void 0 : currentPcb.note) || "")}</textarea></label><div class="inline-actions"><button class="primary-button" type="submit">${e(currentPcb ? t("\u66F4\u65B0", "Update") : t("\u65B0\u589E", "Create"))}</button>${currentPcb ? `<button class="ghost-button" type="button" data-action="cancel-pcb">${e(t("\u53D6\u6D88", "Cancel"))}</button>` : ""}</div></form></article></section><section class="panel-card"><div class="section-head"><h2>${e(t("\u9700\u6C42\u7EDF\u8BA1", "Requirement Summary"))}</h2><select data-filter="project-filter"><option value="all">${e(t("\u5168\u90E8\u9879\u76EE", "All Projects"))}</option>${sort(state.db.projects, (item) => item.name).map((item) => `<option value="${item.id}" ${state.projectFilter === item.id ? "selected" : ""}>${e(item.name)}</option>`).join("")}</select></div><div class="table-wrap"><table><thead><tr><th>${e(t("\u7C7B\u578B", "Type"))}</th><th>${e(t("\u578B\u53F7", "Model"))}</th><th>${e(t("\u603B\u9700\u6C42", "Demand"))}</th><th>${e(t("\u6D89\u53CA PCB", "PCB"))}</th></tr></thead><tbody>${Array.from(summary.entries()).sort((a, b) => {
      var _a2, _b2;
      return (((_a2 = cMap.get(a[0])) == null ? void 0 : _a2.model) || "").localeCompare(((_b2 = cMap.get(b[0])) == null ? void 0 : _b2.model) || "", locale());
    }).map(([componentId, info]) => {
      var _a2, _b2, _c;
      return `<tr><td>${e(((_b2 = tMap.get((_a2 = cMap.get(componentId)) == null ? void 0 : _a2.typeId)) == null ? void 0 : _b2.name) || t("\u672A\u77E5\u7C7B\u578B", "Unknown Type"))}</td><td>${e(((_c = cMap.get(componentId)) == null ? void 0 : _c.model) || t("\u672A\u77E5\u5143\u5668\u4EF6", "Unknown Component"))}</td><td>${info.total}</td><td>${e(Array.from(info.names).join(t("\uFF0C", ", ")))}</td></tr>`;
    }).join("") || `<tr><td colspan="4" class="empty-state">${e(t("\u6682\u65E0\u7EDF\u8BA1\u6570\u636E\u3002", "No summary data."))}</td></tr>`}</tbody></table></div></section><section class="panel-card"><h2>${e(t("\u9879\u76EE\u4E0E PCB", "Projects and PCB"))}</h2><div class="stack-list">${sort(state.db.projects.filter((item) => state.projectFilter === "all" || item.id === state.projectFilter), (item) => item.name).map((project) => `<article class="entity-card"><header class="entity-header"><div><h3>${e(project.name)}</h3><p>${e(project.note || t("\u65E0\u9879\u76EE\u5907\u6CE8", "No note"))}</p></div><div class="inline-actions"><button class="ghost-button" type="button" data-action="edit-project" data-id="${project.id}">${e(t("\u7F16\u8F91", "Edit"))}</button><button class="danger-button" type="button" data-action="delete-project" data-id="${project.id}">${e(t("\u5220\u9664", "Delete"))}</button></div></header><div class="stack-list nested-list">${sort(state.db.pcbs.filter((item) => item.projectId === project.id), (item) => `${item.name}${item.version}`).map((pcb) => `<div class="list-row"><div><strong>${e(`${pcb.name}${pcb.version ? ` (${pcb.version})` : ""}`)}</strong><p>${e(t(`\u9879\u76EE\u6570\u91CF ${pcb.boardQuantity} / BOM ${pcb.items.length}`, `Qty ${pcb.boardQuantity} / BOM ${pcb.items.length}`))}</p></div><div class="inline-actions"><button class="primary-button" type="button" data-action="bom-modal" data-pcb-id="${pcb.id}">${e(t("\u7EF4\u62A4 BOM", "Manage BOM"))}</button><button class="ghost-button" type="button" data-action="edit-pcb" data-id="${pcb.id}">${e(t("\u7F16\u8F91", "Edit"))}</button><button class="danger-button" type="button" data-action="delete-pcb" data-id="${pcb.id}">${e(t("\u5220\u9664", "Delete"))}</button></div></div>`).join("") || `<p class="empty-state">${e(t("\u6682\u65E0 PCB\u3002", "No PCB."))}</p>`}</div></article>`).join("") || `<p class="empty-state">${e(t("\u6682\u65E0\u9879\u76EE\u6570\u636E\u3002", "No project data."))}</p>`}</div></section>`;
  }
  function purchaseView() {
    var _a2;
    const tMap = typeMap();
    const pMap = projectMap();
    const cMap = new Map(state.db.components.map((item) => [item.id, item]));
    const scope = state.purchase.scope === "pcb" ? "pcb" : "project";
    const projectId = state.purchase.projectId || "all";
    const pcbId = state.purchase.pcbId || "all";
    const shortageOnly = Boolean(state.purchase.shortageOnly);
    const pcbsByProject = projectId === "all" ? state.db.pcbs : state.db.pcbs.filter((item) => item.projectId === projectId);
    const pcbsForCalc = (() => {
      if (scope === "pcb") {
        if (pcbId === "all") return pcbsByProject;
        return pcbsByProject.filter((item) => item.id === pcbId);
      }
      return pcbsByProject;
    })();
    const required = /* @__PURE__ */ new Map();
    const usedBy = /* @__PURE__ */ new Map();
    for (const pcb of pcbsForCalc) {
      const pcbLabel = `${((_a2 = pMap.get(pcb.projectId)) == null ? void 0 : _a2.name) || t("\u672A\u77E5\u9879\u76EE", "Unknown Project")}/${pcb.name}${pcb.version ? `(${pcb.version})` : ""}`;
      for (const item of pcb.items) {
        const qty = Number(item.quantityPerBoard || 0) * Number(pcb.boardQuantity || 1);
        if (!required.has(item.componentId)) required.set(item.componentId, 0);
        required.set(item.componentId, required.get(item.componentId) + qty);
        if (!usedBy.has(item.componentId)) usedBy.set(item.componentId, /* @__PURE__ */ new Set());
        usedBy.get(item.componentId).add(pcbLabel);
      }
    }
    const lines = Array.from(required.entries()).map(([componentId, req]) => {
      var _a3;
      const component = cMap.get(componentId) || null;
      const inStock = component ? Number(component.totalQuantity || 0) : 0;
      const shortage = Math.max(0, Number(req || 0) - inStock);
      const unit = component && typeof component.lowestPrice === "number" ? component.lowestPrice : null;
      return {
        componentId,
        typeName: component ? ((_a3 = tMap.get(component.typeId)) == null ? void 0 : _a3.name) || t("\u672A\u77E5\u7C7B\u578B", "Unknown Type") : t("\u672A\u77E5\u7C7B\u578B", "Unknown Type"),
        model: component ? component.model : t("\u672A\u77E5\u5143\u5668\u4EF6", "Unknown Component"),
        required: Number(req || 0),
        inStock,
        shortage,
        unitPrice: unit,
        amount: unit === null ? null : unit * shortage,
        pcbs: Array.from(usedBy.get(componentId) || [])
      };
    }).filter((row) => shortageOnly ? row.shortage > 0 : true).sort((a, b) => a.model.localeCompare(b.model, locale()));
    const totalRequired = lines.reduce((sum, row) => sum + row.required, 0);
    const totalShortage = lines.reduce((sum, row) => sum + row.shortage, 0);
    const totalAmount = lines.reduce((sum, row) => sum + (row.amount || 0), 0);
    const projectOptions = `<option value="all">${e(t("\u5168\u90E8\u9879\u76EE", "All Projects"))}</option>` + sort(state.db.projects, (item) => item.name).map((item) => `<option value="${item.id}" ${projectId === item.id ? "selected" : ""}>${e(item.name)}</option>`).join("");
    const pcbOptions = `<option value="all">${e(scope === "pcb" ? t("\u5168\u90E8 PCB\uFF08\u5F53\u524D\u9879\u76EE\u8FC7\u6EE4\uFF09", "All PCBs (project filter)") : t("\u5168\u90E8 PCB", "All PCBs"))}</option>` + sort(pcbsByProject, (item) => {
      var _a3;
      return `${((_a3 = pMap.get(item.projectId)) == null ? void 0 : _a3.name) || ""}${item.name}${item.version}`;
    }).map((item) => {
      var _a3;
      const label = `${((_a3 = pMap.get(item.projectId)) == null ? void 0 : _a3.name) || t("\u672A\u77E5\u9879\u76EE", "Unknown Project")}/${item.name}${item.version ? ` (${item.version})` : ""}`;
      return `<option value="${item.id}" ${pcbId === item.id ? "selected" : ""}>${e(label)}</option>`;
    }).join("");
    const head = `<section class="panel-card"><div class="section-head"><h2>${e(t("\u91C7\u8D2D\u6E05\u5355", "Purchase List"))}</h2><div class="inline-actions"><button class="ghost-button" type="button" data-action="purchase-export-json">${e(t("\u5BFC\u51FA JSON", "Export JSON"))}</button><button class="ghost-button" type="button" data-action="purchase-export-csv">${e(t("\u5BFC\u51FA CSV", "Export CSV"))}</button></div></div><div class="card-grid two-col"><div class="stack-form"><label><span>${e(t("\u8303\u56F4", "Scope"))}</span><select data-filter="purchase-scope"><option value="project" ${scope === "project" ? "selected" : ""}>${e(t("\u6309\u9879\u76EE\u6C47\u603B", "By Project"))}</option><option value="pcb" ${scope === "pcb" ? "selected" : ""}>${e(t("\u6309 PCB", "By PCB"))}</option></select></label><label><span>${e(t("\u9879\u76EE\u7B5B\u9009", "Project Filter"))}</span><select data-filter="purchase-project">${projectOptions}</select></label><label><span>${e(t("PCB \u7B5B\u9009", "PCB Filter"))}</span><select data-filter="purchase-pcb" ${scope === "project" ? "disabled" : ""}>${pcbOptions}</select></label><label class="checkbox-row"><input data-filter="purchase-shortage-only" type="checkbox" ${shortageOnly ? "checked" : ""} /><span>${e(t("\u4EC5\u663E\u793A\u7F3A\u53E3", "Shortage only"))}</span></label></div><div class="stack-form"><label><span>${e(t("\u7EDF\u8BA1", "Summary"))}</span><div class="meta-grid"><div><span>${e(t("\u9700\u6C42\u5408\u8BA1", "Total Required"))}</span><strong>${totalRequired}</strong></div><div><span>${e(t("\u7F3A\u53E3\u5408\u8BA1", "Total Shortage"))}</span><strong>${totalShortage}</strong></div><div><span>${e(t("\u9884\u8BA1\u91D1\u989D", "Est. Amount"))}</span><strong>${lines.some((r) => r.amount !== null) ? `\xA5${totalAmount.toFixed(2)}` : "-"}</strong></div></div></label><p class="support-text">${e(t("\u8BF4\u660E\uFF1A\u7F3A\u53E3=\u9700\u6C42-\u5E93\u5B58(\u5C0F\u4E8E0\u63090\u8BA1)\uFF1B\u9884\u8BA1\u91D1\u989D\u4F7F\u7528\u201C\u6700\u4F4E\u5355\u4EF7\u201D\u4F30\u7B97\u3002", "Note: shortage = required - in-stock (min 0). Estimated amount uses lowest unit price."))}</p></div></div></section>`;
    const table = `<section class="panel-card"><h2>${e(t("\u6E05\u5355\u660E\u7EC6", "Line Items"))}</h2><div class="table-wrap"><table><thead><tr><th>${e(t("\u7C7B\u578B", "Type"))}</th><th>${e(t("\u578B\u53F7", "Model"))}</th><th>${e(t("\u9700\u6C42", "Required"))}</th><th>${e(t("\u5E93\u5B58", "In Stock"))}</th><th>${e(t("\u7F3A\u53E3", "Shortage"))}</th><th>${e(t("\u6700\u4F4E\u5355\u4EF7", "Unit"))}</th><th>${e(t("\u9884\u8BA1\u91D1\u989D", "Amount"))}</th><th>${e(t("\u6D89\u53CA PCB", "PCBs"))}</th></tr></thead><tbody>${lines.map((row) => `<tr><td>${e(row.typeName)}</td><td>${e(row.model)}</td><td>${row.required}</td><td>${row.inStock}</td><td><strong>${row.shortage}</strong></td><td>${row.unitPrice === null ? "-" : `\xA5${row.unitPrice.toFixed(2)}`}</td><td>${row.amount === null ? "-" : `\xA5${row.amount.toFixed(2)}`}</td><td>${e(row.pcbs.join(t("\uFF0C", ", ")))}</td></tr>`).join("") || `<tr><td colspan="8" class="empty-state">${e(t("\u5F53\u524D\u8303\u56F4\u5185\u6CA1\u6709\u53EF\u751F\u6210\u7684\u91C7\u8D2D\u6E05\u5355\u3002", "No purchase lines for current scope."))}</td></tr>`}</tbody></table></div></section>`;
    return head + table;
  }
  function storesView() {
    const current = active("stores", state.editingStoreId);
    return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(current ? t("\u7F16\u8F91\u5E97\u94FA", "Edit Store") : t("\u65B0\u589E\u5E97\u94FA", "New Store"))}</h2><form id="store-form" class="stack-form"><input type="hidden" name="storeId" value="${e((current == null ? void 0 : current.id) || "")}" /><label><span>${e(t("\u5E73\u53F0", "Platform"))}</span><input name="platform" required value="${e((current == null ? void 0 : current.platform) || "")}" /></label><label><span>${e(t("\u5E97\u94FA\u540D\u79F0", "Store Name"))}</span><input name="shopName" required value="${e((current == null ? void 0 : current.shopName) || "")}" /></label><label><span>${e(t("\u8D28\u91CF\u8BC4\u5206", "Quality"))}</span><input name="qualityScore" type="number" min="0" max="5" step="0.1" value="${e((current == null ? void 0 : current.qualityScore) || 5)}" /></label><label><span>${e(t("\u4EF7\u683C\u8BC4\u5206", "Price"))}</span><input name="priceScore" type="number" min="0" max="5" step="0.1" value="${e((current == null ? void 0 : current.priceScore) || 5)}" /></label><label><span>${e(t("\u90AE\u8D39", "Shipping"))}</span><input name="shippingFee" type="number" min="0" step="0.01" value="${e((current == null ? void 0 : current.shippingFee) || 0)}" /></label><label><span>${e(t("\u53C2\u8003\u4EF7\u683C", "Reference Price"))}</span><input name="referencePrice" type="number" min="0" step="0.01" value="${e((current == null ? void 0 : current.referencePrice) || 0)}" /></label><label><span>${e(t("\u4E3B\u5356\u54C1", "Products"))}</span><textarea name="mainProducts">${e((current == null ? void 0 : current.mainProducts) || "")}</textarea></label><label><span>${e(t("\u5907\u6CE8", "Note"))}</span><textarea name="note">${e((current == null ? void 0 : current.note) || "")}</textarea></label><div class="inline-actions"><button class="primary-button" type="submit">${e(current ? t("\u66F4\u65B0", "Update") : t("\u65B0\u589E", "Create"))}</button>${current ? `<button class="ghost-button" type="button" data-action="cancel-store">${e(t("\u53D6\u6D88", "Cancel"))}</button>` : ""}</div></form></article><article class="panel-card"><h2>${e(t("\u5E97\u94FA\u5217\u8868", "Store List"))}</h2><div class="stack-list">${sort(state.db.stores, (item) => `${item.platform}${item.shopName}`).map((item) => `<div class="list-row"><div><strong>${e(`${item.platform} / ${item.shopName}`)}</strong><p>${e(`Q ${item.qualityScore.toFixed(1)} / P ${item.priceScore.toFixed(1)} / \xA5${item.referencePrice.toFixed(2)}`)}</p>${item.mainProducts ? `<p>${e(item.mainProducts)}</p>` : ""}</div><div class="inline-actions"><button class="ghost-button" type="button" data-action="edit-store" data-id="${item.id}">${e(t("\u7F16\u8F91", "Edit"))}</button><button class="danger-button" type="button" data-action="delete-store" data-id="${item.id}">${e(t("\u5220\u9664", "Delete"))}</button></div></div>`).join("") || `<p class="empty-state">${e(t("\u6682\u65E0\u5E97\u94FA\u6570\u636E\u3002", "No store data."))}</p>`}</div></article></section>`;
  }
  function settingsView() {
    return `<section class="card-grid two-col"><article class="panel-card"><h2>${e(t("\u754C\u9762\u504F\u597D", "Preferences"))}</h2><form id="prefs-form" class="stack-form"><label><span>${e(t("\u8BED\u8A00", "Language"))}</span><select name="lang"><option value="zh" ${state.prefs.lang === "zh" ? "selected" : ""}>\u4E2D\u6587</option><option value="en" ${state.prefs.lang === "en" ? "selected" : ""}>English</option></select></label><label><span>${e(t("\u4E3B\u9898", "Theme"))}</span><select name="theme"><option value="light" ${state.prefs.theme === "light" ? "selected" : ""}>${e(t("\u4EAE\u8272", "Light"))}</option><option value="dark" ${state.prefs.theme === "dark" ? "selected" : ""}>${e(t("\u6697\u8272", "Dark"))}</option></select></label><button class="primary-button" type="submit">${e(t("\u4FDD\u5B58\u504F\u597D", "Save"))}</button></form></article><article class="panel-card"><h2>${e(t("\u63D2\u4EF6\u5B58\u50A8", "Plugin Storage"))}</h2><ul class="info-list"><li>${e(t(`\u5F53\u524D\u5171 ${state.db.types.length} \u4E2A\u7C7B\u578B\u3001${state.db.components.length} \u4E2A\u5143\u5668\u4EF6\u3001${state.db.projects.length} \u4E2A\u9879\u76EE\u3002`, `Current totals: ${state.db.types.length} types, ${state.db.components.length} components, ${state.db.projects.length} projects.`))}</li></ul><div class="inline-actions"><button class="ghost-button" data-action="import">${e(t("\u5BFC\u5165", "Import"))}</button><button class="ghost-button" data-action="export-json">${e(t("\u5BFC\u51FA JSON", "Export JSON"))}</button><button class="ghost-button" data-action="export-xlsx">${e(t("\u5BFC\u51FA Excel(.xlsx)", "Export Excel (.xlsx)"))}</button><button class="danger-button" data-action="reset">${e(t("\u91CD\u7F6E\u6570\u636E", "Reset Data"))}</button></div></article></section>`;
  }
  function modal() {
    if (!state.modal) return "";
    if (state.modal.type === "xlsx-map") return xlsxMapModal();
    if (state.modal.type === "record") return recordModal();
    if (state.modal.type === "bom") return bomModal();
    return "";
  }
  function xlsxMapModal() {
    var _a2, _b2, _c;
    const workbook = state.modal.workbook;
    const sheetName = state.modal.sheetName;
    const targetKind = state.modal.targetKind;
    const sheetNames = ((_a2 = workbook == null ? void 0 : workbook.sheets) == null ? void 0 : _a2.map((sheet) => sheet.name)) || [];
    const currentSheet = ((_b2 = workbook == null ? void 0 : workbook.sheets) == null ? void 0 : _b2.find((sheet) => sheet.name === sheetName)) || null;
    const headers = (((_c = currentSheet == null ? void 0 : currentSheet.rows) == null ? void 0 : _c[0]) || []).map((item) => String(item || "").trim()).filter(Boolean);
    const options = (value) => `<option value="${e(value)}">${e(value)}</option>`;
    const mapRow = (idValue, labelZh, labelEn, required) => {
      return `<label><span>${e(t(labelZh, labelEn))}${required ? " *" : ""}</span><select name="${e(idValue)}"><option value="">${e(t("\u4E0D\u6620\u5C04", "Ignore"))}</option>${headers.map(options).join("")}</select></label>`;
    };
    return `<div class="modal-backdrop" data-action="close-modal"><div class="modal-panel wide-panel" data-modal-root="true"><div class="section-head"><h2>${e(t("Excel \u5BFC\u5165\u6620\u5C04", "Excel Import Mapping"))}</h2><button class="ghost-button" type="button" data-action="close-modal">${e(t("\u5173\u95ED", "Close"))}</button></div><form id="xlsx-map-form" class="stack-form"><div class="card-grid two-col"><label><span>${e(t("\u9009\u62E9\u5DE5\u4F5C\u8868", "Worksheet"))}</span><select name="sheetName" data-xlsx-map="sheet">${sheetNames.map((name) => `<option value="${e(name)}" ${name === sheetName ? "selected" : ""}>${e(name)}</option>`).join("")}</select></label><label><span>${e(t("\u5BFC\u5165\u4E3A", "Import As"))}</span><select name="targetKind" data-xlsx-map="target"><option value="components" ${targetKind === "components" ? "selected" : ""}>${e(t("\u5143\u5668\u4EF6\u5217\u8868", "Components"))}</option><option value="types" ${targetKind === "types" ? "selected" : ""}>${e(t("\u7C7B\u578B\u5217\u8868", "Types"))}</option><option value="projects" ${targetKind === "projects" ? "selected" : ""}>${e(t("\u9879\u76EE\u5217\u8868", "Projects"))}</option><option value="stores" ${targetKind === "stores" ? "selected" : ""}>${e(t("\u5E97\u94FA\u5217\u8868", "Stores"))}</option></select></label></div>${currentSheet ? `<div class="card-grid two-col">${targetKind === "components" ? `${mapRow("typeName", "\u7C7B\u578B\u5217", "Type column", true)}${mapRow("model", "\u578B\u53F7\u5217", "Model column", true)}${mapRow("auxInfo", "\u8F85\u52A9\u4FE1\u606F\u5217", "Aux info column", false)}${mapRow("note", "\u5907\u6CE8\u5217", "Note column", false)}${mapRow("warningThreshold", "\u9884\u8B66\u9608\u503C\u5217", "Warning threshold column", false)}` : ""}${targetKind === "types" ? `${mapRow("name", "\u7C7B\u578B\u540D\u79F0\u5217", "Type name column", true)}${mapRow("primaryName", "\u4E00\u7EA7\u7C7B\u578B\u5217", "Primary type column", false)}${mapRow("secondaryName", "\u4E8C\u7EA7\u7C7B\u578B\u5217", "Secondary type column", false)}` : ""}${targetKind === "projects" ? `${mapRow("name", "\u9879\u76EE\u540D\u79F0\u5217", "Project name column", true)}${mapRow("note", "\u5907\u6CE8\u5217", "Note column", false)}` : ""}${targetKind === "stores" ? `${mapRow("platform", "\u5E73\u53F0\u5217", "Platform column", true)}${mapRow("shopName", "\u5E97\u94FA\u540D\u79F0\u5217", "Shop name column", true)}${mapRow("qualityScore", "\u8D28\u91CF\u8BC4\u5206\u5217", "Quality score column", false)}${mapRow("priceScore", "\u4EF7\u683C\u8BC4\u5206\u5217", "Price score column", false)}${mapRow("shippingFee", "\u90AE\u8D39\u5217", "Shipping fee column", false)}${mapRow("referencePrice", "\u53C2\u8003\u4EF7\u683C\u5217", "Reference price column", false)}${mapRow("mainProducts", "\u4E3B\u5356\u54C1\u5217", "Main products column", false)}${mapRow("note", "\u5907\u6CE8\u5217", "Note column", false)}` : ""}</div>` : `<p class="empty-state">${e(t("\u672A\u627E\u5230\u53EF\u7528\u5DE5\u4F5C\u8868\u3002", "No worksheet found."))}</p>`}<button class="primary-button" type="submit">${e(t("\u5F00\u59CB\u5BFC\u5165", "Import"))}</button></form></div></div>`;
  }
  function recordModal() {
    const component = state.db.components.find((item) => item.id === state.modal.componentId);
    if (!component) return "";
    const record = state.modal.recordId ? component.records.find((item) => item.id === state.modal.recordId) : null;
    return `<div class="modal-backdrop" data-action="close-modal"><div class="modal-panel" data-modal-root="true"><div class="section-head"><h2>${e(record ? t("\u7F16\u8F91\u91C7\u8D2D\u8BB0\u5F55", "Edit Record") : t("\u65B0\u589E\u91C7\u8D2D\u8BB0\u5F55", "Add Record"))}</h2><button class="ghost-button" type="button" data-action="close-modal">${e(t("\u5173\u95ED", "Close"))}</button></div><form id="record-form" class="stack-form"><input type="hidden" name="componentId" value="${component.id}" /><input type="hidden" name="recordId" value="${e((record == null ? void 0 : record.id) || "")}" /><label><span>${e(t("\u5173\u8054\u5E97\u94FA", "Linked Store"))}</span><select name="storeId"><option value="">${e(t("\u4E0D\u5173\u8054\u5E97\u94FA", "No linked store"))}</option>${sort(state.db.stores, (item) => `${item.platform}${item.shopName}`).map((item) => `<option value="${item.id}" ${(record == null ? void 0 : record.storeId) === item.id ? "selected" : ""}>${e(`${item.platform} / ${item.shopName}`)}</option>`).join("")}</select></label><label><span>${e(t("\u5E73\u53F0", "Platform"))}</span><input name="platform" required value="${e((record == null ? void 0 : record.platform) || "")}" /></label><label><span>${e(t("\u8D2D\u4E70\u94FE\u63A5", "Link"))}</span><input name="link" required value="${e((record == null ? void 0 : record.link) || "")}" /></label><label><span>${e(t("\u6570\u91CF", "Quantity"))}</span><input name="quantity" type="number" min="1" step="1" required value="${e((record == null ? void 0 : record.quantity) || 1)}" /></label><label><span>${e(t("\u5355\u4EF7", "Unit Price"))}</span><input name="pricePerUnit" type="number" min="0" step="0.01" required value="${e((record == null ? void 0 : record.pricePerUnit) || 0)}" /></label><button class="primary-button" type="submit">${e(record ? t("\u4FDD\u5B58", "Save") : t("\u65B0\u589E", "Add"))}</button></form></div></div>`;
  }
  function bomModal() {
    const pcb = state.db.pcbs.find((item) => item.id === state.modal.pcbId);
    if (!pcb) return "";
    const current = state.modal.itemId ? pcb.items.find((item) => item.id === state.modal.itemId) : null;
    const cMap = new Map(state.db.components.map((item) => [item.id, item]));
    const tMap = typeMap();
    return `<div class="modal-backdrop" data-action="close-modal"><div class="modal-panel wide-panel" data-modal-root="true"><div class="section-head"><h2>${e(current ? t("\u7F16\u8F91 BOM \u660E\u7EC6", "Edit BOM Item") : t("\u65B0\u589E BOM \u660E\u7EC6", "Add BOM Item"))}</h2><button class="ghost-button" type="button" data-action="close-modal">${e(t("\u5173\u95ED", "Close"))}</button></div><form id="bom-form" class="stack-form"><input type="hidden" name="pcbId" value="${pcb.id}" /><input type="hidden" name="itemId" value="${e((current == null ? void 0 : current.id) || "")}" /><label><span>${e(t("\u5143\u5668\u4EF6", "Component"))}</span><select name="componentId" required><option value="">${e(t("\u8BF7\u9009\u62E9\u5143\u5668\u4EF6", "Select Component"))}</option>${sort(state.db.components, (item) => item.model).map((item) => {
      var _a2;
      return `<option value="${item.id}" ${(current == null ? void 0 : current.componentId) === item.id ? "selected" : ""}>${e(`${((_a2 = tMap.get(item.typeId)) == null ? void 0 : _a2.name) || t("\u672A\u77E5\u7C7B\u578B", "Unknown Type")} / ${item.model}`)}</option>`;
    }).join("")}</select></label><label><span>${e(t("\u5355\u677F\u9700\u6C42\u6570\u91CF", "Qty per Board"))}</span><input name="quantityPerBoard" type="number" min="1" step="1" required value="${e((current == null ? void 0 : current.quantityPerBoard) || 1)}" /></label><button class="primary-button" type="submit">${e(current ? t("\u4FDD\u5B58", "Save") : t("\u65B0\u589E", "Add"))}</button></form><div class="table-wrap"><table><thead><tr><th>${e(t("\u7C7B\u578B", "Type"))}</th><th>${e(t("\u578B\u53F7", "Model"))}</th><th>${e(t("\u5355\u677F\u9700\u6C42", "Per Board"))}</th><th>${e(t("\u9879\u76EE\u603B\u9700\u6C42", "Project Total"))}</th><th>${e(t("\u64CD\u4F5C", "Actions"))}</th></tr></thead><tbody>${sort(pcb.items, (item) => {
      var _a2;
      return ((_a2 = cMap.get(item.componentId)) == null ? void 0 : _a2.model) || "";
    }).map((item) => {
      var _a2, _b2, _c;
      return `<tr><td>${e(((_b2 = tMap.get((_a2 = cMap.get(item.componentId)) == null ? void 0 : _a2.typeId)) == null ? void 0 : _b2.name) || t("\u672A\u77E5\u7C7B\u578B", "Unknown Type"))}</td><td>${e(((_c = cMap.get(item.componentId)) == null ? void 0 : _c.model) || t("\u672A\u77E5\u5143\u5668\u4EF6", "Unknown Component"))}</td><td>${item.quantityPerBoard}</td><td>${item.quantityPerBoard * pcb.boardQuantity}</td><td><div class="inline-actions"><button class="ghost-button" type="button" data-action="bom-modal" data-pcb-id="${pcb.id}" data-item-id="${item.id}">${e(t("\u7F16\u8F91", "Edit"))}</button><button class="danger-button" type="button" data-action="delete-bom-item" data-pcb-id="${pcb.id}" data-item-id="${item.id}">${e(t("\u5220\u9664", "Delete"))}</button></div></td></tr>`;
    }).join("") || `<tr><td colspan="5" class="empty-state">${e(t("\u6682\u65E0 BOM \u660E\u7EC6\u3002", "No BOM items."))}</td></tr>`}</tbody></table></div></div></div>`;
  }
  function jsonText() {
    return `${JSON.stringify(state.db, null, 2)}
`;
  }
  function excelText() {
    const tMap = typeMap();
    const pMap = projectMap();
    const sMap = storeMap();
    const table = (title, headers, rows) => `<h2>${e(title)}</h2><table><thead><tr>${headers.map((item) => `<th>${e(item)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((item) => `<td>${e(item)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    return `\uFEFF<html><head><meta charset="utf-8" /><style>body{font-family:"Microsoft YaHei",sans-serif}table{border-collapse:collapse;width:100%;margin-bottom:14px}th,td{border:1px solid #ccd4e4;padding:6px 8px;font-size:12px}th{background:#edf2ff}</style></head><body>${table("\u7C7B\u578B", ["id", "\u540D\u79F0", "\u4E00\u7EA7\u7C7B\u578B", "\u4E8C\u7EA7\u7C7B\u578B"], state.db.types.map((item) => [item.id, item.name, item.primaryName, item.secondaryName || ""]))}${table("\u9879\u76EE", ["id", "\u540D\u79F0", "\u5907\u6CE8"], state.db.projects.map((item) => [item.id, item.name, item.note]))}${table("\u5143\u5668\u4EF6", ["id", "\u7C7B\u578B", "\u578B\u53F7", "\u603B\u5E93\u5B58", "\u9884\u8B66\u9608\u503C", "\u6700\u4F4E\u4EF7\u683C"], state.db.components.map((item) => {
      var _a2, _b2;
      return [item.id, ((_a2 = tMap.get(item.typeId)) == null ? void 0 : _a2.name) || "\u672A\u77E5\u7C7B\u578B", item.model, item.totalQuantity, item.warningThreshold, (_b2 = item.lowestPrice) != null ? _b2 : ""];
    }))}${table("\u91C7\u8D2D\u8BB0\u5F55", ["\u8BB0\u5F55id", "\u5143\u5668\u4EF6", "\u5E97\u94FA", "\u5E73\u53F0", "\u6570\u91CF", "\u5355\u4EF7", "\u65F6\u95F4"], state.db.components.flatMap((component) => component.records.map((record) => {
      var _a2, _b2;
      return [record.id, component.model, record.storeId ? `${((_a2 = sMap.get(record.storeId)) == null ? void 0 : _a2.platform) || ""}/${((_b2 = sMap.get(record.storeId)) == null ? void 0 : _b2.shopName) || ""}` : "-", record.platform, record.quantity, record.pricePerUnit, record.purchasedAt];
    })))}${table("PCB", ["id", "\u9879\u76EE", "PCB", "\u7248\u672C", "\u6570\u91CF"], state.db.pcbs.map((item) => {
      var _a2;
      return [item.id, ((_a2 = pMap.get(item.projectId)) == null ? void 0 : _a2.name) || "\u672A\u77E5\u9879\u76EE", item.name, item.version, item.boardQuantity];
    }))}</body></html>`;
  }
  function parseCsv(text) {
    const split = (line) => {
      const result = [];
      let current = "";
      let quoted = false;
      for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
          if (quoted && line[i + 1] === '"') {
            current += '"';
            i += 1;
          } else {
            quoted = !quoted;
          }
        } else if (char === "," && !quoted) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = split(lines[0]);
    return lines.slice(1).map((line) => {
      const values = split(line);
      const row = {};
      headers.forEach((header2, index) => {
        row[header2] = values[index] || "";
      });
      return row;
    });
  }
  function importItems(items) {
    let count = 0;
    items.forEach((item) => {
      const typeName = String(item.typeName || item.type || "").trim();
      const model = String(item.model || "").trim();
      if (!typeName || !model) return;
      let type = state.db.types.find((entry) => entry.name.toLowerCase() === typeName.toLowerCase());
      if (!type) {
        type = nType({ id: id(), name: typeName, primaryName: typeName.split("/")[0], secondaryName: typeName.split("/")[1] || "", createdAt: iso(), updatedAt: iso() });
        state.db.types.push(type);
      }
      let component = state.db.components.find((entry) => entry.typeId === type.id && entry.model.toLowerCase() === model.toLowerCase());
      if (!component) {
        component = nComponent({ id: id(), typeId: type.id, model, auxInfo: item.auxInfo || "", note: item.note || "", warningThreshold: Number(item.warningThreshold || 0), records: [], createdAt: iso(), updatedAt: iso() });
        state.db.components.push(component);
      }
      (item.records || []).forEach((record) => {
        component.records.push(nRecord({ id: id(), platform: record.platform || "", link: record.link || "", quantity: Number(record.quantity || 0), pricePerUnit: Number(record.pricePerUnit || 0), purchasedAt: iso(), createdAt: iso(), updatedAt: iso() }));
      });
      component.auxInfo = String(item.auxInfo || component.auxInfo || "").trim();
      component.note = String(item.note || component.note || "").trim();
      component.warningThreshold = Number(item.warningThreshold || component.warningThreshold || 0);
      component.updatedAt = iso();
      const index = state.db.components.findIndex((entry) => entry.id === component.id);
      state.db.components[index] = nComponent(component);
      count += 1;
    });
    return count;
  }
  function xmlEscape(value) {
    return String(value != null ? value : "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
  }
  function colName(index1based) {
    let n = index1based;
    let out = "";
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
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
      table[i] = c >>> 0;
    }
    return table;
  }
  const _crc32Table = crc32Table();
  function crc32(bytes) {
    let c = 4294967295;
    for (let i = 0; i < bytes.length; i += 1) c = _crc32Table[(c ^ bytes[i]) & 255] ^ c >>> 8;
    return (c ^ 4294967295) >>> 0;
  }
  function u16(dv, off) {
    return dv.getUint16(off, true);
  }
  function u32(dv, off) {
    return dv.getUint32(off, true);
  }
  function setU16(dv, off, value) {
    dv.setUint16(off, value, true);
  }
  function setU32(dv, off, value) {
    dv.setUint32(off, value, true);
  }
  function utf8Encode(text) {
    return new TextEncoder().encode(String(text != null ? text : ""));
  }
  function utf8Decode(bytes) {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
  async function inflateRaw(bytes) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error(t("\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u89E3\u538B\u7F29\uFF0C\u65E0\u6CD5\u8BFB\u53D6\u666E\u901A xlsx\u3002\u8BF7\u4F7F\u7528\u672C\u63D2\u4EF6\u5BFC\u51FA\u7684 xlsx \u6216\u5C06\u6587\u4EF6\u53E6\u5B58\u4E3A CSV\u3002", "DecompressionStream is unavailable; cannot read typical .xlsx. Use the .xlsx exported by this plugin or save as CSV."));
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  }
  async function unzip(buffer) {
    const bytes = new Uint8Array(buffer);
    const dv = new DataView(buffer);
    const SIG_EOCD = 101010256;
    const SIG_CDIR = 33639248;
    const SIG_LFH = 67324752;
    let eocd = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i -= 1) {
      if (u32(dv, i) === SIG_EOCD) {
        eocd = i;
        break;
      }
    }
    if (eocd < 0) throw new Error(t("\u4E0D\u662F\u6709\u6548\u7684 xlsx \u6587\u4EF6\uFF08\u7F3A\u5C11 EOCD\uFF09\u3002", "Invalid .xlsx (missing EOCD)."));
    const totalEntries = u16(dv, eocd + 10);
    const cdirSize = u32(dv, eocd + 12);
    const cdirOffset = u32(dv, eocd + 16);
    if (cdirOffset + cdirSize > bytes.length) throw new Error(t("xlsx \u6587\u4EF6\u5DF2\u635F\u574F\uFF08\u4E2D\u592E\u76EE\u5F55\u8D8A\u754C\uFF09\u3002", "Corrupted .xlsx (central directory out of range)."));
    const out = /* @__PURE__ */ new Map();
    let off = cdirOffset;
    for (let i = 0; i < totalEntries; i += 1) {
      if (u32(dv, off) !== SIG_CDIR) throw new Error(t("xlsx \u6587\u4EF6\u5DF2\u635F\u574F\uFF08\u4E2D\u592E\u76EE\u5F55\u7B7E\u540D\u9519\u8BEF\uFF09\u3002", "Corrupted .xlsx (bad central directory signature)."));
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
      if (u32(dv, localOffset) !== SIG_LFH) throw new Error(t("xlsx \u6587\u4EF6\u5DF2\u635F\u574F\uFF08\u672C\u5730\u5934\u7B7E\u540D\u9519\u8BEF\uFF09\u3002", "Corrupted .xlsx (bad local header signature)."));
      const localNameLen = u16(dv, localOffset + 26);
      const localExtraLen = u16(dv, localOffset + 28);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      const dataEnd = dataStart + compSize;
      if (dataEnd > bytes.length) throw new Error(t("xlsx \u6587\u4EF6\u5DF2\u635F\u574F\uFF08\u6570\u636E\u8D8A\u754C\uFF09\u3002", "Corrupted .xlsx (data out of range)."));
      const compData = bytes.slice(dataStart, dataEnd);
      let data;
      if (compMethod === 0) data = compData;
      else if (compMethod === 8) data = await inflateRaw(compData);
      else throw new Error(t(`\u4E0D\u652F\u6301\u7684\u538B\u7F29\u65B9\u5F0F: ${compMethod}`, `Unsupported compression method: ${compMethod}`));
      if (data.length !== uncompSize) {
      }
      if (crc32(data) >>> 0 !== crc >>> 0) {
        throw new Error(t(`xlsx \u6587\u4EF6\u5DF2\u635F\u574F\uFF08CRC \u6821\u9A8C\u5931\u8D25\uFF09\uFF1A${name}`, `Corrupted .xlsx (CRC mismatch): ${name}`));
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
      setU32(dv, 0, 67324752);
      setU16(dv, 4, 20);
      setU16(dv, 6, 0);
      setU16(dv, 8, 0);
      setU16(dv, 10, 0);
      setU16(dv, 12, 0);
      setU32(dv, 14, crc);
      setU32(dv, 18, data.length);
      setU32(dv, 22, data.length);
      setU16(dv, 26, nameBytes.length);
      setU16(dv, 28, 0);
      local.set(nameBytes, 30);
      localParts.push(local, data);
      const central = new Uint8Array(46 + nameBytes.length);
      const cdv = new DataView(central.buffer);
      setU32(cdv, 0, 33639248);
      setU16(cdv, 4, 20);
      setU16(cdv, 6, 20);
      setU16(cdv, 8, 0);
      setU16(cdv, 10, 0);
      setU16(cdv, 12, 0);
      setU16(cdv, 14, 0);
      setU32(cdv, 16, crc);
      setU32(cdv, 20, data.length);
      setU32(cdv, 24, data.length);
      setU16(cdv, 28, nameBytes.length);
      setU16(cdv, 30, 0);
      setU16(cdv, 32, 0);
      setU16(cdv, 34, 0);
      setU16(cdv, 36, 0);
      setU32(cdv, 38, 0);
      setU32(cdv, 42, offset);
      central.set(nameBytes, 46);
      centralParts.push(central);
      offset += local.length + data.length;
    }
    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const eocd = new Uint8Array(22);
    const edv = new DataView(eocd.buffer);
    setU32(edv, 0, 101010256);
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
    for (const row of safeRows) maxCol = Math.max(maxCol, Array.isArray(row) ? row.length : 0);
    const maxRow = Math.max(1, safeRows.length || 1);
    const dim = `A1:${colName(maxCol || 1)}${maxRow}`;
    const rowXml = safeRows.map((row, rowIndex) => {
      const r = rowIndex + 1;
      const cells = (row || []).map((value, colIndex) => {
        if (value === null || value === void 0 || value === "") return "";
        const ref = `${colName(colIndex + 1)}${r}`;
        if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}"><v>${value}</v></c>`;
        const text = String(value);
        const preserve = /^\s|\s$/.test(text) ? ' xml:space="preserve"' : "";
        return `<c r="${ref}" t="inlineStr"><is><t${preserve}>${xmlEscape(text)}</t></is></c>`;
      }).filter(Boolean).join("");
      return `<row r="${r}">${cells}</row>`;
    }).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="${dim}"/><sheetData>${rowXml}</sheetData></worksheet>`;
  }
  function buildXlsxWorkbook(sheets) {
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const visibleSheets = sheets.map((sheet, index) => ({ ...sheet, index: index + 1 }));
    const workbookSheetsXml = visibleSheets.map((sheet, idx) => {
      const stateAttr = sheet.hidden ? ` state="hidden"` : "";
      return `<sheet name="${xmlEscape(sheet.name)}" sheetId="${idx + 1}" r:id="rId${idx + 1}"${stateAttr}/>`;
    }).join("");
    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${workbookSheetsXml}</sheets></workbook>`;
    const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` + visibleSheets.map((sheet, idx) => `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`).join("") + `<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
    const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` + visibleSheets.map((sheet, idx) => `<Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("") + `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
    const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>bom-manager</dc:title><dc:creator>bom-manager</dc:creator><cp:lastModifiedBy>bom-manager</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:modified></cp:coreProperties>`;
    const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>bom-manager</Application></Properties>`;
    const files = [
      { name: "[Content_Types].xml", data: utf8Encode(contentTypes) },
      { name: "_rels/.rels", data: utf8Encode(rootRels) },
      { name: "docProps/core.xml", data: utf8Encode(coreXml) },
      { name: "docProps/app.xml", data: utf8Encode(appXml) },
      { name: "xl/workbook.xml", data: utf8Encode(workbookXml) },
      { name: "xl/_rels/workbook.xml.rels", data: utf8Encode(workbookRels) },
      { name: "xl/styles.xml", data: utf8Encode(stylesXml) },
      ...visibleSheets.map((sheet, idx) => ({ name: `xl/worksheets/sheet${idx + 1}.xml`, data: utf8Encode(sheetXml(sheet.rows)) }))
    ];
    return zipStore(files);
  }
  function cellRefToColIndex(ref) {
    const m = String(ref || "").match(/[A-Z]+/i);
    if (!m) return 0;
    const letters = m[0].toUpperCase();
    let n = 0;
    for (let i = 0; i < letters.length; i += 1) n = n * 26 + (letters.charCodeAt(i) - 64);
    return n - 1;
  }
  function parseSharedStrings(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    const out = [];
    const items = doc.getElementsByTagName("si");
    for (const si of items) {
      const texts = Array.from(si.getElementsByTagName("t")).map((tNode) => tNode.textContent || "");
      out.push(texts.join(""));
    }
    return out;
  }
  function parseSheetXml(xmlText, sharedStrings) {
    var _a2, _b2, _c;
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    const sheetData = doc.getElementsByTagName("sheetData")[0];
    if (!sheetData) return [];
    const rows = [];
    const rowNodes = Array.from(sheetData.getElementsByTagName("row"));
    for (const rowNode of rowNodes) {
      const cells = Array.from(rowNode.getElementsByTagName("c"));
      const row = [];
      let maxCol = 0;
      for (const cell of cells) {
        const ref = cell.getAttribute("r") || "";
        const col = cellRefToColIndex(ref);
        maxCol = Math.max(maxCol, col);
        const type = cell.getAttribute("t") || "";
        let value = "";
        if (type === "s") {
          const v = ((_a2 = cell.getElementsByTagName("v")[0]) == null ? void 0 : _a2.textContent) || "";
          const idx = Number(v);
          value = (_b2 = sharedStrings[idx]) != null ? _b2 : "";
        } else if (type === "inlineStr") {
          const tNode = cell.getElementsByTagName("t")[0];
          value = (tNode == null ? void 0 : tNode.textContent) || "";
        } else {
          const v = ((_c = cell.getElementsByTagName("v")[0]) == null ? void 0 : _c.textContent) || "";
          value = v;
        }
        row[col] = value;
      }
      for (let i = 0; i <= maxCol; i += 1) if (row[i] === void 0) row[i] = "";
      rows.push(row);
    }
    return rows;
  }
  async function parseXlsx(file) {
    const entries = await unzip(await file.arrayBuffer());
    const getText = (name) => {
      const bytes = entries.get(name);
      return bytes ? utf8Decode(bytes) : "";
    };
    const workbookXml = getText("xl/workbook.xml");
    if (!workbookXml) throw new Error(t("xlsx \u6587\u4EF6\u7F3A\u5C11 workbook.xml\u3002", "Missing xl/workbook.xml."));
    const workbookDoc = new DOMParser().parseFromString(workbookXml, "application/xml");
    const sheetNodes = Array.from(workbookDoc.getElementsByTagName("sheet"));
    const relsXml = getText("xl/_rels/workbook.xml.rels");
    const relDoc = relsXml ? new DOMParser().parseFromString(relsXml, "application/xml") : null;
    const rels = /* @__PURE__ */ new Map();
    if (relDoc) {
      for (const rel of Array.from(relDoc.getElementsByTagName("Relationship"))) {
        const idValue = rel.getAttribute("Id") || "";
        const target = rel.getAttribute("Target") || "";
        if (idValue && target) rels.set(idValue, target);
      }
    }
    const sharedStrings = (() => {
      const xml = getText("xl/sharedStrings.xml");
      return xml ? parseSharedStrings(xml) : [];
    })();
    const sheets = [];
    for (const node of sheetNodes) {
      const name = node.getAttribute("name") || "";
      const stateAttr = node.getAttribute("state") || "";
      const hidden = stateAttr === "hidden" || stateAttr === "veryHidden";
      const rid = node.getAttribute("r:id") || "";
      const target = rels.get(rid) || "";
      const path = target ? target.startsWith("/") ? target.slice(1) : `xl/${target}` : "";
      const sheetXmlText = path ? getText(path) : "";
      const rows = sheetXmlText ? parseSheetXml(sheetXmlText, sharedStrings) : [];
      sheets.push({ name, hidden, rows });
    }
    return { sheets };
  }
  function isBomManagerExportXlsx(workbook) {
    var _a2, _b2;
    const meta = workbook.sheets.find((sheet) => sheet.name === "__BOM_MANAGER__");
    if (!meta) return false;
    const first = String(((_b2 = (_a2 = meta.rows) == null ? void 0 : _a2[0]) == null ? void 0 : _b2[0]) || "").trim();
    return first === "bom-manager-export";
  }
  async function importBomManagerExportXlsx(workbook) {
    const dbSheet = workbook.sheets.find((sheet) => sheet.name === "__BOM_DB__");
    if (!dbSheet) throw new Error(t("\u672A\u627E\u5230\u5185\u7F6E\u6570\u636E\u5E93\u5DE5\u4F5C\u8868\uFF08__BOM_DB__\uFF09\u3002", "Missing embedded database sheet (__BOM_DB__)."));
    const chunks = (dbSheet.rows || []).map((row) => String((row == null ? void 0 : row[0]) || "")).join("");
    if (!chunks.trim()) throw new Error(t("\u5185\u7F6E\u6570\u636E\u5E93\u4E3A\u7A7A\u3002", "Embedded database is empty."));
    const parsed = JSON.parse(chunks);
    state.db = nDb(parsed);
    await saveDb();
    setStatus("success", t("xlsx \u6570\u636E\u5E93\u5DF2\u5BFC\u5165\u3002", "XLSX database imported."));
    render();
  }
  function openXlsxMapping(workbook, fileName) {
    const firstVisible = workbook.sheets.find((sheet) => !sheet.hidden) || workbook.sheets[0] || null;
    if (!firstVisible) throw new Error(t("xlsx \u5185\u6CA1\u6709\u53EF\u7528\u5DE5\u4F5C\u8868\u3002", "No worksheet found in .xlsx."));
    state.modal = {
      type: "xlsx-map",
      fileName: String(fileName || ""),
      workbook,
      sheetName: firstVisible.name,
      targetKind: "components"
    };
    render();
  }
  function pickRowValueByHeader(headers, row, headerName) {
    var _a2;
    if (!headerName) return "";
    const idx = headers.findIndex((h) => String(h || "").trim() === String(headerName || "").trim());
    return idx >= 0 ? String((_a2 = row == null ? void 0 : row[idx]) != null ? _a2 : "").trim() : "";
  }
  async function importXlsxMapped(values) {
    if (!state.modal || state.modal.type !== "xlsx-map") return;
    const workbook = state.modal.workbook;
    const sheetName = String(values.sheetName || state.modal.sheetName || "").trim();
    const targetKind = String(values.targetKind || state.modal.targetKind || "").trim();
    const sheet = workbook.sheets.find((item) => item.name === sheetName);
    if (!sheet) throw new Error(t("\u9009\u62E9\u7684\u5DE5\u4F5C\u8868\u4E0D\u5B58\u5728\u3002", "Selected worksheet not found."));
    const rows = sheet.rows || [];
    if (rows.length < 2) throw new Error(t("\u5DE5\u4F5C\u8868\u6CA1\u6709\u6570\u636E\u884C\u3002", "Worksheet has no data rows."));
    const headers = (rows[0] || []).map((h) => String(h || "").trim());
    const body = rows.slice(1);
    if (targetKind === "components") {
      const typeHeader = String(values.typeName || "").trim();
      const modelHeader = String(values.model || "").trim();
      if (!typeHeader || !modelHeader) throw new Error(t("\u8BF7\u6620\u5C04 \u7C7B\u578B\u5217 \u4E0E \u578B\u53F7\u5217\u3002", "Please map Type column and Model column."));
      const items = [];
      for (const row of body) {
        const typeName = pickRowValueByHeader(headers, row, typeHeader);
        const model = pickRowValueByHeader(headers, row, modelHeader);
        if (!typeName || !model) continue;
        items.push({
          typeName,
          model,
          auxInfo: pickRowValueByHeader(headers, row, String(values.auxInfo || "")),
          note: pickRowValueByHeader(headers, row, String(values.note || "")),
          warningThreshold: Number(pickRowValueByHeader(headers, row, String(values.warningThreshold || "")) || 0)
        });
      }
      const count = importItems(items);
      await saveDb();
      setStatus("success", t(`xlsx \u5DF2\u5BFC\u5165 ${count} \u6761\u5143\u5668\u4EF6\u6570\u636E\u3002`, `XLSX imported ${count} component entries.`));
      state.modal = null;
      render();
      return;
    }
    if (targetKind === "types") {
      const nameHeader = String(values.name || "").trim();
      const primaryHeader = String(values.primaryName || "").trim();
      const secondaryHeader = String(values.secondaryName || "").trim();
      if (!nameHeader && !primaryHeader) throw new Error(t("\u8BF7\u6620\u5C04 \u7C7B\u578B\u540D\u79F0\u5217 \u6216 \u4E00\u7EA7\u7C7B\u578B\u5217\u3002", "Please map Type name column or Primary type column."));
      let count = 0;
      for (const row of body) {
        const name = nameHeader ? pickRowValueByHeader(headers, row, nameHeader) : "";
        const primaryName = primaryHeader ? pickRowValueByHeader(headers, row, primaryHeader) : "";
        const secondaryName = secondaryHeader ? pickRowValueByHeader(headers, row, secondaryHeader) : "";
        const resolved = String(name || (secondaryName ? `${primaryName}/${secondaryName}` : primaryName) || "").trim();
        if (!resolved) continue;
        if (state.db.types.some((item) => item.name.toLowerCase() === resolved.toLowerCase())) continue;
        state.db.types.push(nType({ id: id(), name: resolved, primaryName: resolved.split("/")[0], secondaryName: resolved.split("/")[1] || "", createdAt: iso(), updatedAt: iso() }));
        count += 1;
      }
      await saveDb();
      setStatus("success", t(`xlsx \u5DF2\u5BFC\u5165 ${count} \u6761\u7C7B\u578B\u6570\u636E\u3002`, `XLSX imported ${count} types.`));
      state.modal = null;
      render();
      return;
    }
    if (targetKind === "projects") {
      const nameHeader = String(values.name || "").trim();
      if (!nameHeader) throw new Error(t("\u8BF7\u6620\u5C04 \u9879\u76EE\u540D\u79F0\u5217\u3002", "Please map Project name column."));
      const noteHeader = String(values.note || "").trim();
      let count = 0;
      for (const row of body) {
        const name = pickRowValueByHeader(headers, row, nameHeader);
        if (!name) continue;
        const note = noteHeader ? pickRowValueByHeader(headers, row, noteHeader) : "";
        if (state.db.projects.some((item) => item.name.toLowerCase() === name.toLowerCase())) continue;
        state.db.projects.push(nProject({ id: id(), name, note, createdAt: iso(), updatedAt: iso() }));
        count += 1;
      }
      await saveDb();
      setStatus("success", t(`xlsx \u5DF2\u5BFC\u5165 ${count} \u6761\u9879\u76EE\u6570\u636E\u3002`, `XLSX imported ${count} projects.`));
      state.modal = null;
      render();
      return;
    }
    if (targetKind === "stores") {
      const platformHeader = String(values.platform || "").trim();
      const shopHeader = String(values.shopName || "").trim();
      if (!platformHeader || !shopHeader) throw new Error(t("\u8BF7\u6620\u5C04 \u5E73\u53F0\u5217 \u4E0E \u5E97\u94FA\u540D\u79F0\u5217\u3002", "Please map Platform column and Shop name column."));
      const pickNum = (row, header2) => {
        const raw = header2 ? pickRowValueByHeader(headers, row, header2) : "";
        const n = Number(raw);
        return Number.isFinite(n) ? n : 0;
      };
      let count = 0;
      for (const row of body) {
        const platform = pickRowValueByHeader(headers, row, platformHeader);
        const shopName = pickRowValueByHeader(headers, row, shopHeader);
        if (!platform || !shopName) continue;
        const key = `${platform}`.toLowerCase() + "::" + `${shopName}`.toLowerCase();
        if (state.db.stores.some((item) => `${item.platform}`.toLowerCase() + "::" + `${item.shopName}`.toLowerCase() === key)) continue;
        state.db.stores.push(nStore({
          id: id(),
          platform,
          shopName,
          qualityScore: pickNum(row, String(values.qualityScore || "")) || 5,
          priceScore: pickNum(row, String(values.priceScore || "")) || 5,
          shippingFee: pickNum(row, String(values.shippingFee || "")) || 0,
          referencePrice: pickNum(row, String(values.referencePrice || "")) || 0,
          mainProducts: pickRowValueByHeader(headers, row, String(values.mainProducts || "")),
          note: pickRowValueByHeader(headers, row, String(values.note || "")),
          createdAt: iso(),
          updatedAt: iso()
        }));
        count += 1;
      }
      await saveDb();
      setStatus("success", t(`xlsx \u5DF2\u5BFC\u5165 ${count} \u6761\u5E97\u94FA\u6570\u636E\u3002`, `XLSX imported ${count} stores.`));
      state.modal = null;
      render();
      return;
    }
    throw new Error(t("\u4E0D\u652F\u6301\u7684\u5BFC\u5165\u6620\u5C04\u7C7B\u578B\u3002", "Unsupported mapping target."));
  }
  async function importData() {
    const file = await edaApi.sys_FileSystem.openReadFileDialog(["json", "csv", "xlsx", "xls"], false);
    if (!file) return;
    const lower = String(file.name || "").toLowerCase();
    if (lower.endsWith(".json")) {
      const parsed = JSON.parse(await file.text());
      if (Array.isArray(parsed.types) && Array.isArray(parsed.components)) {
        state.db = nDb(parsed);
        await saveDb();
        setStatus("success", t("JSON \u6570\u636E\u5E93\u5DF2\u5BFC\u5165\u3002", "JSON database imported."));
        render();
        return;
      }
      const count = importItems(Array.isArray(parsed) ? parsed : parsed.items || []);
      await saveDb();
      setStatus("success", t(`\u5DF2\u5BFC\u5165 ${count} \u6761\u5143\u5668\u4EF6\u6570\u636E\u3002`, `Imported ${count} component entries.`));
      render();
      return;
    }
    if (lower.endsWith(".csv")) {
      const rows = parseCsv(await file.text());
      const key = (input) => String(input || "").trim().toLowerCase().replace(/[\s_\-\/()\[\]]+/g, "");
      const alias = { typeName: ["typename", "type", "\u7C7B\u522B", "\u7C7B\u578B", "\u5143\u5668\u4EF6\u7C7B\u578B"], model: ["model", "\u578B\u53F7", "\u6599\u53F7", "partnumber", "pn"], auxInfo: ["auxinfo", "\u8F85\u52A9\u4FE1\u606F", "\u53C2\u6570", "\u89C4\u683C"], note: ["note", "\u5907\u6CE8", "\u8BF4\u660E"], warningThreshold: ["warningthreshold", "\u9884\u8B66", "\u9608\u503C"], platform: ["platform", "\u5E73\u53F0"], link: ["link", "url", "\u94FE\u63A5"], quantity: ["quantity", "qty", "\u6570\u91CF"], pricePerUnit: ["priceperunit", "price", "\u5355\u4EF7", "\u4EF7\u683C"] };
      const headers = rows.length ? Object.keys(rows[0]) : [];
      const map = {};
      Object.keys(alias).forEach((field) => {
        map[field] = headers.find((header2) => alias[field].some((item) => key(header2).includes(key(item)) || key(item).includes(key(header2)))) || "";
      });
      if (!map.typeName || !map.model) throw new Error(t("CSV \u7F3A\u5C11\u53EF\u8BC6\u522B\u7684\u7C7B\u578B\u6216\u578B\u53F7\u5217\u3002", "CSV is missing recognizable type/model columns."));
      const items = [];
      const grouped = /* @__PURE__ */ new Map();
      rows.forEach((row) => {
        const pick = (field) => map[field] ? String(row[map[field]] || "").trim() : "";
        const typeName = pick("typeName");
        const model = pick("model");
        if (!typeName || !model) return;
        const groupKey = `${typeName}::${model}`;
        if (!grouped.has(groupKey)) grouped.set(groupKey, { typeName, model, auxInfo: pick("auxInfo"), note: pick("note"), warningThreshold: Number(pick("warningThreshold") || 0), records: [] });
        if (pick("platform") && pick("link") && Number(pick("quantity") || 0) > 0) grouped.get(groupKey).records.push({ platform: pick("platform"), link: pick("link"), quantity: Number(pick("quantity") || 0), pricePerUnit: Number(pick("pricePerUnit") || 0) });
      });
      grouped.forEach((value) => items.push(value));
      const count = importItems(items);
      await saveDb();
      setStatus("success", t(`CSV \u5DF2\u5BFC\u5165 ${count} \u6761\u5143\u5668\u4EF6\u6570\u636E\u3002`, `CSV imported ${count} component entries.`));
      render();
      return;
    }
    if (lower.endsWith(".xlsx")) {
      const workbook = await parseXlsx(file);
      if (isBomManagerExportXlsx(workbook)) {
        await importBomManagerExportXlsx(workbook);
        return;
      }
      setStatus("info", t("\u68C0\u6D4B\u5230\u666E\u901A xlsx\uFF0C\u8BF7\u5148\u8BBE\u7F6E\u6620\u5C04\u518D\u5BFC\u5165\u3002", "Detected a generic .xlsx. Please configure mapping before importing."));
      openXlsxMapping(workbook, file.name);
      return;
    }
    if (lower.endsWith(".xls")) {
      throw new Error(t("\u6682\u4E0D\u652F\u6301\u5BFC\u5165 .xls\uFF08\u4E8C\u8FDB\u5236\u65E7\u683C\u5F0F\uFF09\u3002\u8BF7\u5C06\u6587\u4EF6\u53E6\u5B58\u4E3A .xlsx \u6216 .csv \u540E\u518D\u5BFC\u5165\u3002", "Importing .xls is not supported. Please save as .xlsx or .csv and retry."));
    }
    throw new Error(t("\u5F53\u524D\u63D2\u4EF6\u7248\u672C\u652F\u6301\u5BFC\u5165 JSON/CSV/XLSX\u3002", "This build supports JSON/CSV/XLSX import."));
  }
  function normalizeHeaderKey(input) {
    return String(input || "").trim().toLowerCase().replace(/[\s_\-\/()\[\]#]+/g, "");
  }
  function findHeader(headers, candidates) {
    const normHeaders = headers.map((h) => ({ raw: h, key: normalizeHeaderKey(h) }));
    const candKeys = candidates.map(normalizeHeaderKey).filter(Boolean);
    for (const cand of candKeys) {
      const hit = normHeaders.find((h) => h.key === cand) || normHeaders.find((h) => h.key.includes(cand) || cand.includes(h.key));
      if (hit) return hit.raw;
    }
    return "";
  }
  function splitDelimitedLine(line, delimiter) {
    const result = [];
    let current = "";
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
        current = "";
        continue;
      }
      current += ch;
    }
    result.push(current);
    return result.map((x) => String(x != null ? x : "").trim());
  }
  function detectDelimiter(firstLine) {
    const s = String(firstLine || "");
    const comma = (s.match(/,/g) || []).length;
    const tab = (s.match(/\t/g) || []).length;
    const semi = (s.match(/;/g) || []).length;
    if (tab >= comma && tab >= semi && tab > 0) return "	";
    if (semi >= comma && semi > 0) return ";";
    return ",";
  }
  function parseDelimitedTable(text) {
    const lines = String(text || "").split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];
    const delimiter = detectDelimiter(lines[0]);
    const headers = splitDelimitedLine(lines[0], delimiter);
    return lines.slice(1).map((line) => {
      const values = splitDelimitedLine(line, delimiter);
      const row = {};
      for (let i = 0; i < headers.length; i += 1) row[headers[i]] = values[i] || "";
      return row;
    });
  }
  async function importEdaBomFromCurrent() {
    const pcbApi = edaApi == null ? void 0 : edaApi.pcb_ManufactureData;
    const schApi = edaApi == null ? void 0 : edaApi.sch_ManufactureData;
    const getBomFile = pcbApi && typeof pcbApi.getBomFile === "function" ? pcbApi.getBomFile.bind(pcbApi) : schApi && typeof schApi.getBomFile === "function" ? schApi.getBomFile.bind(schApi) : null;
    if (!getBomFile) {
      throw new Error(t("\u5F53\u524D EDA \u7248\u672C\u672A\u63D0\u4F9B\u751F\u4EA7\u8D44\u6599 BOM \u5BFC\u51FA\u63A5\u53E3\uFF08pcb_ManufactureData/sch_ManufactureData\uFF09\u3002", "Manufacture BOM API not available."));
    }
    setStatus("info", t("\u6B63\u5728\u4ECE\u5F53\u524D\u5DE5\u7A0B\u751F\u6210 BOM \u6587\u4EF6...", "Generating BOM file from current design..."));
    render();
    const bomFile = await getBomFile("eda-bom", "csv");
    if (!bomFile) {
      throw new Error(t("\u672A\u83B7\u53D6\u5230 BOM \u6587\u4EF6\u3002\u8BF7\u786E\u8BA4\u5F53\u524D\u5DF2\u6253\u5F00 PCB/\u539F\u7406\u56FE\u5DE5\u7A0B\u540E\u91CD\u8BD5\u3002", "No BOM file returned. Open a design and retry."));
    }
    const text = await bomFile.text();
    const rows = parseDelimitedTable(text);
    if (!rows.length) {
      throw new Error(t("BOM \u6587\u4EF6\u4E3A\u7A7A\u6216\u65E0\u6CD5\u89E3\u6790\u3002", "BOM file is empty or cannot be parsed."));
    }
    const headers = Object.keys(rows[0] || {});
    const qtyHeader = findHeader(headers, ["Quantity", "Qty", "\u6570\u91CF", "\u7528\u91CF", "QTY"]);
    const modelHeader = findHeader(headers, [
      "LCSC Part",
      "LCSC Part#",
      "LCSC Part #",
      "LCSC",
      "JLC Part",
      "JLCPCB Part",
      "Supplier Part",
      "Part Number",
      "MPN",
      "Manufacturer Part",
      "Manufacturer Part Number",
      "Model",
      "\u578B\u53F7",
      "Comment",
      "Value",
      "Name"
    ]);
    const typeHeader = findHeader(headers, ["Category", "Type", "\u5206\u7C7B", "\u7C7B\u578B"]);
    const refHeader = findHeader(headers, ["Designator", "Reference", "RefDes", "\u4F4D\u53F7", "\u6807\u53F7"]);
    const footprintHeader = findHeader(headers, ["Footprint", "Package", "\u5C01\u88C5"]);
    const descHeader = findHeader(headers, ["Description", "Desc", "\u63CF\u8FF0", "\u8BF4\u660E"]);
    if (!qtyHeader || !modelHeader) {
      throw new Error(
        t(
          `\u65E0\u6CD5\u8BC6\u522B BOM \u5173\u952E\u5217\uFF08\u6570\u91CF/\u578B\u53F7\uFF09\u3002\u5DF2\u8BC6\u522B\u5217\uFF1A${headers.join("\u3001")}`,
          `Cannot find key BOM columns (qty/model). Headers: ${headers.join(", ")}`
        )
      );
    }
    const num = (input) => {
      const n = Number(String(input || "").trim().replaceAll(/[, ]+/g, ""));
      return Number.isFinite(n) ? n : 0;
    };
    const grouped = /* @__PURE__ */ new Map();
    for (const row of rows) {
      const qty = num(row[qtyHeader]);
      const model = String(row[modelHeader] || "").trim();
      if (!model || qty <= 0) continue;
      const typeName = typeHeader ? String(row[typeHeader] || "").trim() : "";
      const key = `${(typeName || "EDA\u5BFC\u5165").toLowerCase()}::${model.toLowerCase()}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          typeName: typeName || "EDA\u5BFC\u5165",
          model,
          qty: 0,
          ref: /* @__PURE__ */ new Set(),
          footprint: /* @__PURE__ */ new Set(),
          desc: /* @__PURE__ */ new Set()
        });
      }
      const item = grouped.get(key);
      item.qty += qty;
      if (refHeader && row[refHeader]) item.ref.add(String(row[refHeader]).trim());
      if (footprintHeader && row[footprintHeader]) item.footprint.add(String(row[footprintHeader]).trim());
      if (descHeader && row[descHeader]) item.desc.add(String(row[descHeader]).trim());
    }
    if (!grouped.size) {
      throw new Error(t("BOM \u4E2D\u672A\u53D1\u73B0\u6709\u6548\u884C\uFF08\u578B\u53F7\u6216\u6570\u91CF\u4E3A\u7A7A\uFF09\u3002", "No valid BOM lines found."));
    }
    const now = /* @__PURE__ */ new Date();
    const nameSuffix = now.toLocaleString(locale(), { hour12: false });
    const project = nProject({ id: id(), name: `EDA \u5BFC\u5165 ${nameSuffix}`, note: t("\u4ECE\u5F53\u524D\u5DE5\u7A0B\u4E00\u952E\u5BFC\u5165 BOM \u81EA\u52A8\u751F\u6210\u3002", "Generated by one-click BOM import."), createdAt: iso(), updatedAt: iso() });
    state.db.projects.push(project);
    const pcb = nPcb({ id: id(), projectId: project.id, name: "\u5F53\u524D\u5DE5\u7A0B BOM", version: "", boardQuantity: 1, note: "", items: [], createdAt: iso(), updatedAt: iso() });
    state.db.pcbs.push(pcb);
    const ensureType = (typeName) => {
      const name = String(typeName || "").trim() || "EDA\u5BFC\u5165";
      let type = state.db.types.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
      if (!type) {
        type = nType({ id: id(), name, primaryName: name.split("/")[0], secondaryName: name.split("/")[1] || "", createdAt: iso(), updatedAt: iso() });
        state.db.types.push(type);
      }
      return type;
    };
    let createdComponents = 0;
    let createdBomItems = 0;
    for (const item of grouped.values()) {
      const type = ensureType(item.typeName);
      const model = String(item.model || "").trim();
      if (!model) continue;
      let component = state.db.components.find((entry) => entry.model.toLowerCase() === model.toLowerCase()) || state.db.components.find((entry) => entry.typeId === type.id && entry.model.toLowerCase() === model.toLowerCase());
      if (!component) {
        const auxParts = [];
        if (item.footprint.size) auxParts.push(`${t("\u5C01\u88C5", "Footprint")}: ${Array.from(item.footprint).join(" / ")}`);
        if (item.desc.size) auxParts.push(`${t("\u63CF\u8FF0", "Description")}: ${Array.from(item.desc).join(" / ")}`);
        if (item.ref.size) auxParts.push(`${t("\u4F4D\u53F7", "Ref")}: ${Array.from(item.ref).slice(0, 6).join(", ")}${item.ref.size > 6 ? ` (+${item.ref.size - 6})` : ""}`);
        component = nComponent({
          id: id(),
          typeId: type.id,
          model,
          auxInfo: auxParts.join("\n"),
          note: "",
          warningThreshold: 0,
          records: [],
          createdAt: iso(),
          updatedAt: iso()
        });
        state.db.components.push(component);
        createdComponents += 1;
      }
      const qtyPerBoard = Math.max(1, Math.round(Number(item.qty || 0)));
      pcb.items.push(nBomItem({ id: id(), componentId: component.id, quantityPerBoard: qtyPerBoard, createdAt: iso(), updatedAt: iso() }));
      createdBomItems += 1;
    }
    state.db = nDb(state.db);
    await saveDb();
    state.view = "projects";
    state.projectFilter = project.id;
    state.modal = { type: "bom", pcbId: pcb.id };
    setStatus("success", t(`\u5DF2\u5BFC\u5165 BOM\uFF1A\u65B0\u589E ${createdComponents} \u4E2A\u5143\u5668\u4EF6\uFF0C\u65B0\u589E ${createdBomItems} \u6761 BOM \u660E\u7EC6\u3002`, `BOM imported: +${createdComponents} components, +${createdBomItems} BOM items.`));
    render();
  }
  async function exportJson() {
    await edaApi.sys_FileSystem.saveFile(new Blob([jsonText()], { type: "application/json;charset=utf-8" }), "bom-data.json");
    setStatus("success", t("JSON \u5DF2\u5BFC\u51FA\u3002", "JSON exported."));
    render();
  }
  function safeFileStem(input) {
    return String(input || "").replaceAll(/[\r\n]+/g, " ").replaceAll(/[\\/:*?"<>|]+/g, "_").trim().slice(0, 80) || "export";
  }
  function calcPurchaseExport() {
    var _a2, _b2;
    const tMap = typeMap();
    const pMap = projectMap();
    const cMap = new Map(state.db.components.map((item) => [item.id, item]));
    const scope = state.purchase.scope === "pcb" ? "pcb" : "project";
    const projectId = state.purchase.projectId || "all";
    const pcbId = state.purchase.pcbId || "all";
    const shortageOnly = Boolean(state.purchase.shortageOnly);
    const pcbsByProject = projectId === "all" ? state.db.pcbs : state.db.pcbs.filter((item) => item.projectId === projectId);
    const pcbsForCalc = (() => {
      if (scope === "pcb") {
        if (pcbId === "all") return pcbsByProject;
        return pcbsByProject.filter((item) => item.id === pcbId);
      }
      return pcbsByProject;
    })();
    const required = /* @__PURE__ */ new Map();
    const usedBy = /* @__PURE__ */ new Map();
    for (const pcb of pcbsForCalc) {
      const pcbLabel = `${((_a2 = pMap.get(pcb.projectId)) == null ? void 0 : _a2.name) || t("\u672A\u77E5\u9879\u76EE", "Unknown Project")}/${pcb.name}${pcb.version ? `(${pcb.version})` : ""}`;
      for (const item of pcb.items) {
        const qty = Number(item.quantityPerBoard || 0) * Number(pcb.boardQuantity || 1);
        if (!required.has(item.componentId)) required.set(item.componentId, 0);
        required.set(item.componentId, required.get(item.componentId) + qty);
        if (!usedBy.has(item.componentId)) usedBy.set(item.componentId, /* @__PURE__ */ new Set());
        usedBy.get(item.componentId).add(pcbLabel);
      }
    }
    const lines = Array.from(required.entries()).map(([componentId, req]) => {
      var _a3;
      const component = cMap.get(componentId) || null;
      const inStock = component ? Number(component.totalQuantity || 0) : 0;
      const shortage = Math.max(0, Number(req || 0) - inStock);
      const unit = component && typeof component.lowestPrice === "number" ? component.lowestPrice : null;
      return {
        componentId,
        typeName: component ? ((_a3 = tMap.get(component.typeId)) == null ? void 0 : _a3.name) || t("\u672A\u77E5\u7C7B\u578B", "Unknown Type") : t("\u672A\u77E5\u7C7B\u578B", "Unknown Type"),
        model: component ? component.model : t("\u672A\u77E5\u5143\u5668\u4EF6", "Unknown Component"),
        required: Number(req || 0),
        inStock,
        shortage,
        unitPrice: unit,
        amount: unit === null ? null : unit * shortage,
        pcbs: Array.from(usedBy.get(componentId) || [])
      };
    }).filter((row) => shortageOnly ? row.shortage > 0 : true).sort((a, b) => a.model.localeCompare(b.model, locale()));
    const projectName = projectId === "all" ? t("\u5168\u90E8\u9879\u76EE", "All Projects") : ((_b2 = pMap.get(projectId)) == null ? void 0 : _b2.name) || t("\u672A\u77E5\u9879\u76EE", "Unknown Project");
    const pcbName = (() => {
      var _a3;
      if (scope !== "pcb") return "";
      if (pcbId === "all") return t("\u5168\u90E8 PCB", "All PCBs");
      const pcb = state.db.pcbs.find((item) => item.id === pcbId);
      if (!pcb) return t("\u672A\u77E5 PCB", "Unknown PCB");
      return `${((_a3 = pMap.get(pcb.projectId)) == null ? void 0 : _a3.name) || ""}/${pcb.name}${pcb.version ? `(${pcb.version})` : ""}`;
    })();
    const stem = safeFileStem(`purchase-${scope}-${scope === "project" ? projectName : pcbName || projectName}`);
    return {
      generatedAt: iso(),
      scope,
      projectId,
      pcbId,
      projectName,
      pcbName,
      shortageOnly,
      lines,
      fileStem: stem
    };
  }
  async function exportPurchaseJson() {
    const payload = calcPurchaseExport();
    await edaApi.sys_FileSystem.saveFile(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }),
      `${payload.fileStem}.json`
    );
    setStatus("success", t("\u91C7\u8D2D\u6E05\u5355 JSON \u5DF2\u5BFC\u51FA\u3002", "Purchase list JSON exported."));
    render();
  }
  async function exportPurchaseCsv() {
    const payload = calcPurchaseExport();
    const csvCell = (value) => {
      const s = String(value != null ? value : "");
      return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
    };
    const rows = [
      [t("\u7C7B\u578B", "Type"), t("\u578B\u53F7", "Model"), t("\u9700\u6C42", "Required"), t("\u5E93\u5B58", "In Stock"), t("\u7F3A\u53E3", "Shortage"), t("\u6700\u4F4E\u5355\u4EF7", "Unit"), t("\u9884\u8BA1\u91D1\u989D", "Amount"), t("\u6D89\u53CA PCB", "PCBs")],
      ...payload.lines.map((row) => [
        row.typeName,
        row.model,
        row.required,
        row.inStock,
        row.shortage,
        row.unitPrice === null ? "" : row.unitPrice,
        row.amount === null ? "" : row.amount,
        row.pcbs.join(" | ")
      ])
    ];
    const csv = `\uFEFF${rows.map((r) => r.map(csvCell).join(",")).join("\n")}`;
    await edaApi.sys_FileSystem.saveFile(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${payload.fileStem}.csv`);
    setStatus("success", t("\u91C7\u8D2D\u6E05\u5355 CSV \u5DF2\u5BFC\u51FA\u3002", "Purchase list CSV exported."));
    render();
  }
  function bomManagerExportSheets() {
    const tMap = typeMap();
    const pMap = projectMap();
    const sMap = storeMap();
    const dbJson = JSON.stringify(state.db);
    const chunkSize = 2e4;
    const chunks = [];
    for (let i = 0; i < dbJson.length; i += chunkSize) chunks.push([dbJson.slice(i, i + chunkSize)]);
    const metaRows = [
      ["bom-manager-export", "1"],
      ["createdAt", iso()],
      ["dbChunks", String(chunks.length)]
    ];
    const typesRows = [
      [t("\u7C7B\u578B", "Type"), t("\u4E00\u7EA7\u7C7B\u578B", "Primary"), t("\u4E8C\u7EA7\u7C7B\u578B", "Secondary")],
      ...sort(state.db.types, (item) => item.name).map((item) => [item.name, item.primaryName, item.secondaryName || ""])
    ];
    const componentsRows = [
      [t("\u7C7B\u578B", "Type"), t("\u578B\u53F7", "Model"), t("\u603B\u5E93\u5B58", "Total"), t("\u9884\u8B66\u9608\u503C", "Warn"), t("\u6700\u4F4E\u4EF7\u683C", "Lowest"), t("\u8F85\u52A9\u4FE1\u606F", "Aux"), t("\u5907\u6CE8", "Note")],
      ...sort(state.db.components, (item) => {
        var _a2;
        return `${((_a2 = tMap.get(item.typeId)) == null ? void 0 : _a2.name) || ""}${item.model}`;
      }).map((item) => {
        var _a2;
        return [
          ((_a2 = tMap.get(item.typeId)) == null ? void 0 : _a2.name) || "",
          item.model,
          item.totalQuantity,
          item.warningThreshold,
          item.lowestPrice === null ? "" : item.lowestPrice,
          item.auxInfo || "",
          item.note || ""
        ];
      })
    ];
    const recordsRows = [
      [t("\u7C7B\u578B", "Type"), t("\u578B\u53F7", "Model"), t("\u5E97\u94FA", "Store"), t("\u5E73\u53F0", "Platform"), t("\u94FE\u63A5", "Link"), t("\u6570\u91CF", "Qty"), t("\u5355\u4EF7", "Price"), t("\u65F6\u95F4", "Purchased At")],
      ...state.db.components.flatMap((component) => component.records.map((record) => {
        var _a2, _b2, _c;
        return [
          ((_a2 = tMap.get(component.typeId)) == null ? void 0 : _a2.name) || "",
          component.model,
          record.storeId ? `${((_b2 = sMap.get(record.storeId)) == null ? void 0 : _b2.platform) || ""}/${((_c = sMap.get(record.storeId)) == null ? void 0 : _c.shopName) || ""}` : "",
          record.platform,
          record.link,
          record.quantity,
          record.pricePerUnit,
          record.purchasedAt
        ];
      }))
    ];
    const storesRows = [
      [t("\u5E73\u53F0", "Platform"), t("\u5E97\u94FA\u540D\u79F0", "Shop"), t("\u8D28\u91CF\u8BC4\u5206", "Quality"), t("\u4EF7\u683C\u8BC4\u5206", "Price"), t("\u90AE\u8D39", "Shipping"), t("\u53C2\u8003\u4EF7\u683C", "Reference"), t("\u4E3B\u5356\u54C1", "Main Products"), t("\u5907\u6CE8", "Note")],
      ...sort(state.db.stores, (item) => `${item.platform}${item.shopName}`).map((item) => [item.platform, item.shopName, item.qualityScore, item.priceScore, item.shippingFee, item.referencePrice, item.mainProducts || "", item.note || ""])
    ];
    const projectsRows = [
      [t("\u9879\u76EE\u540D\u79F0", "Project"), t("\u5907\u6CE8", "Note")],
      ...sort(state.db.projects, (item) => item.name).map((item) => [item.name, item.note || ""])
    ];
    const pcbsRows = [
      [t("\u9879\u76EE", "Project"), t("PCB", "PCB"), t("\u7248\u672C", "Version"), t("\u6570\u91CF", "Board Qty"), t("\u5907\u6CE8", "Note")],
      ...sort(state.db.pcbs, (item) => {
        var _a2;
        return `${((_a2 = pMap.get(item.projectId)) == null ? void 0 : _a2.name) || ""}${item.name}${item.version}`;
      }).map((item) => {
        var _a2;
        return [
          ((_a2 = pMap.get(item.projectId)) == null ? void 0 : _a2.name) || "",
          item.name,
          item.version || "",
          item.boardQuantity,
          item.note || ""
        ];
      })
    ];
    const bomRows = [
      [t("\u9879\u76EE", "Project"), t("PCB", "PCB"), t("\u7248\u672C", "Version"), t("\u7C7B\u578B", "Type"), t("\u578B\u53F7", "Model"), t("\u5355\u677F\u9700\u6C42", "Qty per Board")],
      ...state.db.pcbs.flatMap((pcb) => pcb.items.map((bom) => {
        var _a2, _b2;
        const c = state.db.components.find((it) => it.id === bom.componentId);
        return [
          ((_a2 = pMap.get(pcb.projectId)) == null ? void 0 : _a2.name) || "",
          pcb.name,
          pcb.version || "",
          c ? ((_b2 = tMap.get(c.typeId)) == null ? void 0 : _b2.name) || "" : "",
          c ? c.model : "",
          bom.quantityPerBoard
        ];
      }))
    ];
    return [
      { name: "__BOM_MANAGER__", hidden: true, rows: metaRows },
      { name: "__BOM_DB__", hidden: true, rows: chunks },
      { name: "Types", rows: typesRows },
      { name: "Components", rows: componentsRows },
      { name: "Records", rows: recordsRows },
      { name: "Stores", rows: storesRows },
      { name: "Projects", rows: projectsRows },
      { name: "PCBs", rows: pcbsRows },
      { name: "BOM", rows: bomRows }
    ];
  }
  async function exportXlsx() {
    const bytes = buildXlsxWorkbook(bomManagerExportSheets());
    await edaApi.sys_FileSystem.saveFile(
      new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      "bom-data.xlsx"
    );
    setStatus("success", t("Excel(xlsx) \u5DF2\u5BFC\u51FA\u3002", "Excel (.xlsx) exported."));
    render();
  }
  async function exportXls() {
    return exportXlsx();
  }
  async function resetData() {
    if (!window.confirm(t("\u786E\u8BA4\u6E05\u7A7A\u5168\u90E8\u6570\u636E\uFF1F", "Clear all data?"))) return;
    state.db = emptyDb();
    state.componentFilter = { keyword: "", typeId: "all", warningOnly: false };
    state.projectFilter = "all";
    state.editingTypeId = state.editingComponentId = state.editingProjectId = state.editingPcbId = state.editingStoreId = null;
    state.modal = null;
    await saveDb();
    setStatus("success", t("\u6570\u636E\u5DF2\u91CD\u7F6E\u3002", "Data reset."));
    render();
  }
  async function submitType(values) {
    const primaryName = String(values.primaryName || "").trim();
    const secondaryName = String(values.secondaryName || "").trim();
    if (!primaryName) throw new Error(t("\u4E00\u7EA7\u7C7B\u578B\u4E0D\u80FD\u4E3A\u7A7A\u3002", "Primary type is required."));
    const name = secondaryName ? `${primaryName}/${secondaryName}` : primaryName;
    if (state.db.types.some((item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== values.typeId)) throw new Error(t("\u7C7B\u578B\u5DF2\u5B58\u5728\u3002", "Type already exists."));
    if (values.typeId) {
      const item = state.db.types.find((entry) => entry.id === values.typeId);
      if (!item) throw new Error(t("\u7C7B\u578B\u4E0D\u5B58\u5728\u3002", "Type not found."));
      Object.assign(item, nType({ ...item, name, primaryName, secondaryName, updatedAt: iso() }));
    } else {
      state.db.types.push(nType({ id: id(), name, primaryName, secondaryName, createdAt: iso(), updatedAt: iso() }));
    }
    state.editingTypeId = null;
    await saveDb();
    setStatus("success", t("\u7C7B\u578B\u5DF2\u4FDD\u5B58\u3002", "Type saved."));
    render();
  }
  async function deleteType(idValue) {
    if (state.db.components.some((item) => item.typeId === idValue)) throw new Error(t("\u8BE5\u7C7B\u578B\u4ECD\u88AB\u5143\u5668\u4EF6\u5F15\u7528\u3002", "This type is still referenced by components."));
    if (!window.confirm(t("\u786E\u8BA4\u5220\u9664\u8BE5\u7C7B\u578B\uFF1F", "Delete this type?"))) return;
    state.db.types = state.db.types.filter((item) => item.id !== idValue);
    if (state.editingTypeId === idValue) state.editingTypeId = null;
    await saveDb();
    setStatus("success", t("\u7C7B\u578B\u5DF2\u5220\u9664\u3002", "Type deleted."));
    render();
  }
  async function submitComponent(values) {
    const typeId = String(values.typeId || "").trim();
    const model = String(values.model || "").trim();
    const warningThreshold = Number(values.warningThreshold || 0);
    if (!typeId || !model) throw new Error(t("\u7C7B\u578B\u548C\u578B\u53F7\u4E3A\u5FC5\u586B\u9879\u3002", "Type and model are required."));
    if (warningThreshold < 0 || Number.isNaN(warningThreshold)) throw new Error(t("\u9884\u8B66\u9608\u503C\u5FC5\u987B\u5927\u4E8E\u7B49\u4E8E 0\u3002", "Warning threshold must be greater than or equal to 0."));
    if (values.componentId) {
      const item = state.db.components.find((entry) => entry.id === values.componentId);
      if (!item) throw new Error(t("\u5143\u5668\u4EF6\u4E0D\u5B58\u5728\u3002", "Component not found."));
      Object.assign(item, nComponent({ ...item, typeId, model, auxInfo: values.auxInfo || "", note: values.note || "", warningThreshold, updatedAt: iso() }));
    } else {
      state.db.components.push(nComponent({ id: id(), typeId, model, auxInfo: values.auxInfo || "", note: values.note || "", warningThreshold, records: [], createdAt: iso(), updatedAt: iso() }));
    }
    state.editingComponentId = null;
    await saveDb();
    setStatus("success", t("\u5143\u5668\u4EF6\u5DF2\u4FDD\u5B58\u3002", "Component saved."));
    render();
  }
  async function deleteComponent(idValue) {
    if (state.db.pcbs.some((pcb) => pcb.items.some((item) => item.componentId === idValue))) throw new Error(t("\u8BE5\u5143\u5668\u4EF6\u5DF2\u88AB PCB BOM \u5F15\u7528\u3002", "This component is referenced by PCB BOM items."));
    if (!window.confirm(t("\u786E\u8BA4\u5220\u9664\u8BE5\u5143\u5668\u4EF6\uFF1F", "Delete this component?"))) return;
    state.db.components = state.db.components.filter((item) => item.id !== idValue);
    if (state.editingComponentId === idValue) state.editingComponentId = null;
    await saveDb();
    setStatus("success", t("\u5143\u5668\u4EF6\u5DF2\u5220\u9664\u3002", "Component deleted."));
    render();
  }
  async function submitRecord(values) {
    const component = state.db.components.find((item) => item.id === values.componentId);
    if (!component) throw new Error(t("\u5143\u5668\u4EF6\u4E0D\u5B58\u5728\u3002", "Component not found."));
    const quantity = Number(values.quantity || 0);
    const pricePerUnit = Number(values.pricePerUnit || 0);
    if (quantity <= 0) throw new Error(t("\u6570\u91CF\u5FC5\u987B\u5927\u4E8E 0\u3002", "Quantity must be greater than 0."));
    if (pricePerUnit < 0) throw new Error(t("\u4EF7\u683C\u4E0D\u80FD\u5C0F\u4E8E 0\u3002", "Price cannot be below 0."));
    if (values.recordId) {
      const record = component.records.find((item) => item.id === values.recordId);
      if (!record) throw new Error(t("\u91C7\u8D2D\u8BB0\u5F55\u4E0D\u5B58\u5728\u3002", "Record not found."));
      Object.assign(record, nRecord({ ...record, storeId: values.storeId || void 0, platform: values.platform || "", link: values.link || "", quantity, pricePerUnit, updatedAt: iso() }));
    } else {
      component.records.push(nRecord({ id: id(), storeId: values.storeId || void 0, platform: values.platform || "", link: values.link || "", quantity, pricePerUnit, purchasedAt: iso(), createdAt: iso(), updatedAt: iso() }));
    }
    const index = state.db.components.findIndex((item) => item.id === component.id);
    state.db.components[index] = nComponent(component);
    state.modal = null;
    await saveDb();
    setStatus("success", t("\u91C7\u8D2D\u8BB0\u5F55\u5DF2\u4FDD\u5B58\u3002", "Record saved."));
    render();
  }
  async function deleteRecord(componentId, recordId) {
    const component = state.db.components.find((item) => item.id === componentId);
    if (!component) return;
    if (!window.confirm(t("\u786E\u8BA4\u5220\u9664\u8FD9\u6761\u91C7\u8D2D\u8BB0\u5F55\uFF1F", "Delete this record?"))) return;
    component.records = component.records.filter((item) => item.id !== recordId);
    const index = state.db.components.findIndex((item) => item.id === component.id);
    state.db.components[index] = nComponent(component);
    await saveDb();
    setStatus("success", t("\u91C7\u8D2D\u8BB0\u5F55\u5DF2\u5220\u9664\u3002", "Record deleted."));
    render();
  }
  async function submitProject(values) {
    const name = String(values.name || "").trim();
    if (!name) throw new Error(t("\u9879\u76EE\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\u3002", "Project name is required."));
    if (state.db.projects.some((item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== values.projectId)) throw new Error(t("\u9879\u76EE\u540D\u79F0\u5DF2\u5B58\u5728\u3002", "Project name already exists."));
    if (values.projectId) {
      const item = state.db.projects.find((entry) => entry.id === values.projectId);
      if (!item) throw new Error(t("\u9879\u76EE\u4E0D\u5B58\u5728\u3002", "Project not found."));
      Object.assign(item, nProject({ ...item, name, note: values.note || "", updatedAt: iso() }));
    } else {
      state.db.projects.push(nProject({ id: id(), name, note: values.note || "", createdAt: iso(), updatedAt: iso() }));
    }
    state.editingProjectId = null;
    await saveDb();
    setStatus("success", t("\u9879\u76EE\u5DF2\u4FDD\u5B58\u3002", "Project saved."));
    render();
  }
  async function deleteProject(idValue) {
    if (state.db.pcbs.some((item) => item.projectId === idValue)) throw new Error(t("\u8BE5\u9879\u76EE\u4E0B\u4ECD\u6709 PCB\u3002", "This project still contains PCBs."));
    if (!window.confirm(t("\u786E\u8BA4\u5220\u9664\u8BE5\u9879\u76EE\uFF1F", "Delete this project?"))) return;
    state.db.projects = state.db.projects.filter((item) => item.id !== idValue);
    if (state.editingProjectId === idValue) state.editingProjectId = null;
    await saveDb();
    setStatus("success", t("\u9879\u76EE\u5DF2\u5220\u9664\u3002", "Project deleted."));
    render();
  }
  async function submitPcb(values) {
    const projectId = String(values.projectId || "").trim();
    const name = String(values.name || "").trim();
    const version = String(values.version || "").trim();
    const boardQuantity = Number(values.boardQuantity || 1);
    if (!projectId || !name) throw new Error(t("\u6240\u5C5E\u9879\u76EE\u548C PCB \u540D\u79F0\u4E3A\u5FC5\u586B\u9879\u3002", "Project and PCB name are required."));
    if (boardQuantity <= 0 || Number.isNaN(boardQuantity)) throw new Error(t("\u9879\u76EE\u7528\u677F\u6570\u91CF\u5FC5\u987B\u5927\u4E8E 0\u3002", "Board quantity must be greater than 0."));
    if (state.db.pcbs.some((item) => item.projectId === projectId && item.name.toLowerCase() === name.toLowerCase() && item.version.toLowerCase() === version.toLowerCase() && item.id !== values.pcbId)) throw new Error(t("\u8BE5\u9879\u76EE\u4E0B\u540C\u540D\u540C\u7248\u672C PCB \u5DF2\u5B58\u5728\u3002", "A PCB with the same name/version already exists in this project."));
    if (values.pcbId) {
      const item = state.db.pcbs.find((entry) => entry.id === values.pcbId);
      if (!item) throw new Error(t("PCB \u4E0D\u5B58\u5728\u3002", "PCB not found."));
      Object.assign(item, nPcb({ ...item, projectId, name, version, boardQuantity, note: values.note || "", updatedAt: iso() }));
    } else {
      state.db.pcbs.push(nPcb({ id: id(), projectId, name, version, boardQuantity, note: values.note || "", items: [], createdAt: iso(), updatedAt: iso() }));
    }
    state.editingPcbId = null;
    await saveDb();
    setStatus("success", t("PCB \u5DF2\u4FDD\u5B58\u3002", "PCB saved."));
    render();
  }
  async function deletePcb(idValue) {
    if (!window.confirm(t("\u786E\u8BA4\u5220\u9664\u8BE5 PCB\uFF1F", "Delete this PCB?"))) return;
    state.db.pcbs = state.db.pcbs.filter((item) => item.id !== idValue);
    if (state.editingPcbId === idValue) state.editingPcbId = null;
    await saveDb();
    setStatus("success", t("PCB \u5DF2\u5220\u9664\u3002", "PCB deleted."));
    render();
  }
  async function submitBom(values) {
    const pcb = state.db.pcbs.find((item) => item.id === values.pcbId);
    if (!pcb) throw new Error(t("PCB \u4E0D\u5B58\u5728\u3002", "PCB not found."));
    const componentId = String(values.componentId || "").trim();
    const quantityPerBoard = Number(values.quantityPerBoard || 0);
    if (!componentId || quantityPerBoard <= 0) throw new Error(t("\u5143\u5668\u4EF6\u548C\u6570\u91CF\u5FC5\u987B\u6709\u6548\u3002", "Component and quantity are required."));
    if (pcb.items.some((item) => item.componentId === componentId && item.id !== values.itemId)) throw new Error(t("\u8BE5 PCB \u5DF2\u5B58\u5728\u76F8\u540C\u5143\u5668\u4EF6\u660E\u7EC6\u3002", "This PCB already contains the selected component."));
    if (values.itemId) {
      const item = pcb.items.find((entry) => entry.id === values.itemId);
      if (!item) throw new Error(t("BOM \u660E\u7EC6\u4E0D\u5B58\u5728\u3002", "BOM item not found."));
      Object.assign(item, nBomItem({ ...item, componentId, quantityPerBoard, updatedAt: iso() }));
    } else {
      pcb.items.push(nBomItem({ id: id(), componentId, quantityPerBoard, createdAt: iso(), updatedAt: iso() }));
    }
    pcb.updatedAt = iso();
    state.modal = { type: "bom", pcbId: pcb.id };
    await saveDb();
    setStatus("success", t("BOM \u660E\u7EC6\u5DF2\u4FDD\u5B58\u3002", "BOM item saved."));
    render();
  }
  async function deleteBomItem(pcbId, itemId) {
    const pcb = state.db.pcbs.find((item) => item.id === pcbId);
    if (!pcb) return;
    if (!window.confirm(t("\u786E\u8BA4\u5220\u9664\u8FD9\u6761 BOM \u660E\u7EC6\uFF1F", "Delete this BOM item?"))) return;
    pcb.items = pcb.items.filter((item) => item.id !== itemId);
    pcb.updatedAt = iso();
    state.modal = { type: "bom", pcbId };
    await saveDb();
    setStatus("success", t("BOM \u660E\u7EC6\u5DF2\u5220\u9664\u3002", "BOM item deleted."));
    render();
  }
  async function submitStore(values) {
    const platform = String(values.platform || "").trim();
    const shopName = String(values.shopName || "").trim();
    if (!platform || !shopName) throw new Error(t("\u5E73\u53F0\u548C\u5E97\u94FA\u540D\u79F0\u4E3A\u5FC5\u586B\u9879\u3002", "Platform and store name are required."));
    if (values.storeId) {
      const item = state.db.stores.find((entry) => entry.id === values.storeId);
      if (!item) throw new Error(t("\u5E97\u94FA\u4E0D\u5B58\u5728\u3002", "Store not found."));
      Object.assign(item, nStore({ ...item, platform, shopName, qualityScore: values.qualityScore, priceScore: values.priceScore, shippingFee: values.shippingFee, referencePrice: values.referencePrice, mainProducts: values.mainProducts || "", note: values.note || "", updatedAt: iso() }));
    } else {
      state.db.stores.push(nStore({ id: id(), platform, shopName, qualityScore: values.qualityScore, priceScore: values.priceScore, shippingFee: values.shippingFee, referencePrice: values.referencePrice, mainProducts: values.mainProducts || "", note: values.note || "", createdAt: iso(), updatedAt: iso() }));
    }
    state.editingStoreId = null;
    await saveDb();
    setStatus("success", t("\u5E97\u94FA\u8BC4\u4EF7\u5DF2\u4FDD\u5B58\u3002", "Store saved."));
    render();
  }
  async function deleteStore(idValue) {
    if (state.db.components.some((item) => item.records.some((record) => record.storeId === idValue))) throw new Error(t("\u8BE5\u5E97\u94FA\u4ECD\u88AB\u91C7\u8D2D\u8BB0\u5F55\u5F15\u7528\u3002", "This store is still referenced by purchase records."));
    if (!window.confirm(t("\u786E\u8BA4\u5220\u9664\u8BE5\u5E97\u94FA\uFF1F", "Delete this store?"))) return;
    state.db.stores = state.db.stores.filter((item) => item.id !== idValue);
    if (state.editingStoreId === idValue) state.editingStoreId = null;
    await saveDb();
    setStatus("success", t("\u5E97\u94FA\u8BC4\u4EF7\u5DF2\u5220\u9664\u3002", "Store deleted."));
    render();
  }
  app.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.filter === "component-keyword") {
      state.componentFilter.keyword = target.value;
      render();
    }
  });
  app.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.filter === "component-type") {
      state.componentFilter.typeId = target.value;
      render();
    }
    if (target.dataset.filter === "component-warning") {
      state.componentFilter.warningOnly = target.checked;
      render();
    }
    if (target.dataset.filter === "project-filter") {
      state.projectFilter = target.value;
      render();
    }
    if (target.dataset.filter === "purchase-scope") {
      state.purchase.scope = target.value === "pcb" ? "pcb" : "project";
      render();
    }
    if (target.dataset.filter === "purchase-project") {
      state.purchase.projectId = target.value || "all";
      state.purchase.pcbId = "all";
      render();
    }
    if (target.dataset.filter === "purchase-pcb") {
      state.purchase.pcbId = target.value || "all";
      render();
    }
    if (target.dataset.filter === "purchase-shortage-only") {
      state.purchase.shortageOnly = target.checked;
      render();
    }
    if (target.dataset.xlsxMap === "sheet" && state.modal && state.modal.type === "xlsx-map") {
      state.modal.sheetName = target.value;
      render();
    }
    if (target.dataset.xlsxMap === "target" && state.modal && state.modal.type === "xlsx-map") {
      state.modal.targetKind = target.value;
      render();
    }
  });
  app.addEventListener("click", (event) => {
    const rawTarget = event.target instanceof HTMLElement ? event.target : null;
    if (!rawTarget) return;
    const target = rawTarget.closest("button[data-action],a[data-action]") || (rawTarget.hasAttribute("data-action") ? rawTarget : null);
    if (!target) return;
    const action = target.dataset.action;
    const modalRoot = event.target instanceof HTMLElement ? event.target.closest("[data-modal-root]") : null;
    if (action === "close-modal" && modalRoot && event.target !== target) return;
    Promise.resolve().then(async () => {
      try {
        state.status = "";
        if (action === "view") {
          state.view = target.dataset.view || "dashboard";
          render();
          return;
        }
        if (action === "import") return importData();
        if (action === "import-eda-bom") return importEdaBomFromCurrent();
        if (action === "export-json") return exportJson();
        if (action === "export-xlsx") return exportXlsx();
        if (action === "export-xls") return exportXlsx();
        if (action === "purchase-export-json") return exportPurchaseJson();
        if (action === "purchase-export-csv") return exportPurchaseCsv();
        if (action === "reset") return resetData();
        if (action === "cancel-type") {
          state.editingTypeId = null;
          render();
          return;
        }
        if (action === "edit-type") {
          state.view = "types";
          state.editingTypeId = target.dataset.id;
          render();
          return;
        }
        if (action === "delete-type") return deleteType(target.dataset.id);
        if (action === "cancel-component") {
          state.editingComponentId = null;
          render();
          return;
        }
        if (action === "edit-component") {
          state.view = "components";
          state.editingComponentId = target.dataset.id;
          render();
          return;
        }
        if (action === "delete-component") return deleteComponent(target.dataset.id);
        if (action === "record-modal") {
          state.modal = { type: "record", componentId: target.dataset.componentId, recordId: target.dataset.recordId || null };
          render();
          return;
        }
        if (action === "delete-record") return deleteRecord(target.dataset.componentId, target.dataset.recordId);
        if (action === "cancel-project") {
          state.editingProjectId = null;
          render();
          return;
        }
        if (action === "edit-project") {
          state.view = "projects";
          state.editingProjectId = target.dataset.id;
          render();
          return;
        }
        if (action === "delete-project") return deleteProject(target.dataset.id);
        if (action === "cancel-pcb") {
          state.editingPcbId = null;
          render();
          return;
        }
        if (action === "edit-pcb") {
          state.view = "projects";
          state.editingPcbId = target.dataset.id;
          render();
          return;
        }
        if (action === "delete-pcb") return deletePcb(target.dataset.id);
        if (action === "bom-modal") {
          state.modal = { type: "bom", pcbId: target.dataset.pcbId, itemId: target.dataset.itemId || null };
          render();
          return;
        }
        if (action === "delete-bom-item") return deleteBomItem(target.dataset.pcbId, target.dataset.itemId);
        if (action === "cancel-store") {
          state.editingStoreId = null;
          render();
          return;
        }
        if (action === "edit-store") {
          state.view = "stores";
          state.editingStoreId = target.dataset.id;
          render();
          return;
        }
        if (action === "delete-store") return deleteStore(target.dataset.id);
        if (action === "close-modal") {
          state.modal = null;
          render();
        }
      } catch (error) {
        setStatus("error", error instanceof Error ? error.message : t("\u64CD\u4F5C\u5931\u8D25\u3002", "Operation failed."));
        render();
      }
    });
  });
  app.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    Promise.resolve().then(async () => {
      try {
        state.status = "";
        if (form.id === "type-form") return submitType(values);
        if (form.id === "component-form") return submitComponent(values);
        if (form.id === "record-form") return submitRecord(values);
        if (form.id === "project-form") return submitProject(values);
        if (form.id === "pcb-form") return submitPcb(values);
        if (form.id === "bom-form") return submitBom(values);
        if (form.id === "store-form") return submitStore(values);
        if (form.id === "xlsx-map-form") return importXlsxMapped(values);
        if (form.id === "prefs-form") {
          state.prefs = { lang: values.lang === "en" ? "en" : "zh", theme: values.theme === "dark" ? "dark" : "light" };
          await savePrefs();
          setStatus("success", t("\u504F\u597D\u5DF2\u4FDD\u5B58\u3002", "Preferences saved."));
          render();
        }
      } catch (error) {
        setStatus("error", error instanceof Error ? error.message : t("\u64CD\u4F5C\u5931\u8D25\u3002", "Operation failed."));
        render();
      }
    });
  });
  render();
})();
