/* =========================================================================
   Локализация. Русский — исходный язык: все тексты в данных и разметке
   написаны по-русски, а словари других языков сопоставляют русской строке
   её перевод. Если перевода нет — показывается русский оригинал, ничего не
   ломается и не исчезает.

   Ключ словаря — ровно та строка, которая появляется на странице.
   Для строк с подстановками (числа, названия) используются правила
   с {фигурными} плейсхолдерами.

   Зависимостей и сети нет: словари — такие же обычные скрипты.
   ========================================================================= */
window.BLDL = window.BLDL || {};
BLDL.i18n = BLDL.i18n || {};

(function () {
  "use strict";

  var STORE_KEY = "bldl-lang";

  /* Языки интерфейса. flag — код для встроенной отрисовки флага. */
  BLDL.langs = [
    { code: "ru", label: "Русский", short: "RU", flag: "ru", title: "Русский язык" },
    { code: "en", label: "English", short: "EN", flag: "us", title: "English interface" },
    { code: "zh", label: "中文", short: "中文", flag: "cn", title: "中文界面" }
  ];

  /* --- технические подстановки: единицы и общеупотребительные сокращения --- */
  var UNITS = {
    en: [
      [/ГБ\/с/g, "GB/s"], [/ТБ\/с/g, "TB/s"],
      [/(\d)\s*ГБ/g, "$1 GB"], [/(\d)\s*МБ/g, "$1 MB"],
      [/(\d)\s*Вт/g, "$1 W"], [/(\d)\s*кВт/g, "$1 kW"],
      [/ГГц/g, "GHz"], [/МГц/g, "MHz"], [/нм(?=[\s,)]|$)/g, "nm"], [/Тфлопс/g, "TFLOPS"],
      [/ток\/с/g, "tok/s"], [/токенов/g, "tokens"], [/токена/g, "token"], [/токен/g, "token"],
      [/бит(?=[\s,)])/g, "bit"], [/ГиБ/g, "GiB"], [/\bОС\b/g, "OS"], [/\bПСП\b/g, "bandwidth"],
      [/пропускная способность/g, "bandwidth"],
      [/\bне\b/g, "no"], [/^нет$/g, "none"], [/^есть$/g, "yes"], [/^да$/g, "yes"],
      [/без видеовыходов/g, "no display outputs"], [/видеовыходов нет/g, "no display outputs"],
      [/пассивное охлаждение/g, "passive cooling"], [/активное охлаждение/g, "active cooling"]
    ],
    zh: [
      [/ГБ\/с/g, "GB/s"], [/ТБ\/с/g, "TB/s"],
      [/(\d)\s*ГБ/g, "$1 GB"], [/(\d)\s*МБ/g, "$1 MB"],
      [/(\d)\s*Вт/g, "$1 W"],
      [/ГГц/g, "GHz"], [/МГц/g, "MHz"],
      [/ток\/с/g, "tok/s"], [/токенов/g, "tokens"], [/токена/g, "token"], [/токен/g, "token"],
      [/Тфлопс/g, "TFLOPS"], [/бит(?=[\s,)]|$)/g, "位"],
      [/ГиБ/g, "GiB"], [/нм(?=[\s,)]|$)/g, "nm"],
      [/^нет$/g, "无"], [/^есть$/g, "有"], [/^да$/g, "有"],
      [/без видеовыходов/g, "无视频输出"], [/видеовыходов нет/g, "无视频输出"]
    ]
  };

  var cache = {};

  function dict(lang) { return (BLDL.i18n && BLDL.i18n[lang]) || null; }

  function compile(lang) {
    if (cache[lang]) return cache[lang];
    var d = dict(lang) || {};
    var exact = Object.create(null);
    var src = d.strings || {};
    for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) exact[k] = src[k];

    var rules = [];
    (d.rules || []).forEach(function (pair) {
      var pattern = String(pair[0]).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\\\{(\w+)\\\}/g, "(.+?)");
      try { rules.push([new RegExp("^" + pattern + "$"), pair[1]]); } catch (e) { /* правило пропускаем */ }
    });
    cache[lang] = { exact: exact, rules: rules, units: UNITS[lang] || [] };
    return cache[lang];
  }

  /* Перевод строки: сначала точное совпадение, затем правила подстановки.
     Глубина нужна, чтобы переводить части составных подписей («Плата · 2023-11»). */
  function translate(s, lang, depth) {
    if (!s || lang === "ru") return s;
    var c = compile(lang);
    if (c.exact[s] !== undefined) return c.exact[s];
    var probe = s.trim();
    if (probe !== s && c.exact[probe] !== undefined) {
      var withTrim = s.replace(probe, c.exact[probe]);
      return withTrim;
    }
    for (var i = 0; i < c.rules.length; i++) {
      var m = s.match(c.rules[i][0]);
      if (m) {
        var out = c.rules[i][1];
        for (var g = 1; g < m.length; g++) {
          var part = m[g];
          if (depth < 2 && /[А-Яа-яЁё]/.test(part)) part = translate(part, lang, depth + 1);
          out = out.replace(new RegExp("\\{" + (g - 1) + "\\}", "g"), part);
        }
        return out;
      }
    }
    // Последний шаг: единицы и короткие служебные слова. Полные предложения
    // здесь не трогаем — иначе получится смесь языков.
    var tech = BLDL.trTech(s, lang);
    if (tech !== s) return tech;
    return s;
  }

  BLDL.tr = function (s, lang) {
    return translate(s, lang, 0);
  };

  /* Технические поля: единицы и сокращения — без словаря, по правилам. */
  BLDL.trTech = function (s, lang) {
    if (!s || lang === "ru") return s;
    s = String(s).replace(/(\d),(\d)/g, "$1.$2");
    var c = compile(lang);
    var out = String(s);
    // Подстановки применяем только к коротким строкам: в длинных предложениях
    // они дали бы смесь языков, а такие строки должны попадать в словарь.
    if (out.length > 40 || out.split(/\s+/).length > 6) return out;
    c.units.forEach(function (pair) { out = out.replace(pair[0], pair[1]); });
    return out;
  };

  /* Сколько строк словаря уже используется: нужно инструменту проверки. */
  BLDL.trStats = function (lang) {
    var c = compile(lang);
    return {
      strings: Object.keys(c.exact).length,
      rules: c.rules.length,
      coverage: (dict(lang) || {}).coverage || null
    };
  };

  BLDL.lang = (function () {
    var saved = null;
    try { saved = localStorage.getItem(STORE_KEY); } catch (e) { saved = null; }
    var known = BLDL.langs.map(function (l) { return l.code; });
    if (saved && known.indexOf(saved) >= 0) return saved;
    var nav = (navigator.language || navigator.userLanguage || "ru").toLowerCase();
    if (nav.indexOf("zh") === 0) return "zh";
    if (nav.indexOf("en") === 0) return "en";
    return "ru";
  })();

  BLDL.setLang = function (code) {
    BLDL.lang = code;
    try { localStorage.setItem(STORE_KEY, code); } catch (e) { /* приватный режим */ }
  };

  /* --- локализация отрисованного DOM ------------------------------------ */
  var SKIP = { CODE: 1, PRE: 1, SCRIPT: 1, STYLE: 1, TEXTAREA: 1 };
  var ATTRS = ["title", "placeholder", "aria-label"];

  function localizeNode(node, lang) {
    if (node.nodeType === 3) {
      var parent = node.parentNode;
      if (!parent || SKIP[parent.nodeName]) return;
      var text = node.nodeValue;
      if (!/[А-Яа-яЁё]/.test(text)) return;
      var replaced = BLDL.tr(text, lang);
      if (replaced !== text) {
        if (node.__ru === undefined) node.__ru = text;
        node.nodeValue = replaced;
      }
      return;
    }
    if (node.nodeType !== 1) return;
    if (SKIP[node.nodeName]) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var v = node.getAttribute && node.getAttribute(ATTRS[i]);
      if (v && /[А-Яа-яЁё]/.test(v)) {
        var t = BLDL.tr(v, lang);
        if (t !== v) {
          if (!node.__ruAttrs) node.__ruAttrs = {};
          if (node.__ruAttrs[ATTRS[i]] === undefined) node.__ruAttrs[ATTRS[i]] = v;
          node.setAttribute(ATTRS[i], t);
        }
      }
    }
    var kids = node.childNodes;
    for (var j = 0; j < kids.length; j++) localizeNode(kids[j], lang);
  }

  function restoreNode(node) {
    if (node.nodeType === 3) {
      if (node.__ru !== undefined) { node.nodeValue = node.__ru; delete node.__ru; }
      return;
    }
    if (node.nodeType !== 1) return;
    if (node.__ruAttrs) {
      for (var a in node.__ruAttrs) if (Object.prototype.hasOwnProperty.call(node.__ruAttrs, a)) {
        node.setAttribute(a, node.__ruAttrs[a]);
      }
      delete node.__ruAttrs;
    }
    var kids = node.childNodes;
    for (var i = 0; i < kids.length; i++) restoreNode(kids[i]);
  }

  BLDL.restore = function (root) {
    if (root) restoreNode(root);
  };

  BLDL.localize = function (root, lang) {
    lang = lang || BLDL.lang;
    if (lang === "ru" || !root) return;
    localizeNode(root, lang);
  };
})();
