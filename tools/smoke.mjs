#!/usr/bin/env node
/* =========================================================================
   Дымовой тест приложения: поднимает index.html в jsdom, прокликивает все
   разделы, фильтры, сравнение и подбор, и падает, если что-то не отрисовалось
   или в консоли появилась ошибка.

   Запуск:  npm i && npm run smoke        (нужен devDependency jsdom)
   ========================================================================= */

import { JSDOM, VirtualConsole } from "jsdom";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = path.join(ROOT, "index.html");

const problems = [];
const errors = [];

const vc = new VirtualConsole();
vc.on("jsdomError", (e) => {
  // jsdom не умеет window.scrollTo — приложение это переживает, шум не считаем.
  if (!/Not implemented: (Window's|window\.)scrollTo/.test(e.message)) errors.push("jsdomError: " + e.message);
});
vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));

const dom = new JSDOM(fs.readFileSync(INDEX, "utf8"), {
  url: "file://" + INDEX,
  runScripts: "dangerously",
  resources: "usable",
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(win) {
    win.matchMedia = win.matchMedia || ((q) => ({
      matches: false, media: q, addEventListener() {}, removeEventListener() {}
    }));
    win.IntersectionObserver = class {
      constructor(cb) { this.cb = cb; }
      observe(el) { this.cb([{ isIntersecting: true, target: el }], this); }
      unobserve() {}
      disconnect() {}
    };
  }
});

const { window } = dom;
const doc = window.document;
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function expect(cond, message) {
  if (!cond) problems.push(message);
}

await wait(900);

/* --- шапка и каталог ---------------------------------------------------- */
expect(!doc.getElementById("boot-fallback"), "остался экран «скрипты не запустились» — приложение не поднялось");
expect(doc.querySelectorAll("#tabs a").length >= 8, "в навигации меньше 8 разделов");
expect(doc.querySelector("#hero-stats dd"), "не отрисована сводка в шапке");
expect(doc.querySelector(".footer-meta")?.textContent.includes("Версия данных"), "в подвале нет версии данных");

const cards = doc.querySelectorAll(".card").length;
expect(cards >= 30, `в каталоге отрисовалось ${cards} карточек вместо 30+`);

const q = doc.getElementById("q");
expect(q, "в каталоге нет поиска");
if (q) {
  q.value = "MI50";
  q.dispatchEvent(new window.Event("input", { bubbles: true }));
  await wait(60);
  expect(doc.querySelectorAll(".card").length < cards, "поиск «MI50» ничего не отфильтровал");
  q.value = "";
  q.dispatchEvent(new window.Event("input", { bubbles: true }));
  await wait(60);
}
const sort = doc.getElementById("sort");
if (sort) {
  sort.value = "price";
  sort.dispatchEvent(new window.Event("input", { bubbles: true }));
  await wait(60);
  expect(doc.querySelectorAll(".card").length === cards, "сортировка по цене потеряла карточки");
}
const reset = doc.getElementById("reset");
if (reset) { reset.click(); await wait(80); }

/* --- все разделы -------------------------------------------------------- */
const ROUTES = [
  ["#/catalog", 2000], ["#/compare", 800], ["#/picker", 2000], ["#/builds", 3000],
  ["#/guides", 1500], ["#/mods", 3000], ["#/sources", 3000], ["#/about", 1500]
];
for (const [route, minLength] of ROUTES) {
  window.location.hash = route;
  await wait();
  const view = doc.getElementById("view");
  expect(view.innerHTML.length > minLength, `раздел ${route} отрисовался подозрительно коротко (${view.innerHTML.length})`);
  expect(doc.querySelectorAll("#tabs a[aria-current='page']").length === 1, `в разделе ${route} не подсвечен активный пункт меню`);
}

/* --- сравнение ---------------------------------------------------------- */
window.location.hash = "#/compare";
await wait(150);
const picks = doc.querySelectorAll("[data-pick]");
expect(picks.length >= 30, "на странице сравнения нет списка карт");
if (picks.length >= 3) {
  picks[0].click(); picks[1].click(); picks[2].click();
  await wait(120);
  const rows = doc.querySelectorAll("#cmp-out tbody tr").length;
  expect(rows >= 15, `таблица сравнения содержит всего ${rows} строк`);
  expect(doc.querySelectorAll("#cmp-out td.best").length > 0, "в сравнении не подсвечены лучшие значения");
}

