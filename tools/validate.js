#!/usr/bin/env node
/* =========================================================================
   Проверка данных базы. Запуск:  node tools/validate.js
   Без зависимостей. Возвращает код 1, если что-то не сходится, — это то,
   что гоняет CI на каждый pull request.
   ========================================================================= */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "assets", "data");

const ORDER = [
  "meta.js",
  "tools.js",
  "gpus-nvidia-mining.js",
  "gpus-nvidia-tesla.js",
  "gpus-amd.js",
  "gpus-intel-and-mods.js",
  "builds.js",
  "guides.js"
];

const errors = [];
const warnings = [];

function fail(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

/* --- 1. Синтаксис и загрузка ------------------------------------------- */
global.window = global;
for (const file of ORDER) {
  const full = path.join(DATA, file);
  if (!fs.existsSync(full)) { fail(`нет файла данных: assets/data/${file}`); continue; }
  try {
    require(full);
  } catch (err) {
    fail(`не загружается assets/data/${file}: ${err.message}`);
  }
}

const B = global.BLDL || {};
const GPUS = B.gpus || [];
const TOOLS = B.tools || [];
const BUILDS = B.builds || [];
const GUIDES = B.guides || [];
const META = B.meta || {};
const SOURCES = META.sources || [];

if (!GPUS.length) fail("BLDL.gpus пуст — проверьте порядок загрузки файлов");
if (!TOOLS.length) fail("BLDL.tools пуст");
if (!SOURCES.length) fail("BLDL.meta.sources пуст");

const sourceIds = new Set(SOURCES.map(s => s.id));
const toolIds = new Set(TOOLS.map(t => t.id));
const gpuIds = new Set(GPUS.map(g => g.id));
const categories = new Set(Object.keys(META.categories || {}));
const confidenceLevels = new Set(Object.keys(META.confidence || {}));
const modelIds = new Set((META.models || []).map(m => m.id));

/* --- 2. Уникальность id ------------------------------------------------ */
function checkUnique(name, list) {
  const seen = new Set();
  for (const item of list) {
    if (!item || !item.id) { fail(`${name}: запись без id (${JSON.stringify(item).slice(0, 60)})`); continue; }
    if (seen.has(item.id)) fail(`${name}: повторяющийся id «${item.id}»`);
    seen.add(item.id);
  }
}
checkUnique("gpus", GPUS);
checkUnique("tools", TOOLS);
checkUnique("builds", BUILDS);
checkUnique("guides", GUIDES);
checkUnique("meta.sources", SOURCES);
checkUnique("meta.models", META.models || []);

/* --- 3. Карты ---------------------------------------------------------- */
const REQUIRED = ["name", "arch", "year", "category", "memory", "compute", "io", "power", "prices", "verdict", "bestFor", "limits", "benchmarks", "links"];

for (const g of GPUS) {
  const where = `gpu:${g.id}`;

  for (const field of REQUIRED) {
    if (g[field] === undefined || g[field] === null) fail(`${where}: нет обязательного поля «${field}»`);
  }
  if (!categories.has(g.category)) fail(`${where}: неизвестная категория «${g.category}»`);

  const mem = g.memory || {};
  if (typeof mem.stock !== "number" || mem.stock <= 0) fail(`${where}: memory.stock должен быть положительным числом`);
  if (typeof mem.bandwidth !== "number" || mem.bandwidth <= 0) fail(`${where}: memory.bandwidth должен быть положительным числом`);
  if (!mem.type) fail(`${where}: не указан memory.type`);
  if (mem.mod !== undefined && mem.mod !== null) {
    if (typeof mem.mod !== "number" || mem.mod <= mem.stock) fail(`${where}: memory.mod (${mem.mod}) должен быть больше memory.stock (${mem.stock})`);
    if (mem.mod > 512) warn(`${where}: memory.mod=${mem.mod} ГБ — проверьте, не лишний ли ноль`);
    if (!mem.modNote) warn(`${where}: есть мод VRAM, но нет memory.modNote — читателю неоткуда узнать цену вопроса`);
  }

  const io = g.io || {};
  if (typeof io.videoOut !== "boolean") fail(`${where}: io.videoOut должен быть true/false`);
  if (io.pcieGen !== null && typeof io.pcieGen !== "number") fail(`${where}: io.pcieGen должен быть числом или null (если слотов нет вообще)`);
  if (typeof io.pcieLanes !== "number") fail(`${where}: io.pcieLanes должен быть числом`);
  if (io.pcieGen === null && !io.pcieNote) fail(`${where}: PCIe отсутствует — нужен pcieNote с объяснением`);

  const comp = g.compute || {};

  const pw = g.power || {};
  if (typeof pw.tdp !== "number" || pw.tdp <= 0) fail(`${where}: power.tdp должен быть положительным числом`);
  if (pw.measuredLoad === undefined) warn(`${where}: не указано реальное потребление (power.measuredLoad)`);

  const pr = g.prices || {};
  if (typeof pr.low !== "number" || typeof pr.high !== "number") fail(`${where}: prices.low/high должны быть числами`);
  if (pr.low > pr.high) fail(`${where}: prices.low (${pr.low}) больше prices.high (${pr.high})`);
  if (!pr.updated) fail(`${where}: не указана дата цены (prices.updated)`);
  if (!pr.volatility) warn(`${where}: не указана волатильность цены`);
  if (Array.isArray(pr.history)) {
    let prev = "";
    for (const point of pr.history) {
      if (typeof point.price !== "number") fail(`${where}: prices.history без числовой цены`);
      if (prev && String(point.date) < prev) warn(`${where}: prices.history идёт не по возрастанию даты`);
      prev = String(point.date);
    }
  }

  for (const mod of g.mods || []) {
    if (!mod.toolId) fail(`${where}: у модификации нет toolId`);
    else if (!toolIds.has(mod.toolId)) fail(`${where}: модификация ссылается на неизвестный инструмент «${mod.toolId}»`);
    if (!mod.title || !mod.result) fail(`${where}: у модификации ${mod.toolId} нет title или result`);
  }

  const benches = g.benchmarks || [];
  if (!benches.length) warn(`${where}: нет ни одного замера (benchmarks)`);
  for (const b of benches) {
    const bwhere = `${where}:bench(${b.model || "?"})`;
    if (!b.model) fail(`${bwhere}: нет модели`);
    if (!b.backend) fail(`${bwhere}: не указан бэкенд`);
    if (!confidenceLevels.has(b.confidence)) fail(`${bwhere}: неизвестный уровень достоверности «${b.confidence}»`);
    if (!b.src) {
      if (b.confidence !== "estimated") fail(`${bwhere}: нет ссылки на источник (benchmarks[].src), а достоверность «${b.confidence}»`);
    } else if (!sourceIds.has(b.src)) {
      fail(`${bwhere}: источник «${b.src}» отсутствует в meta.sources`);
    }
    if (b.tg !== null && b.tg !== undefined && b.tg <= 0) fail(`${bwhere}: tg <= 0`);
    if (b.tg === undefined) warn(`${bwhere}: нет ни tg, ни явного null`);
  }

  for (const link of g.links || []) {
    if (!/^https?:\/\//.test(link.url || "")) fail(`${where}: ссылка без http(s): ${link.url}`);
  }
  if (!(g.links || []).length) fail(`${where}: нет ссылок на источники`);

  if (!(g.bestFor || []).length) warn(`${where}: пустой bestFor`);
  if (!(g.limits || []).length) warn(`${where}: пустой limits — не указаны реальные ограничения карты`);
}

/* --- 4. Инструменты ---------------------------------------------------- */
const TOOL_TYPES = new Set(["unlock", "driver", "firmware", "kernel-patch", "tuning", "engine", "runtime", "hardware-mod", "engine-patch"]);
for (const t of TOOLS) {
  const where = `tool:${t.id}`;
  if (!t.name || !t.url || !t.summary) fail(`${where}: нужны name, url, summary`);
  if (!/^https?:\/\//.test(t.url)) fail(`${where}: url без http(s)`);
  if (t.type && !TOOL_TYPES.has(t.type)) warn(`${where}: тип «${t.type}» не из списка оформления`);
  if (typeof t.soldering !== "boolean") fail(`${where}: soldering должен быть true/false — это ключевой признак для читателя`);
  if (!Array.isArray(t.cards) || !t.cards.length) fail(`${where}: не указано, к каким картам применим`);
  if (!Array.isArray(t.unlocks) || !t.unlocks.length) warn(`${where}: пустой список unlocks`);
  for (const u of t.unlocks || []) {
    if (!u.feature || !u.status) fail(`${where}: у элемента unlocks нет feature/status`);
  }
  for (const s of t.sources || []) {
    if (!sourceIds.has(s)) fail(`${where}: источник «${s}» отсутствует в meta.sources`);
  }
  if (!(t.sources || []).length) warn(`${where}: нет ссылок на источники`);
}

/* --- 5. Сборки и гайды ------------------------------------------------- */
for (const b of BUILDS) {
  const where = `build:${b.id}`;
  if (!b.title || !b.platform) fail(`${where}: нужны title и platform`);
  if (!b.author || !b.date) warn(`${where}: не указаны автор/дата — отчёт без автора сложно проверить`);
  if (b.source && !/^https?:\/\//.test(b.source)) fail(`${where}: source без http(s)`);
  if (!b.source) warn(`${where}: нет ссылки на первоисточник`);
  if (!(b.whatWorked || []).length && !(b.whatFailed || []).length) warn(`${where}: нет разбора «что сработало / что нет»`);
  for (const r of b.results || []) {
    if (!r.model) fail(`${where}: результат без названия модели`);
    if (r.tg === undefined) warn(`${where}: результат по «${r.model}» без tg`);
  }
}

const BLOCK_TYPES = new Set(["h", "p", "ul", "ol", "note", "code", "table"]);
for (const g of GUIDES) {
  const where = `guide:${g.id}`;
  if (!g.title || !g.summary) fail(`${where}: нужны title и summary`);
  if (!Array.isArray(g.blocks) || !g.blocks.length) fail(`${where}: пустой blocks`);
  for (const b of g.blocks || []) {
    if (!BLOCK_TYPES.has(b.type)) { fail(`${where}: неизвестный тип блока «${b.type}»`); continue; }
    if (b.type === "table") {
      if (!Array.isArray(b.head) || !Array.isArray(b.rows)) fail(`${where}: таблица без head/rows`);
      else for (const row of b.rows) {
        if (row.length !== b.head.length) fail(`${where}: строка таблицы из ${row.length} ячеек при ${b.head.length} колонках`);
      }
    } else if (b.type === "ul" || b.type === "ol") {
      if (!Array.isArray(b.items)) fail(`${where}: список без items`);
    } else if (typeof b.text !== "string") {
      fail(`${where}: блок «${b.type}» без текста`);
    }
  }
  for (const l of g.links || []) {
    if (!/^https?:\/\//.test(l.url || "")) fail(`${where}: ссылка без http(s): ${l.url}`);
  }
}

/* --- 6. Справочник моделей и приложение -------------------------------- */
for (const m of META.models || []) {
  const where = `model:${m.id}`;
  if (!m.name) fail(`${where}: нет name`);
  if (!m.bytes || !Object.keys(m.bytes).length) fail(`${where}: нет размеров по квантизациям (bytes)`);
  if (typeof m.kvGBper1k !== "number") fail(`${where}: нет kvGBper1k`);
}

const indexPath = path.join(ROOT, "index.html");
if (!fs.existsSync(indexPath)) {
  fail("нет index.html");
} else {
  const html = fs.readFileSync(indexPath, "utf8");
  for (const file of ORDER) {
    if (!html.includes(`assets/data/${file}`)) fail(`index.html не подключает assets/data/${file}`);
  }
  if (!html.includes("assets/js/app.js")) fail("index.html не подключает assets/js/app.js");
  if (!html.includes("Content-Security-Policy")) warn("в index.html нет meta CSP");
  if (/https?:\/\/(?!www\.w3\.org)[^"'`\s]+/.test(html.replace(/<!--[\s\S]*?-->/g, "")) && /<script[^>]+src="https?:/.test(html)) {
    fail("index.html подключает внешний скрипт — база обязана работать офлайн");
  }
}

/* --- 7. Локализация ---------------------------------------------------- */
(function checkI18n() {
  const dir = path.join(ROOT, "assets", "i18n");
  const runtime = path.join(ROOT, "assets", "js", "i18n.js");
  if (!fs.existsSync(runtime)) { fail("нет assets/js/i18n.js — переключатель языка не заработает"); return; }
  if (!fs.existsSync(dir)) { fail("нет каталога assets/i18n со словарями"); return; }

  // список языков должен совпадать со словарями
  const runtimeSrc = fs.readFileSync(runtime, "utf8");
  const declared = [...runtimeSrc.matchAll(/\{\s*code:\s*"(\w+)"/g)].map((m) => m[1]);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js") && !f.startsWith("_")).map((f) => f.replace(/\.js$/, ""));
  if (!declared.includes("ru")) fail("русский язык должен быть в списке языков по умолчанию");
  for (const code of declared) {
    if (code !== "ru" && !files.includes(code)) fail(`язык «${code}» объявлен, но словаря assets/i18n/${code}.js нет`);
  }
  for (const code of files) {
    if (!declared.includes(code)) fail(`есть словарь ${code}.js, но язык не объявлен в i18n.js`);
  }

  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  for (const code of files) {
    if (!html.includes(`assets/i18n/${code}.js`)) fail(`словарь ${code}.js не подключён в index.html`);
    const src = fs.readFileSync(path.join(dir, `${code}.js`), "utf8");
    if (!/BLDL\.i18n\.\w+\s*=\s*\{/.test(src)) fail(`${code}.js не похож на словарь (нет BLDL.i18n.${code} = {...})`);
    if (!/strings:\s*\{/.test(src)) fail(`в ${code}.js нет секции strings`);
    if (!/rules:\s*\[/.test(src)) warn(`в ${code}.js нет секции rules — подстановки вроде «Показано N из M» не переведутся`);
  }
  if (!html.includes('id="lang-switch"')) fail("в index.html нет контейнера переключателя языков");
  if (!/<svg/.test(runtimeSrc) && !/svg/i.test(fs.readFileSync(path.join(ROOT, "assets", "js", "app.js"), "utf8"))) {
    warn("флаги рисуются не инлайн-SVG: офлайн-режим может пострадать");
  }
})();

/* --- 8. Отчёт ---------------------------------------------------------- */
const stats = {
  "карт": GPUS.length,
  "замеров": GPUS.reduce((n, g) => n + (g.benchmarks || []).length, 0),
  "инструментов": TOOLS.length,
  "сборок": BUILDS.length,
  "гайдов": GUIDES.length,
  "источников": SOURCES.length,
  "моделей": (META.models || []).length
};
console.log("Проверено: " + Object.keys(stats).map(k => `${k} ${stats[k]}`).join(", "));

if (warnings.length) {
  console.log(`\nПредупреждения (${warnings.length}):`);
  for (const w of warnings) console.log("  · " + w);
}
if (errors.length) {
  console.error(`\nОшибки (${errors.length}):`);
  for (const e of errors) console.error("  ✗ " + e);
  process.exit(1);
}
console.log("\n✓ Данные корректны.");
