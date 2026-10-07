#!/usr/bin/env node
/* =========================================================================
   Локализация: отчёт о покрытии и генератор черновика словаря.

     node tools/i18n-status.mjs                  # покрытие по языкам
     node tools/i18n-status.mjs --missing en     # чего не хватает
     node tools/i18n-status.mjs --skeleton en    # черновик словаря (ключи = русские строки)
     node tools/i18n-status.mjs --list           # все строки к переводу с путями

   Русский — исходный язык: ключом словаря служит ровно та строка, которая
   есть в данных, разметке или коде интерфейса.
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const CYR = /[А-Яа-яЁё]/;
const DATA = ["meta", "tools", "gpus-nvidia-mining", "gpus-nvidia-tesla", "gpus-amd", "gpus-intel-and-mods", "builds", "guides"];

global.window = global;
for (const f of DATA) require(path.join(ROOT, "assets", "data", f + ".js"));

/** Все русские строки данных: { строка → [путь, …] } */
const strings = new Map();
const CODEY = /[{}]|;\s|=>|\bvar \b|\bfunction\b|\breturn\b|\bdocument\.|\bwindow\./;

const add = (s, where) => {
  if (typeof s !== "string" || !CYR.test(s) || s.trim().length < 2) return;
  if (CODEY.test(s)) return;                       // обрывки кода, попавшие в срез литерала
  // Разметку внутри строки переводить бессмысленно: берём только видимые тексты и подписи.
  if (/<[a-z/!]/i.test(s)) {
    for (const m of s.matchAll(/>([^<>]+)</g)) add(m[1], where + ":текст");
    for (const m of s.matchAll(/(?:aria-label|title|placeholder)="([^"]+)"/g)) add(m[1], where + ":подпись");
    return;
  }
  const list = strings.get(s) || [];
  if (!list.includes(where)) list.push(where);
  strings.set(s, list);
};

(function walk(node, prefix) {
  if (typeof node === "string") return add(node, prefix);
  if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${prefix}[${i}]`));
  if (node && typeof node === "object") {
    for (const k of Object.keys(node)) walk(node[k], prefix ? `${prefix}.${k}` : k);
  }
})(global.BLDL, "BLDL");

/* Строки интерфейса: литералы в app.js.
   Регулярное выражение жадное только внутри кавычек нужного типа, поэтому
   HTML-шаблоны попадают сюда целиком — их разбираем по тегам. */
const appSrc = fs.readFileSync(path.join(ROOT, "assets", "js", "app.js"), "utf8");
const appStrings = new Set();
for (const m of appSrc.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
  const raw = m[2].replace(/\\n/g, " ").replace(/\\"/g, '"');
  for (const part of raw.split(/<[^>]*>/)) {
    const t = part.replace(/\s+/g, " ").replace(/^[-–—·•]\s*/, "").trim();
    if (CYR.test(t) && t.length > 1 && !CODEY.test(t)) appStrings.add(t);
  }
  for (const a of raw.matchAll(/(?:title|aria-label|placeholder)="([^"]+)"/g)) {
    if (CYR.test(a[1]) && !CODEY.test(a[1])) appStrings.add(a[1].trim());
  }
}
for (const s of appStrings) if (!strings.has(s)) strings.set(s, ["app.js"]);

/* Тексты и подписи из index.html */
const htmlSrc = fs.readFileSync(path.join(ROOT, "index.html"), "utf8")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<script[\s\S]*?<\/script>/g, "");
for (const m of htmlSrc.matchAll(/>([^<>]+)</g)) add(m[1].replace(/\s+/g, " ").trim(), "index.html");
for (const m of htmlSrc.matchAll(/(?:aria-label|title|placeholder|alt)="([^"]+)"/g)) add(m[1].trim(), "index.html:подпись");

/* Словари */
const dictDir = path.join(ROOT, "assets", "i18n");
const dicts = {};
for (const file of fs.existsSync(dictDir) ? fs.readdirSync(dictDir) : []) {
  if (!file.endsWith(".js") || file.startsWith("_")) continue;
  const code = file.replace(/\.js$/, "");
  const src = fs.readFileSync(path.join(dictDir, file), "utf8");
  const body = src.slice(src.indexOf("strings"));
  const keys = new Set();
  for (const m of body.matchAll(/\n\s*"((?:\\.|[^"\\])*)":/g)) keys.add(JSON.parse('"' + m[1] + '"'));
  const ruleBlock = src.slice(src.indexOf("rules"));
  let rules = 0;
  for (const _ of ruleBlock.matchAll(/\n\s*\["/g)) rules++;
  dicts[code] = { keys, rules, file };
}

const args = process.argv.slice(2);
const mode = args[0] || "--report";
const target = args[1] || "en";
const all = [...strings.keys()].sort((a, b) => a.localeCompare(b, "ru"));

if (mode === "--skeleton") {
  const dest = path.join(dictDir, `_skeleton-${target}.js`);
  const body = all.map((s) => `    ${JSON.stringify(s)}: "",`).join("\n");
  fs.writeFileSync(dest, `/* Черновик словаря: ключи — русские строки, значения заполните переводом.\n   Затем переименуйте файл в assets/i18n/${target}.js и удалите строки, которые не нужны. */\nwindow.BLDL = window.BLDL || {};\nBLDL.i18n = BLDL.i18n || {};\nBLDL.i18n.${target} = {\n  strings: {\n${body}\n  },\n  rules: []\n};\n`, "utf8");
  console.log(`Черновик: assets/i18n/_skeleton-${target}.js — ${all.length} строк`);
} else if (mode === "--missing") {
  const d = dicts[target];
  if (!d) { console.error("Нет словаря:", target); process.exit(1); }
  const missing = all.filter((s) => !d.keys.has(s));
  console.log(`Не переведено в «${target}»: ${missing.length} из ${all.length}`);
  for (const s of missing) console.log(`${JSON.stringify(s)}\t${strings.get(s).slice(0, 2).join(" | ")}`);
} else if (mode === "--list") {
  for (const s of all) console.log(`${JSON.stringify(s)}\t${strings.get(s)[0]}`);
} else {
  console.log(`Строк к переводу: ${all.length}`);
  for (const [code, d] of Object.entries(dicts)) {
    const hit = all.filter((s) => d.keys.has(s)).length;
    const extra = [...d.keys].filter((k) => !strings.has(k) && !/[{}]/.test(k));
    console.log(`  ${code}: словарь ${hit} строк (${Math.round((hit / all.length) * 100)}%), правил ${d.rules}` +
      (extra.length ? `, вне источников: ${extra.length}` : ""));
  }
}
