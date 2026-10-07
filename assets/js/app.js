/* =========================================================================
   BudgetLLM GPUs — приложение.
   Без зависимостей, без сети. Работает и по http(s), и по file://.
   ========================================================================= */
(function () {
  "use strict";

  var D = window.BLDL || {};
  var GPUS = (D.gpus || []).slice();
  var TOOLS = D.tools || [];
  var BUILDS = D.builds || [];
  var GUIDES = D.guides || [];
  var META = D.meta || {};
  var CATS = META.categories || {};

  /* ======================= утилиты ==================================== */

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function num(v, digits) {
    if (v === null || v === undefined || v === "") return "—";
    var n = Number(v);
    if (!isFinite(n)) return esc(v);
    return n.toLocaleString("ru-RU", {
      minimumFractionDigits: digits || 0,
      maximumFractionDigits: digits === undefined ? (Math.abs(n) < 10 && n % 1 !== 0 ? 1 : 0) : digits
    });
  }
  function toolById(id) { for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i].id === id) return TOOLS[i]; return null; }
  function gpuById(id) { for (var i = 0; i < GPUS.length; i++) if (GPUS[i].id === id) return GPUS[i]; return null; }
  function cat(c) { return CATS[c] || { label: c, color: "#7d746b", ink: "#7d746b", soft: "#ebe4d7" }; }
  function money(v) { return "$" + num(v); }
  function priceLabel(g) {
    var p = g.prices || {};
    if (p.low === undefined || p.low === null) return "—";
    return money(p.low) + "–" + num(p.high);
  }
  function volatilityCls(v) {
    if (!v) return "";
    v = v.toLowerCase();
    if (v.indexOf("экстрем") >= 0) return "bad";
    if (v.indexOf("высок") >= 0) return "warn";
    if (v.indexOf("средн") >= 0) return "info";
    return "good";
  }
  function conf(c) {
    var m = (META.confidence || {})[c] || {};
    return '<span class="badge ' + (m.cls || "") + '" title="' + esc(m.hint || "") + '">' + esc(m.label || c || "") + "</span>";
  }
  function bestBench(g) {
    if (!g.benchmarks || !g.benchmarks.length) return null;
    var best = null;
    for (var i = 0; i < g.benchmarks.length; i++) {
      var b = g.benchmarks[i];
      if (b.tg === null || b.tg === undefined) continue;
      if (!best || b.tg > best.tg) best = b;
    }
    return best;
  }
  function modsCount(g) { return (g.mods || []).length; }
  function needsSoldering(g) {
    var m = g.mods || [];
    for (var i = 0; i < m.length; i++) {
      var t = toolById(m[i].toolId);
      if (t && t.soldering) return true;
      if (m[i].soldering) return true;
    }
    return false;
  }
  function effectiveVram(g, unlocked) {
    var m = g.memory || {};
    if (unlocked && m.mod) return m.mod;
    return m.stock || 0;
  }
  function estimate(g, bytes) {
    var bw = (g.memory || {}).bandwidth || 0;
    var ceiling = bytes > 0 ? bw / (bytes * 1.15) : 0;
    return {
      ceiling: Math.round(ceiling),
      low: Math.round(ceiling * 0.45),
      high: Math.round(Math.min(ceiling * 0.72, 250))
    };
  }
  function measuredFor(g, modelBytes) {
    var list = g.benchmarks || [];
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      if (!b.tg) continue;
      return b; // замеры в базе уже подобраны под карту, берём первый как ориентир
    }
    return null;
  }

  /* ======================= тема и шапка =============================== */

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem("bldl-theme"); } catch (e) { saved = null; }
    if (!saved) {
      saved = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", saved);
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", cur);
    try { localStorage.setItem("bldl-theme", cur); } catch (e) { /* приватный режим — не страшно */ }
  }

  function renderHeroStats() {
    var host = document.getElementById("hero-stats");
    if (!host) return;
    var benchmarks = 0, mods = 0;
    GPUS.forEach(function (g) { benchmarks += (g.benchmarks || []).length; mods += modsCount(g); });
    var items = [
      ["Карт", GPUS.length],
      ["Замеров", benchmarks],
      ["Модов и прошивок", TOOLS.length],
      ["Сборок", BUILDS.length]
    ];
    host.innerHTML = items.map(function (it) {
      return "<div><dt>" + esc(it[0]) + "</dt><dd>" + num(it[1]) + "</dd></div>";
    }).join("");
  }

  /* ======================= общие блоки разметки ======================= */

  function badges(g) {
    var c = cat(g.category);
    var out = ['<span class="badge cat" style="background:' + esc(c.soft) + ";color:" + esc(c.ink) + '">' + esc(c.label) + "</span>"];
    if (g.memory && g.memory.mod) out.push('<span class="badge good">мод до ' + num(g.memory.mod) + " ГБ</span>");
    if (g.mods && g.mods.length) out.push('<span class="badge info">' + g.mods.length + " мод" + (g.mods.length > 1 ? "а" : "") + "</span>");
    if (g.io && g.io.videoOut === false) out.push('<span class="badge">без видеовыходов</span>');
    return '<div class="badges">' + out.join("") + "</div>";
  }

  function cardHTML(g) {
    var c = cat(g.category);
    var bb = bestBench(g);
    var mem = g.memory || {};
    var push = {
      "--cat-color": c.color, "--cat-soft": c.soft, "--cat-ink": c.ink
    };
    var style = Object.keys(push).map(function (k) { return k + ":" + push[k]; }).join(";");
    var vram = num(mem.stock) + (mem.mod ? " → " + num(mem.mod) : "") + " ГБ";
    return '' +
      '<article class="card reveal" style="' + style + '">' +
        '<div class="card-body">' +
          '<h3 class="card-title"><a href="#/gpu/' + esc(g.id) + '">' + esc(g.name) + "</a></h3>" +
          '<p class="card-sub">' + esc(g.arch) + " · " + esc(g.year) + "</p>" +
          badges(g) +
          '<dl class="card-specs">' +
            "<div><dt>VRAM</dt><dd>" + esc(vram) + "</dd></div>" +
            "<div><dt>ПСП</dt><dd>" + num(mem.bandwidth) + " ГБ/с</dd></div>" +
            "<div><dt>TDP</dt><dd>" + num((g.power || {}).tdp) + " Вт</dd></div>" +
            "<div><dt>PCIe</dt><dd>" + (g.io && g.io.pcieGen ? "Gen" + g.io.pcieGen + " x" + g.io.pcieLanes : "нет") + "</dd></div>" +
          "</dl>" +
          (bb ? '<div class="badge good">до ' + num(bb.tg, 1) + " ток/с (" + esc(bb.model) + " " + esc(bb.quant || "") + ")</div>" : "") +
          '<div class="card-foot">' +
            '<span class="price">' + esc(priceLabel(g)) + "<small>" + esc((g.prices || {}).volatility || "") + " волатильность</small></span>" +
            '<a class="btn btn-sm" href="#/gpu/' + esc(g.id) + '">Подробнее →</a>' +
          "</div>" +
        "</div>" +
      "</article>";
  }

  function sparkline(hist) {
    if (!hist || hist.length < 2) return "";
    var w = 240, h = 54, pad = 6;
    var prices = hist.map(function (x) { return x.price; });
    var min = Math.min.apply(null, prices), max = Math.max.apply(null, prices);
    var span = max - min || 1;
    var pts = hist.map(function (x, i) {
      var px = pad + (w - pad * 2) * (i / (hist.length - 1));
      var py = h - pad - (h - pad * 2) * ((x.price - min) / span);
      return [px, py];
    });
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var area = line + " L" + pts[pts.length - 1][0].toFixed(1) + " " + h + " L" + pts[0][0].toFixed(1) + " " + h + " Z";
    var dots = pts.map(function (p, i) {
      return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.5"><title>' +
        esc(hist[i].date + ": $" + hist[i].price + (hist[i].label ? " — " + hist[i].label : "")) + "</title></circle>";
    }).join("");
    return '<svg class="spark" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" role="img" aria-label="История цен">' +
      '<path class="area" d="' + area + '"></path><path class="line" d="' + line + '"></path>' + dots + "</svg>";
  }

  function barsHTML(g) {
    var mem = g.memory || {}, p = g.power || {};
    var maxBw = 1500, maxVram = 64, maxTdp = 350;
    function bar(label, val, max, unit, cls) {
      var pct = Math.max(2, Math.min(100, (val / max) * 100));
      return '<div class="bar-row"><span>' + esc(label) + '</span><span class="bar-track"><i class="bar-fill ' + (cls || "") +
        '" data-w="' + pct.toFixed(1) + '"></i></span><span class="bar-val">' + num(val) + " " + esc(unit) + "</span></div>";
    }
    return '<div class="bars">' +
      bar("VRAM", mem.stock || 0, maxVram, "ГБ", "good") +
      (mem.mod ? bar("после мода", mem.mod, maxVram, "ГБ", "good") : "") +
      bar("Пропускная", mem.bandwidth || 0, maxBw, "ГБ/с") +
      bar("TDP", p.tdp || 0, maxTdp, "Вт", "warn") +
      '</div>';
  }

  function specBlock(title, ico, pairs, extra) {
    var rows = pairs.filter(function (p) {
      return p[1] !== undefined && p[1] !== null && p[1] !== "" && p[1] !== "—";
    })
      .map(function (p) { return "<dt>" + esc(p[0]) + "</dt><dd>" + p[1] + "</dd>"; }).join("");
    return '<div class="spec-block"><h4><span class="ico">' + ico + "</span>" + esc(title) + "</h4><dl class=\"spec\">" + rows + "</dl>" +
      (extra ? '<div class="note panel-tight" style="margin-top:.8rem">' + extra + "</div>" : "") + "</div>";
  }

  /* ======================= просмотры ================================= */

  function viewCatalog() {
    var cats = {};
    GPUS.forEach(function (g) { cats[g.category] = (cats[g.category] || 0) + 1; });
    var chips = Object.keys(cats).map(function (k) {
      return '<button type="button" class="chip" data-cat="' + esc(k) + '" aria-pressed="false">' + esc(cat(k).label) + " · " + cats[k] + "</button>";
    }).join("");

    return '' +
      '<div class="section-head">' +
        "<h2>Каталог карт</h2>" +
        '<p class="lede">' + GPUS.length + ' карт: майнинговые CMP и P10x, серверные Tesla, Instinct, китайские моды VRAM, Intel Arc и пара «эталонов» для сравнения. ' +
        "Для каждой карты указано, что открывается модификацией и что остаётся ограничением.</p>" +
        '<p class="src-note">Впервые здесь? Начните с ' +
        '<a href="#/guide/what-to-buy">«Кому что брать — решение за минуту»</a>, ' +
        '<a href="#/guide/unlock-170hx">разбора разблокировки CMP 170HX</a> и ' +
        '<a href="#/guide/buying-checklist">чек-листа покупки</a>.</p>' +
      "</div>" +
      '<div class="toolbar" id="toolbar">' +
        '<div><label class="field" for="q">Поиск</label><input type="search" id="q" placeholder="CMP, P40, MI50, X99, HBM2…" autocomplete="off"></div>' +
        '<div><label class="field" for="sort">Сортировка</label><select id="sort">' +
          '<option value="value">По объёму VRAM</option>' +
          '<option value="speed">По скорости (ток/с)</option>' +
          '<option value="bw">По пропускной способности</option>' +
          '<option value="price">По цене (дешёвые сверху)</option>' +
          '<option value="pricegb">По цене за ГБ</option>' +
          '<option value="year">По году выпуска</option>' +
          '<option value="name">По названию</option>' +
        "</select></div>" +
        '<div><label class="field" for="minvram">VRAM, от</label><select id="minvram">' +
          '<option value="0">любой</option><option value="8">8 ГБ</option><option value="12">12 ГБ</option>' +
          '<option value="16">16 ГБ</option><option value="22">22 ГБ</option><option value="24">24 ГБ</option><option value="32">32 ГБ</option>' +
        "</select></div>" +
        '<div><label class="field" for="maxprice">Цена до</label><select id="maxprice">' +
          '<option value="99999">любая</option><option value="60">$60</option><option value="150">$150</option>' +
          '<option value="250">$250</option><option value="500">$500</option><option value="1100">$1100</option>' +
        "</select></div>" +
        '<div class="chips">' + chips +
          '<button type="button" class="chip" id="chip-mods" aria-pressed="false">только с модами</button>' +
          '<button type="button" class="chip" id="chip-unlocked" aria-pressed="false">считать разблокированный VRAM</button>' +
        "</div>" +
        '<div class="toolbar-foot"><span class="result-count" id="count"></span>' +
        '<button type="button" class="btn btn-sm" id="reset">Сбросить фильтры</button></div>' +
      "</div>" +
      '<div class="grid grid-cards stagger" id="grid"></div>';
  }

  var catalogState = { q: "", cats: {}, sort: "value", minvram: 0, maxprice: 99999, modsOnly: false, unlocked: false };

  function applyFilters() {
    var out = GPUS.filter(function (g) {
      var hay = [g.name, g.arch, g.short, g.category, (g.memory || {}).type, (g.bestFor || []).join(" ")].join(" ").toLowerCase();
      if (catalogState.q && hay.indexOf(catalogState.q.toLowerCase()) < 0) return false;
      var sel = Object.keys(catalogState.cats).filter(function (k) { return catalogState.cats[k]; });
      if (sel.length && sel.indexOf(g.category) < 0) return false;
      var vram = effectiveVram(g, catalogState.unlocked);
      if (vram < catalogState.minvram) return false;
      var lo = (g.prices || {}).low;
      if (lo !== undefined && lo !== null && lo > catalogState.maxprice) return false;
      if (catalogState.modsOnly && !modsCount(g)) return false;
      return true;
    });
    var s = catalogState.sort;
    out.sort(function (a, b) {
      if (s === "speed") {
        var ba = bestBench(a), bb = bestBench(b);
        return ((bb && bb.tg) || 0) - ((ba && ba.tg) || 0);
      }
      if (s === "bw") return ((b.memory || {}).bandwidth || 0) - ((a.memory || {}).bandwidth || 0);
      if (s === "price") return (((a.prices || {}).low) || 1e9) - (((b.prices || {}).low) || 1e9);
      if (s === "pricegb") {
        var pa = ((a.prices || {}).low || 1e9) / (effectiveVram(a, true) || 1);
        var pb = ((b.prices || {}).low || 1e9) / (effectiveVram(b, true) || 1);
        return pa - pb;
      }
      if (s === "year") return (b.year || 0) - (a.year || 0);
      if (s === "name") return String(a.name).localeCompare(String(b.name), "ru");
      return effectiveVram(b, catalogState.unlocked) - effectiveVram(a, catalogState.unlocked);
    });
    return out;
  }

  function paintCatalog() {
    var grid = document.getElementById("grid");
    if (!grid) return;
    var list = applyFilters();
    var count = document.getElementById("count");
    if (count) count.textContent = "Показано " + list.length + " из " + GPUS.length + " карт";
    grid.innerHTML = list.length
      ? list.map(cardHTML).join("")
      : '<div class="panel"><p>Ничего не нашлось. Попробуйте ослабить фильтры — например, снять «только с модами».</p></div>';
    observeReveal();
    animateBars();
  }

  function viewGpu(id) {
    var g = gpuById(id);
    if (!g) return '<div class="panel"><h2>Карта не найдена</h2><p><a href="#/catalog">Вернуться в каталог</a></p></div>';
    var mem = g.memory || {}, comp = g.compute || {}, io = g.io || {}, pw = g.power || {}, sw = g.software || {}, pr = g.prices || {};
    var bb = bestBench(g);

    var modsHtml = (g.mods || []).map(function (m) {
      var t = toolById(m.toolId);
      var sold = (t && t.soldering) || m.soldering;
      return '<details class="accordion reveal"><summary>' + esc(m.title) +
        (sold ? ' <span class="badge warn">нужен паяльник</span>' : ' <span class="badge good">только софт</span>') +
        "</summary><div class=\"accordion-body\">" +
        "<p>" + esc(m.result) + "</p>" +
        (t ? '<dl class="spec"><dt>Инструмент</dt><dd><a href="' + esc(t.url) + '" rel="noopener noreferrer">' + esc(t.name) + "</a></dd>" +
          "<dt>Сложность</dt><dd>" + esc({ low: "низкая", medium: "средняя", high: "высокая", extreme: "экстремальная" }[t.difficulty] || t.difficulty || "—") + "</dd>" +
          "<dt>Риск</dt><dd>" + esc({ low: "низкий", medium: "средний", high: "высокий" }[t.risk] || t.risk || "—") + "</dd>" +
          (t.appearsAs ? "<dt>Как видно в системе</dt><dd>" + esc(t.appearsAs) + "</dd>" : "") +
          "</dl>" : "") +
        (t && t.requires && t.requires.length ? "<h4>Требуется</h4><ul class=\"tight\">" + t.requires.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul>" : "") +
        (t && t.caveats && t.caveats.length ? "<h4>Ограничения и подводные камни</h4><ul class=\"tight\">" + t.caveats.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul>" : "") +
        '<p><a class="btn btn-sm" href="#/mods">Все инструменты разблокировки →</a></p>' +
        "</div></details>";
    }).join("");

    var benchHtml = (g.benchmarks || []).length ? (
      '<div class="table-scroll"><table><thead><tr>' +
      "<th>Модель</th><th>Квант</th><th class=\"num\">Контекст</th><th>Бэкенд</th><th class=\"num\">Генерация, ток/с</th><th class=\"num\">Prefill, ток/с</th><th>Конфигурация</th><th>Достоверность</th>" +
      "</tr></thead><tbody>" + g.benchmarks.map(function (b) {
        return "<tr><td>" + esc(b.model) + "</td><td>" + esc(b.quant || "—") + "</td>" +
          '<td class="num">' + (b.ctx ? num(b.ctx) : "—") + "</td><td>" + esc(b.backend || "—") + "</td>" +
          '<td class="num">' + (b.tg ? num(b.tg, b.tg < 10 ? 2 : 1) : "—") + "</td>" +
          '<td class="num">' + (b.pp ? num(b.pp, 0) : "—") + "</td>" +
          "<td>" + esc(b.rig || "—") + (b.note ? '<br><small class="src-note">' + esc(b.note) + "</small>" : "") + "</td>" +
          "<td>" + conf(b.confidence) + "</td></tr>";
      }).join("") + "</tbody></table></div>"
    ) : '<div class="note">Прямых замеров для этой карты в открытых источниках не нашлось — смотрите «оценку» в подборе под модель. Это честнее, чем придумывать цифру.</div>';

    var stockVsMod = (mem.mod ? (
      '<div class="vs">' +
        '<div class="vs-col"><h4>Из коробки</h4><div class="big">' + num(mem.stock) + ' ГБ</div>' +
          '<div class="unit">' + esc(mem.type) + ", " + num(mem.bandwidth) + " ГБ/с</div>" +
          '<ul class="tight"><li>PCIe Gen' + (io.pcieGen || "?") + " x" + (io.pcieLanes || "?") + "</li>" +
          "<li>" + (io.videoOut ? "Есть видеовыходы" : "Видеовыходов нет") + "</li>" +
          "<li>Программная поддержка: " + esc(sw.cuda || "—") + "</li></ul></div>" +
        '<div class="vs-col after"><h4>После модификации</h4><div class="big">' + num(mem.mod) + ' ГБ</div>' +
          '<div class="unit">' + esc(mem.modNote || "—") + "</div>" +
          '<ul class="tight">' + (g.mods || []).map(function (m) { return "<li>" + esc(m.title) + " — " + esc(m.result) + "</li>"; }).join("") + "</ul></div>" +
      "</div>") : (
      '<div class="note">Модификаций объёма памяти для этой карты в открытых источниках нет: ' +
      "расширять VRAM здесь можно только перепайкой чипов силами мастерской.</div>"));

    return '' +
      '<div class="detail-head">' +
        '<div style="max-width:70ch">' +
          '<a href="#/catalog" class="btn btn-sm btn-ghost">← В каталог</a>' +
          '<h2 class="detail-title">' + esc(g.name) + "</h2>" +
          '<p class="card-sub">' + esc(g.short) + "</p>" +
          badges(g) +
          '<p class="verdict" style="margin-top:.9rem">' + esc(g.verdict) + "</p>" +
        "</div>" +
        '<div class="panel" style="min-width:260px">' +
          '<div class="price" style="font-size:1.5rem">' + esc(priceLabel(g)) +
          '<small>ориентир на ' + esc(pr.updated || META.updated) + " · волатильность: " + esc(pr.volatility || "—") + "</small></div>" +
          (pr.note ? '<p class="src-note" style="margin:.7rem 0 0">' + esc(pr.note) + "</p>" : "") +
          (pr.history ? sparkline(pr.history) : "") +
          '<div style="margin-top:.9rem">' + barsHTML(g) + "</div>" +
        "</div>" +
      "</div>" +

      '<div class="spec-grid stagger" style="margin-bottom:1.2rem">' +
        specBlock("Память", "▦", [
          ["Объём, сток", num(mem.stock) + " ГБ"],
          ["Объём, мод", mem.mod ? num(mem.mod) + " ГБ" : "—"],
          ["Тип", esc(mem.type || "—")],
          ["Шина", mem.busBits ? esc(mem.busBits) + " бит" : "—"],
          ["Пропускная", num(mem.bandwidth) + " ГБ/с"],
          ["ECC", mem.ecc ? "есть" : "нет"],
          ["Замер ПСП", esc(mem.measuredBandwidth || "—")],
          ["Комментарий", esc(mem.bandwidthNote || mem.note || mem.modNote || "—")]
        ]) +
        specBlock("Вычисления", "⚙", [
          ["Ядер", comp.cores ? num(comp.cores) + " " + esc(comp.coreLabel || "") : "—"],
          ["Блоки", esc(comp.sms || "—")],
          ["Tensor / XMX", esc(comp.tensor || "—")],
          ["FP32", (comp.fp32 ? num(comp.fp32, 1) + " Тфлопс" : "—")],
          ["FP16", (typeof comp.fp16 === "number" ? num(comp.fp16, 1) + " Тфлопс" : esc(comp.fp16 || "—"))],
          ["INT8 / TOPS", esc(comp.int8 || "—")],
          ["Детали", esc(comp.notes || "—")]
        ]) +
        specBlock("Интерфейс", "⇄", [
          ["PCIe", io.pcieGen ? "Gen" + io.pcieGen + " x" + io.pcieLanes : "нет слотов"],
          ["Нюанс", esc(io.pcieNote || "—")],
          ["Видеовыходы", io.videoOut ? "есть" : "нет"],
          ["NVLink", io.nvlink ? (io.nvlinkNote ? "есть — " + esc(io.nvlinkNote) : "есть") : "нет"],
          ["ReBAR", esc(io.rebar || "—")]
        ]) +
        specBlock("Питание и охлаждение", "⚡", [
          ["TDP", (pw.tdp ? num(pw.tdp) + " Вт" : "—")],
          ["Нюанс TDP", esc(pw.tdpNote || "—")],
          ["Реальное потребление", esc(pw.measuredLoad || "—")],
          ["Питание", esc(pw.connectors || "—")],
          ["Охлаждение", esc(pw.cooling || "—")]
        ]) +
        specBlock("Программная поддержка", "⌨", [
          ["CUDA / тулкит", esc(sw.cuda || "—")],
          ["Драйверы", esc(sw.driver || "—")],
          ["Бэкенды", (sw.backends || []).map(esc).join(", ") || "—"],
          ["ОС", esc(sw.os || "—")],
          ["Примечания", esc(sw.notes || "—")]
        ]) +
      "</div>" +

      '<h3 style="margin-top:1.6rem">Из коробки и после модификации</h3>' + stockVsMod +

      ((g.mods || []).length ? '<h3 style="margin-top:1.8rem">Модификации и разблокировки</h3>' + modsHtml : "") +

      '<h3 style="margin-top:1.8rem">Скорость в LLM: замеры сообщества</h3>' + benchHtml +

      '<div class="grid grid-2" style="margin-top:1.4rem">' +
        '<div class="panel"><h4>Кому подходит</h4><ul class="tight">' + (g.bestFor || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" +
        '<div class="panel"><h4>Реальные ограничения</h4><ul class="tight">' + ((g.limits || []).concat(g.risks || [])).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" +
      "</div>" +

      '<div class="panel" style="margin-top:1.4rem"><h4>Источники по этой карте</h4>' +
        '<ul class="src-list">' + (g.links || []).map(function (l) {
          return '<li><a href="' + esc(l.url) + '" rel="noopener noreferrer">' + esc(l.label) + "</a></li>";
        }).join("") + "</ul>" +
        (bb && bb.src ? '<p class="src-note" style="margin-top:.8rem">Лучший замер в таблице выше — по источнику из этого списка.</p>' : "") +
      "</div>";
  }

  /* ---------------------- сравнение ---------------------------------- */

  var compareSel = [];

  function viewCompare() {
    return '' +
      '<div class="section-head"><h2>Сравнение</h2>' +
      '<p class="lede">Отметьте до четырёх карт — таблица покажет ключевые параметры рядом. Лучшее значение в строке подсвечивается.</p></div>' +
      '<div class="toolbar"><div class="chips" id="pick">' + GPUS.map(function (g) {
        return '<button type="button" class="chip" data-pick="' + esc(g.id) + '" aria-pressed="' + (compareSel.indexOf(g.id) >= 0) + '">' + esc(g.name) + "</button>";
      }).join("") + "</div></div>" +
      '<div id="cmp-out"></div>';
  }

  function paintCompare() {
    var out = document.getElementById("cmp-out");
    if (!out) return;
    var list = compareSel.map(gpuById).filter(Boolean);
    if (!list.length) { out.innerHTML = '<div class="note">Выберите карты выше.</div>'; return; }

    var rows = [
      ["Категория", function (g) { return esc(cat(g.category).label); }],
      ["Архитектура", function (g) { return esc(g.arch); }],
      ["Год", function (g) { return esc(g.year); }],
      ["VRAM, сток", function (g) { return num((g.memory || {}).stock) + " ГБ"; }, function (g) { return (g.memory || {}).stock || 0; }, "max"],
      ["VRAM, мод", function (g) { return (g.memory || {}).mod ? num(g.memory.mod) + " ГБ" : "—"; }, function (g) { return (g.memory || {}).mod || 0; }, "max"],
      ["Тип памяти", function (g) { return esc((g.memory || {}).type || "—"); }],
      ["Пропускная способность", function (g) { return num((g.memory || {}).bandwidth) + " ГБ/с"; }, function (g) { return (g.memory || {}).bandwidth || 0; }, "max"],
      ["Ядер / CU", function (g) { return num((g.compute || {}).cores); }, function (g) { return (g.compute || {}).cores || 0; }, "max"],
      ["Тензорные ядра", function (g) { var t = (g.compute || {}).tensor; return t && t !== "Нет" ? esc(t) : "нет"; }],
      ["FP16, Тфлопс", function (g) { var v = (g.compute || {}).fp16; return typeof v === "number" ? num(v, 1) : esc(v || "—"); }, function (g) { var v = (g.compute || {}).fp16; return typeof v === "number" ? v : 0; }, "max"],
      ["PCIe", function (g) { var i = g.io || {}; return i.pcieGen ? "Gen" + i.pcieGen + " x" + i.pcieLanes : "—"; }],
      ["Видеовыходы", function (g) { return (g.io || {}).videoOut ? "есть" : "нет"; }],
      ["TDP", function (g) { return num((g.power || {}).tdp) + " Вт"; }, function (g) { return (g.power || {}).tdp || 0; }, "min"],
      ["Модов", function (g) { return modsCount(g) ? modsCount(g) + " шт." : "—"; }, function (g) { return modsCount(g); }, "max"],
      ["Нужен паяльник", function (g) { return needsSoldering(g) ? "да" : "нет"; }],
      ["Лучший замер, ток/с", function (g) { var b = bestBench(g); return b ? num(b.tg, 1) + " (" + esc(b.model) + ")" : "—"; }, function (g) { var b = bestBench(g); return b ? b.tg : 0; }, "max"],
      ["Цена", function (g) { return esc(priceLabel(g)); }, function (g) { return (g.prices || {}).low || 1e9; }, "min"],
      ["Цена за ГБ (с модом)", function (g) { var p = ((g.prices || {}).low || 0) / (effectiveVram(g, true) || 1); return p ? "$" + num(p, 1) : "—"; }, function (g) { return ((g.prices || {}).low || 1e9) / (effectiveVram(g, true) || 1); }, "min"],
      ["Волатильность цены", function (g) { return '<span class="badge ' + volatilityCls((g.prices || {}).volatility) + '">' + esc((g.prices || {}).volatility || "—") + "</span>"; }]
    ];

    var head = '<thead><tr><th>Параметр</th>' + list.map(function (g) {
      return "<th>" + esc(g.name) + '</th>';
    }).join("") + "</tr></thead>";

    var body = rows.map(function (r) {
      var vals = r[2] ? list.map(r[2]) : null;
      var bestIdx = -1;
      if (vals) {
        bestIdx = 0;
        for (var i = 1; i < vals.length; i++) {
          if (r[3] === "max" ? vals[i] > vals[bestIdx] : vals[i] < vals[bestIdx]) bestIdx = i;
        }
      }
      return "<tr><th scope=\"row\">" + esc(r[0]) + "</th>" + list.map(function (g, i) {
        var cls = (vals && i === bestIdx && vals.length > 1) ? ' class="best"' : "";
        return "<td" + cls + ">" + r[1](g) + "</td>";
      }).join("") + "</tr>";
    }).join("");

    out.innerHTML = '<div class="table-scroll"><table>' + head + "<tbody>" + body + "</tbody></table></div>";
  }

  /* ---------------------- подбор под модель -------------------------- */

  var pickState = { model: (META.models || [])[0] && META.models[0].id, quant: "q4", ctx: 8192, unlocked: false };

  function viewPicker() {
    var models = META.models || [];
    return '' +
      '<div class="section-head"><h2>Подбор под модель</h2>' +
      '<p class="lede">Укажите модель, квантизацию и длину контекста — база посчитает, сколько нужно памяти, и покажет карты, которые её потянут. ' +
      "Оценки скорости помечены отдельно от замеров.</p></div>" +
      '<div class="panel">' +
        '<div class="picker-form">' +
          '<div><label class="field" for="m">Модель</label><select id="m">' + models.map(function (m) {
            return '<option value="' + esc(m.id) + '"' + (m.id === pickState.model ? " selected" : "") + ">" + esc(m.name) + "</option>";
          }).join("") + "</select></div>" +
          '<div><label class="field" for="q2">Квантизация</label><select id="q2">' +
            [["q1", "Q1/IQ1 — минимум памяти"], ["q2", "Q2/IQ2"], ["q4", "Q4_K_M — стандарт"], ["q5", "Q5_K_M"], ["q8", "Q8_0"], ["fp16", "FP16/BF16 — без сжатия"]]
            .map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === pickState.quant ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") +
          "</select></div>" +
          '<div><label class="field" for="c2">Контекст, токенов</label><select id="c2">' +
            [2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144].map(function (c) {
              return '<option value="' + c + '"' + (c === pickState.ctx ? " selected" : "") + ">" + num(c) + "</option>";
            }).join("") + "</select></div>" +
          '<div><label class="switch"><input type="checkbox" id="u2"' + (pickState.unlocked ? " checked" : "") + ">считать разблокированный VRAM</label></div>" +
        "</div>" +
        '<div id="picker-out" class="picker-out"></div>' +
      "</div>";
  }

  function paintPicker() {
    var out = document.getElementById("picker-out");
    if (!out) return;
    var m = null, models = META.models || [];
    for (var i = 0; i < models.length; i++) if (models[i].id === pickState.model) m = models[i];
    if (!m) { out.innerHTML = ""; return; }

    var bytes = (m.bytes || {})[pickState.quant];
    if (bytes === undefined) {
      var keys = Object.keys(m.bytes);
      bytes = m.bytes[keys[keys.length - 1]];
    }
    var kv = (m.kvGBper1k || 0.15) * (pickState.ctx / 1000);
    var need = bytes + kv;

    var candidates = GPUS.map(function (g) {
      var vram = effectiveVram(g, pickState.unlocked);
      var est = estimate(g, bytes);
      return { g: g, vram: vram, est: est, fits: vram >= need };
    }).filter(function (x) { return x.fits; });

    candidates.sort(function (a, b) { return b.est.high - a.est.high; });

    var head = '<h3>Что нужно для этой модели</h3>' +
      '<div class="grid grid-3">' +
        '<div class="panel panel-tight"><dt class="field">Веса модели</dt><div class="price" style="font-size:1.4rem">' + num(bytes, 1) + ' ГБ</div></div>' +
        '<div class="panel panel-tight"><dt class="field">KV-кэш на ' + num(pickState.ctx) + ' токенов</dt><div class="price" style="font-size:1.4rem">' + num(kv, 1) + ' ГБ</div></div>' +
        '<div class="panel panel-tight"><dt class="field">Итого нужно</dt><div class="price" style="font-size:1.4rem">' + num(need, 1) + ' ГБ</div></div>' +
      "</div>";

    var list = candidates.length ? candidates.map(function (c) {
      var g = c.g;
      var headroom = c.vram / need;
      var cls = headroom < 1.15 ? "tight" : "";
      var bb = bestBench(g);
      return '<div class="panel panel-tight reveal"><div class="fit-row">' +
        '<div><a href="#/gpu/' + esc(g.id) + '"><strong>' + esc(g.name) + "</strong></a> " +
        '<span class="badge">' + num(c.vram) + " ГБ</span> " + conf(bb ? "measured" : "estimated") +
        '<div class="fit-meter"><i class="' + cls + '" data-w="' + Math.min(100, (need / c.vram) * 100).toFixed(0) + '"></i></div>' +
        '<small class="src-note">занято ' + num(need, 1) + " из " + num(c.vram) + " ГБ" + (headroom < 1.15 ? " — впритык" : "") + "</small></div>" +
        '<div style="text-align:right"><div class="price">' + (bb ? num(bb.tg, 1) + " ток/с (замер)" : "≈" + c.est.low + "–" + c.est.high + " ток/с (оценка)") + "</div>" +
        '<small class="src-note">' + esc(priceLabel(g)) + " · потолок по ПСП ≈ " + c.est.ceiling + " ток/с</small></div>" +
        "</div></div>";
    }).join("") : '<div class="note bad">Ни одна карта базы не вмещает это целиком даже с разблокировкой. Варианты: снизить квантизацию, сократить контекст или собрать несколько карт (тогда память суммируется, а скорость — не всегда).</div>';

    out.innerHTML = head + '<h3 style="margin-top:1.4rem">Карты, которые потянут (' + candidates.length + ")</h3>" +
      '<div class="grid">' + list + "</div>" +
      '<div class="note" style="margin-top:1rem"><p><strong>Как читать оценку.</strong> Потолок считается по формуле «ПСП ÷ (размер модели × 1.15)» — это физический предел для декодирования. ' +
      "Реальная скорость обычно составляет 40–75% от потолка: зависит от зрелости бэкенда. Для карт с замерами в базе показывается измеренная цифра, для остальных — диапазон, и это честная оценка, а не результат.</p></div>";
    observeReveal();
    animateBars();
  }

  /* ---------------------- сборки и моды ------------------------------ */

  function viewBuilds() {
    return '<div class="section-head"><h2>Реальные сборки</h2>' +
      '<p class="lede">Отчёты людей, которые собрали это на самом деле — в основном на X99/Xeon, но не только. С указанием того, что сработало, а что нет.</p></div>' +
      '<div class="grid">' + BUILDS.map(function (b) {
        return '<article class="panel reveal">' +
          "<h3>" + esc(b.title) + "</h3>" +
          '<p class="card-sub">' + esc(b.author) + " · " + esc(b.date) + " · " + esc(b.platform) + "</p>" +
          '<dl class="spec">' + Object.keys(b.parts || {}).map(function (k) {
            var label = { cpu: "CPU", motherboard: "Плата", ram: "Память", gpus: "GPU", psu: "Питание", os: "ОС" }[k] || k;
            return "<dt>" + esc(label) + "</dt><dd>" + esc(b.parts[k]) + "</dd>";
          }).join("") + "</dl>" +
          ((b.results || []).length ? '<div class="table-scroll" style="margin-top:.8rem"><table><thead><tr><th>Модель</th><th>Квант</th><th class="num">Ток/с</th><th class="num">Prefill</th><th>Бэкенд</th></tr></thead><tbody>' +
            b.results.map(function (r) {
              return "<tr><td>" + esc(r.model) + "</td><td>" + esc(r.quant || "—") + "</td>" +
                '<td class="num">' + (r.tg ? num(r.tg, 1) : "—") + '</td><td class="num">' + (r.pp ? num(r.pp) : "—") + "</td><td>" + esc(r.backend || "—") + "</td></tr>";
            }).join("") + "</tbody></table></div>" : "") +
          ((b.whatWorked || []).length ? "<h4>Что сработало</h4><ul class=\"tight\">" + b.whatWorked.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
          ((b.whatFailed || []).length ? "<h4>Что не сработало</h4><ul class=\"tight\">" + b.whatFailed.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
          (b.costNote ? '<p class="src-note">' + esc(b.costNote) + "</p>" : "") +
          (b.source ? '<p><a class="btn btn-sm" href="' + esc(b.source) + '" rel="noopener noreferrer">Источник →</a></p>' : "") +
          "</article>";
      }).join("") + "</div>";
  }

  function viewMods() {
    var typeLabels = {
      unlock: "разблокировка", driver: "драйверы", firmware: "прошивка", "kernel-patch": "патч ядра",
      tuning: "тюнинг", engine: "движок", runtime: "рантайм", "hardware-mod": "аппаратный мод",
      "engine-patch": "патч движка"
    };
    return '<div class="section-head"><h2>Прошивки, патчи и моды</h2>' +
      '<p class="lede">Всё, чем сообщество снимает ограничения: от in-driver разблокировок GA100 до перепайки чипов памяти. ' +
      "Явно помечено, где нужен паяльник, а где достаточно прав администратора.</p></div>" +
      '<div class="grid">' + TOOLS.map(function (t) {
        var riskCls = { low: "good", medium: "warn", high: "bad" }[t.risk] || "";
        var diff = { low: "низкая", medium: "средняя", high: "высокая", extreme: "экстремальная" }[t.difficulty] || t.difficulty;
        return '<article class="panel reveal">' +
          "<h3>" + esc(t.name) + "</h3>" +
          '<p class="card-sub">' + esc(typeLabels[t.type] || t.type) + " · " + esc(t.author || "") + " · сложность: " + esc(diff || "—") + "</p>" +
          '<div class="badges">' +
            (t.soldering ? '<span class="badge warn">нужен паяльник</span>' : '<span class="badge good">без паяльника</span>') +
            '<span class="badge ' + riskCls + '">риск: ' + esc({ low: "низкий", medium: "средний", high: "высокий" }[t.risk] || t.risk) + "</span>" +
            '<span class="badge">' + esc(t.status === "active" ? "актуально" : t.status === "reported" ? "по сообщениям" : t.status === "superseded" ? "вытеснено" : t.status) + "</span>" +
          "</div>" +
          "<p>" + esc(t.summary) + "</p>" +
          ((t.unlocks || []).length ? '<div class="table-scroll"><table><thead><tr><th>Что открывается</th><th>Статус</th></tr></thead><tbody>' +
            t.unlocks.map(function (u) {
              var cls = /не |нестаб|частич|огранич|не решено/i.test(u.status) ? "warn" : "good";
              return "<tr><td>" + esc(u.feature) + '</td><td><span class="badge ' + cls + '">' + esc(u.status) + "</span></td></tr>";
            }).join("") + "</tbody></table></div>" : "") +
          '<p class="src-note">Карты: ' + (t.cards || []).map(esc).join(", ") + "</p>" +
          (t.appearsAs ? '<p class="src-note">В системе выглядит как: ' + esc(t.appearsAs) + "</p>" : "") +
          ((t.requires || []).length ? "<details class=\"accordion\"><summary>Требования</summary><div class=\"accordion-body\"><ul class=\"tight\">" +
            t.requires.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul></div></details>" : "") +
          ((t.caveats || []).length ? "<details class=\"accordion\"><summary>Подводные камни</summary><div class=\"accordion-body\"><ul class=\"tight\">" +
            t.caveats.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul></div></details>" : "") +
          '<p><a class="btn btn-sm" href="' + esc(t.url) + '" rel="noopener noreferrer">Репозиторий / источник →</a></p>' +
          "</article>";
      }).join("") + "</div>";
  }

  /* ---------------------- источники и гайды -------------------------- */

  function viewSources() {
    var kinds = {
      github: "GitHub — репозиторий", issue: "GitHub — issue", gist: "Gist", scoreboard: "Скорборд замеров",
      reddit: "Reddit", forum: "Форум", blog: "Блог", docs: "Документация", press: "Пресса",
      paper: "Научная работа", price: "Цены", git: "Git"
    };
    var byPriority = {};
    (META.sources || []).forEach(function (s) {
      var p = s.priority || 3;
      (byPriority[p] = byPriority[p] || []).push(s);
    });
    var order = Object.keys(byPriority).sort();
    var labels = { "1": "Приоритет 1 — обязательные", "2": "Приоритет 2 — полезные", "3": "Приоритет 3 — вспомогательные" };
    return '<div class="section-head"><h2>Источники данных</h2>' +
      '<p class="lede">Откуда взяты цифры. Это же — список того, что стоит парсить и мониторить, если хотите поддерживать базу в актуальном состоянии.</p></div>' +
      order.map(function (p) {
        return "<h3 style=\"margin-top:1.6rem\">" + esc(labels[p] || ("Приоритет " + p)) + "</h3>" +
          '<ul class="src-list">' + byPriority[p].map(function (s) {
            return "<li>" +
              '<span class="src-kind">' + esc(kinds[s.kind] || s.kind) + "</span>" +
              '<a href="' + esc(s.url) + '" rel="noopener noreferrer">' + esc(s.title) + "</a>" +
              '<span class="src-note">' + esc(s.take) + "</span>" +
              "</li>";
          }).join("") + "</ul>";
      }).join("") +
      '<div class="note" style="margin-top:1.6rem"><p>Гайдов внутри базы: ' + GUIDES.length + ". Они открываются из каталога и из карточек карт.</p></div>";
  }

  function viewGuide(id) {
    var g = null;
    GUIDES.forEach(function (x) { if (x.id === id) g = x; });
    if (!g) return '<div class="panel"><h2>Гайд не найден</h2><p><a href="#/catalog">В каталог</a></p></div>';
    var body = (g.blocks || []).map(function (b) {
      if (b.type === "h") return "<h3 style=\"margin-top:1.6rem\">" + esc(b.text) + "</h3>";
      if (b.type === "p") return "<p>" + esc(b.text) + "</p>";
      if (b.type === "note") return '<div class="note ' + esc(b.cls || "") + '"><p>' + esc(b.text) + "</p></div>";
      if (b.type === "ul") return "<ul class=\"tight\">" + b.items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>";
      if (b.type === "ol") return "<ol>" + b.items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ol>";
      if (b.type === "code") return "<pre><code>" + esc(b.text) + "</code></pre>";
      if (b.type === "table") return '<div class="table-scroll"><table><thead><tr>' + b.head.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") +
        "</tr></thead><tbody>" + b.rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
      return "";
    }).join("");
    return '<div class="detail-head"><div style="max-width:80ch">' +
      '<a href="#/guides" class="btn btn-sm btn-ghost">← Все гайды</a>' +
      "<h2 class=\"detail-title\">" + esc(g.title) + "</h2>" +
      '<p class="lede">' + esc(g.summary) + "</p>" +
      "</div><div class=\"panel\" style=\"min-width:200px\"><h4>Теги</h4><div class=\"badges\">" +
      (g.tags || []).map(function (t) { return '<span class="badge">' + esc(t) + "</span>"; }).join("") +
      '</div><p class="src-note" style="margin-top:.7rem">Чтение: ~' + esc(g.minutes || 5) + " мин</p></div></div>" +
      '<div class="panel">' + body + "</div>" +
      ((g.links || []).length ? '<div class="panel"><h4>Ссылки</h4><ul class="src-list">' + g.links.map(function (l) {
        return '<li><a href="' + esc(l.url) + '" rel="noopener noreferrer">' + esc(l.label) + "</a></li>";
      }).join("") + "</ul></div>" : "");
  }

  function viewGuides() {
    return '<div class="section-head"><h2>Гайды</h2>' +
      '<p class="lede">Практические разборы: как устроены разблокировки, что включать в BIOS на X99, как охлаждать пассивные Tesla, как читать чужие бенчмарки и не переплатить.</p></div>' +
      '<div class="grid grid-2">' + GUIDES.map(function (g) {
        return '<a class="panel reveal" href="#/guide/' + esc(g.id) + '" style="text-decoration:none;color:inherit">' +
          "<h3>" + esc(g.title) + "</h3><p>" + esc(g.summary) + "</p>" +
          '<div class="badges">' + (g.tags || []).map(function (t) { return '<span class="badge">' + esc(t) + "</span>"; }).join("") +
          '<span class="badge info">~' + esc(g.minutes || 5) + " мин</span></div></a>";
      }).join("") + "</div>";
  }

  function viewAbout() {
    var benchmarks = 0;
    GPUS.forEach(function (g) { benchmarks += (g.benchmarks || []).length; });
    return '<div class="section-head"><h2>О базе</h2>' +
      '<p class="lede">Офлайновый справочник по видеокартам, которые обычно не попадают в обзоры: майнинговым, серверным, модифицированным кустарно — ' +
      "и по тому, что из них реально выжимают под локальный инференс LLM.</p></div>" +
      '<div class="grid grid-2">' +
        '<div class="panel"><h3>Что внутри</h3><ul class="tight">' +
          "<li>" + GPUS.length + " карт с полными паспортными и измеренными характеристиками</li>" +
          "<li>" + benchmarks + " замеров скорости с указанием модели, квантизации, контекста и бэкенда</li>" +
          "<li>" + TOOLS.length + " инструментов разблокировки, прошивок и патчей</li>" +
          "<li>" + BUILDS.length + " реальных сборок с разбором «что сработало / что нет»</li>" +
          "<li>" + GUIDES.length + " гайдов</li>" +
          "<li>" + (META.sources || []).length + " источников с указанием, что именно оттуда брать</li>" +
        "</ul></div>" +
        '<div class="panel"><h3>Как мы помечаем данные</h3><dl class="spec">' +
          Object.keys(META.confidence || {}).map(function (k) {
            var c = META.confidence[k];
            return "<dt>" + esc(c.label) + "</dt><dd>" + esc(c.hint) + "</dd>";
          }).join("") + "</dl>" +
          '<p class="src-note">Никаких «примерно 40 токенов» без пометки: если цифра измерена — стоит бейдж «замер», если посчитана — «оценка».</p>' +
        "</div>" +
        '<div class="panel"><h3>Методика</h3><ol>' +
          "<li>Собираем публичные отчёты: GitHub (issues, README, инструменты), Reddit, форумы (Level1Techs, overclockers.ru), блоги, Hugging Face, пресса.</li>" +
          "<li>Для каждой карты фиксируем паспортные характеристики (TechPowerUp, даташиты) и отдельно измеренные числа.</li>" +
          "<li>Замеры приводим с контекстом: модель, квантизация, длина контекста, бэкенд, конфигурация железа. Без этого цифра бесполезна.</li>" +
          "<li>Отдельно указываем, что открывает модификация и что остаётся ограничением — это главный смысл базы.</li>" +
          "<li>Цены помечаем датой и волатильностью: на этом рынке они меняются за недели.</li>" +
        "</ol></div>" +
        '<div class="panel"><h3>Ограничения и предупреждения</h3>' +
          '<div class="note warn"><p>' + esc(META.disclaimer) + "</p></div>" +
          "<p>База не является рекомендацией к покупке конкретного лота. Все ссылки ведут на публичные материалы сообщества; " +
          "авторы базы не связаны с продавцами и не получают комиссий.</p>" +
          '<p class="src-note">Лицензия: CC0-1.0. Данные можно свободно использовать, копировать и дополнять.</p>' +
        "</div>" +
        '<div class="panel"><h3>Как дополнить</h3><p>Формат данных — обычные JS-файлы в <code>assets/data/</code>. Схема описана в <code>docs/SCHEMA.md</code>, правила — в <code>CONTRIBUTING.md</code>.</p>' +
          "<p>Если у вас есть замер на нишевой карте — это самое ценное, что можно добавить: цифр из реальных сборок объективно мало.</p>" +
          '<p class="src-note">Версия данных: ' + esc(META.version) + " · обновлено: " + esc(META.updated) + " · источник времени: даты в источниках.</p>" +
        "</div>" +
      "</div>";
  }

  /* ======================= роутер ==================================== */

  var ROUTES = {
    catalog: viewCatalog, compare: viewCompare, picker: viewPicker,
    builds: viewBuilds, mods: viewMods, sources: viewSources,
    guides: viewGuides, about: viewAbout
  };

  function parseHash() {
    var h = (location.hash || "#/catalog").replace(/^#\/?/, "");
    var parts = h.split("/").filter(Boolean);
    return { name: parts[0] || "catalog", arg: parts[1] ? decodeURIComponent(parts[1]) : null };
  }

  function render() {
    var r = parseHash();
    var host = document.getElementById("view");
    if (!host) return;
    if (r.name === "gpu") host.innerHTML = viewGpu(r.arg);
    else if (r.name === "guide") host.innerHTML = viewGuide(r.arg);
    else {
      var fn = ROUTES[r.name] || viewCatalog;
      host.innerHTML = fn();
      if (r.name === "catalog") { restoreCatalogControls(); paintCatalog(); }
      if (r.name === "compare") paintCompare();
      if (r.name === "picker") paintPicker();
    }
    document.querySelectorAll("#tabs a").forEach(function (a) {
      var active = a.getAttribute("data-route") === r.name ||
        (r.name === "gpu" && a.getAttribute("data-route") === "catalog") ||
        (r.name === "guide" && a.getAttribute("data-route") === "guides");
      if (active) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    try { window.scrollTo(0, 0); } catch (e) { /* окружения без скролла (тесты, встраивание) */ }
    observeReveal();
    animateBars();
  }

  function restoreCatalogControls() {
    var q = document.getElementById("q");
    if (!q) return;
    q.value = catalogState.q;
    document.getElementById("sort").value = catalogState.sort;
    document.getElementById("minvram").value = String(catalogState.minvram);
    document.getElementById("maxprice").value = String(catalogState.maxprice);
    document.getElementById("chip-mods").setAttribute("aria-pressed", String(catalogState.modsOnly));
    var u = document.getElementById("chip-unlocked");
    if (u) u.setAttribute("aria-pressed", String(catalogState.unlocked));
    document.querySelectorAll("#toolbar .chip[data-cat]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(!!catalogState.cats[b.getAttribute("data-cat")]));
    });
  }

  /* ======================= анимации ================================== */

  var io = null;
  function observeReveal() {
    var nodes = document.querySelectorAll(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(nodes, function (n) { n.classList.add("in"); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -40px 0px", threshold: 0.05 });
    }
    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }

  function animateBars() {
    window.requestAnimationFrame(function () {
      document.querySelectorAll(".bar-fill[data-w], .fit-meter i[data-w]").forEach(function (el) {
        el.style.width = el.getAttribute("data-w") + "%";
      });
    });
  }

  /* ======================= события =================================== */

  function bindEvents() {
    document.addEventListener("click", function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;
      if (t.closest("#theme-toggle")) { toggleTheme(); return; }

      var chip = t.closest("#toolbar .chip[data-cat]");
      if (chip) {
        var k = chip.getAttribute("data-cat");
        catalogState.cats[k] = !catalogState.cats[k];
        chip.setAttribute("aria-pressed", String(!!catalogState.cats[k]));
        paintCatalog();
        return;
      }
      if (t.closest("#chip-mods")) {
        catalogState.modsOnly = !catalogState.modsOnly;
        t.closest("#chip-mods").setAttribute("aria-pressed", String(catalogState.modsOnly));
        paintCatalog();
        return;
      }
      if (t.closest("#chip-unlocked")) {
        catalogState.unlocked = !catalogState.unlocked;
        t.closest("#chip-unlocked").setAttribute("aria-pressed", String(catalogState.unlocked));
        paintCatalog();
        return;
      }
      if (t.closest("#reset")) {
        catalogState = { q: "", cats: {}, sort: "value", minvram: 0, maxprice: 99999, modsOnly: false, unlocked: false };
        render();
        return;
      }
      var pick = t.closest("[data-pick]");
      if (pick) {
        var id = pick.getAttribute("data-pick");
        var i = compareSel.indexOf(id);
        if (i >= 0) compareSel.splice(i, 1);
        else if (compareSel.length < 4) compareSel.push(id);
        pick.setAttribute("aria-pressed", String(compareSel.indexOf(id) >= 0));
        paintCompare();
        return;
      }
    });

    document.addEventListener("input", function (ev) {
      var t = ev.target;
      if (!t || !t.id) return;
      if (t.id === "q") { catalogState.q = t.value; paintCatalog(); }
      if (t.id === "sort") { catalogState.sort = t.value; paintCatalog(); }
      if (t.id === "minvram") { catalogState.minvram = Number(t.value); paintCatalog(); }
      if (t.id === "maxprice") { catalogState.maxprice = Number(t.value); paintCatalog(); }
      if (t.id === "m") { pickState.model = t.value; paintPicker(); }
      if (t.id === "q2") { pickState.quant = t.value; paintPicker(); }
      if (t.id === "c2") { pickState.ctx = Number(t.value); paintPicker(); }
      if (t.id === "u2") { pickState.unlocked = t.checked; paintPicker(); }
    });

    window.addEventListener("hashchange", render);

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "SELECT") {
        var q = document.getElementById("q");
        if (q) { ev.preventDefault(); q.focus(); }
      }
      if (ev.key === "Escape" && document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
  }

  /* ======================= старт ===================================== */

  function boot() {
    initTheme();
    document.body.setAttribute("data-booted", "1");
    var fb = document.getElementById("boot-fallback");
    if (fb && fb.parentNode) fb.parentNode.removeChild(fb);
    renderHeroStats();
    var fv = document.getElementById("footer-version");
    if (fv) fv.textContent = "Версия данных " + (META.version || "—") + " · обновлено " + (META.updated || "—");
    bindEvents();
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