/* --- подбор под модель -------------------------------------------------- */
window.location.hash = "#/picker";
await wait(150);
const quant = doc.getElementById("q2");
const model = doc.getElementById("m");
expect(quant && model, "нет формы подбора под модель");
if (quant && model) {
  const unlocked = doc.getElementById("u2");
  const fits = () => doc.querySelectorAll("#picker-out .fit-row").length;
  const set = (el, value, event = "input") => {
    el.value = value;
    el.dispatchEvent(new window.Event(event, { bubbles: true }));
  };

  // 70B в Q4 (≈42 ГБ) без модов не влезает ни в одну карту — приложение обязано это сказать.
  set(model, "llama33-70b");
  set(quant, "q4");
  await wait(100);
  expect(fits() === 0, "70B Q4 «влез» в карту со стоковой памятью — проверьте расчёт VRAM");

  // С включённым модом VRAM влезают 170HX (64 ГБ) и 2080 Ti 44 ГБ.
  unlocked.checked = true;
  unlocked.dispatchEvent(new window.Event("input", { bubbles: true }));
  await wait(100);
  expect(fits() >= 2, `70B Q4 с модами нашёл ${fits()} подходящих карт, ожидалось минимум 2`);

  // 235B в Q1 (≈51 ГБ) помещается только в 64 ГБ 170HX.
  set(model, "qwen3-235a22");
  set(quant, "q1");
  await wait(100);
  const names = [...doc.querySelectorAll("#picker-out .fit-row strong")].map((el) => el.textContent);
  expect(names.length >= 1, "235B Q1 не нашлось карт, хотя 170HX с 64 ГБ должен проходить");
  expect(names.some((n) => /170HX/.test(n)), "170HX потерялся в подборе под 235B Q1");

  // и обратно: без модов 235B не должен никуда влезать
  unlocked.checked = false;
  unlocked.dispatchEvent(new window.Event("input", { bubbles: true }));
  await wait(100);
  expect(fits() === 0, "235B Q1 «влез» в стоковую карту — проверьте, не считается ли мод всегда");
}

/* --- карточка карты и гайд --------------------------------------------- */
for (const [hash, checks] of [
  ["#/gpu/cmp-170hx", [["спецификации", ".spec-block", 5], ["модификации", ".accordion", 2], ["замеры", "table tbody tr", 3], ["блок «из коробки / после мода»", ".vs-col", 2]]],
  ["#/gpu/tesla-p40", [["спецификации", ".spec-block", 5], ["замеры", "table tbody tr", 2]]],
  ["#/guide/unlock-170hx", [["команды", "pre", 1], ["таблицы", "table", 1]]],
  ["#/guide/x99-bios", [["таблицы", "table", 2]]]
]) {
  window.location.hash = hash;
  await wait(150);
  const view = doc.getElementById("view");
  for (const [what, selector, min] of checks) {
    const found = view.querySelectorAll(selector).length;
    expect(found >= min, `${hash}: не отрисовано «${what}» (${selector}: ${found} < ${min})`);
  }
}

/* --- ссылки ------------------------------------------------------------- */
const badLinks = [...doc.querySelectorAll("#view a[href^='http']")].filter((a) => !/^https?:\/\//.test(a.getAttribute("href")));
expect(!badLinks.length, "есть ссылки без http(s)");

/* --- итог --------------------------------------------------------------- */
console.log(`Дымовой тест: разделов ${ROUTES.length}, карточек в каталоге ${cards}.`);
if (problems.length) {
  for (const p of problems) console.error("  ✗ " + p);
}
if (errors.length) {
  for (const e of errors) console.error("  ⚠ " + e);
}
if (problems.length || errors.length) {
  console.error("\nПровалено.");
  process.exit(1);
}
console.log("✓ Интерфейс работает.");
