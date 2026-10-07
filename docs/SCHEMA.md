# Схема данных

Все данные — обычные скрипты, которые присваивают `window.BLDL`. Никаких сборщиков, импортов и `fetch`:
поэтому `index.html` открывается прямо с диска.

```text
assets/data/meta.js               BLDL.meta   — версия, категории, уровни достоверности, модели, реестр источников
assets/data/tools.js              BLDL.tools  — инструменты разблокировки, прошивки, патчи
assets/data/gpus-nvidia-mining.js BLDL.gpus   — CMP, P10x, Titan V
assets/data/gpus-nvidia-tesla.js  BLDL.gpus   — Tesla и Quadro-серверные
assets/data/gpus-amd.js           BLDL.gpus   — Instinct, Radeon, BC-250
assets/data/gpus-intel-and-mods.js BLDL.gpus  — Arc, моды VRAM, потребительские эталоны
assets/data/builds.js             BLDL.builds — реальные сборки
assets/data/guides.js             BLDL.guides — гайды
```

Правила, которые проверяет `node tools/validate.js`:

1. `id` уникален внутри своего массива и используется в ссылках (`#/gpu/<id>`, `#/guide/<id>`).
2. Каждый замер ссылается на существующий источник из `meta.sources` — **кроме** случая `confidence: "estimated"`, где источником является формула.
3. Каждая модификация ссылается на существующий `toolId` из `tools.js`.
4. У каждой карты есть цена с датой и оценкой волатильности.
5. Таблицы в гайдах имеют одинаковое число ячеек во всех строках.

---

## Карта (`BLDL.gpus[]`)

```js
{
  id: "cmp-170hx",                 // латиница, дефисы — используется в адресе #/gpu/cmp-170hx
  name: "NVIDIA CMP 170HX",
  short: "8/10 ГБ HBM2e → 40/64 ГБ, GA100, PCIe x4",   // одна строка для карточки
  category: "mining",              // ключ из meta.categories
  arch: "Ampere, GA100 (7 нм)",
  year: 2021,
  formFactor: "PCIe 3.0 x4 (после разблокировки Gen2 x4), 2 слота, пассивная",
  verdict: "…",                    // 2–4 предложения: для кого карта и в чём подвох

  bestFor: ["…"],                  // 3–5 пунктов
  risks: ["…"],                    // необязательно: отдельные риски
  limits: ["…"],                   // жёсткие ограничения (не путать с плюсами)

  memory: {
    stock: 8,                      // ГБ, число
    mod: 64,                       // ГБ после мода или null, если мода нет
    modNote: "…",                  // чем достигается, что требуется, что остаётся ограничением
    type: "HBM2e",
    busBits: 4096,
    bandwidth: 1493,               // ГБ/с, паспорт
    measuredBandwidth: "640–930 ГБ/с по memtest_vulkan после разблокировки",
    ecc: true
  },

  compute: {
    cores: 5120, coreLabel: "CUDA-ядер", sms: "56 SM",
    tensor: "440 тензорных ядер 3-го поколения",
    fp32: 6.2,                     // Тфлопс, после модов/воркэраундов указывайте это в fp16Note или notes
    fp16: 156, fp16Note: "Только с тензорными ядрами",
    int8: "312 TOPS",
    notes: "…"
  },

  io: {
    pcieGen: 2, pcieLanes: 4,      // pcieGen: null — если PCIe нет вообще (BC-250)
    pcieNote: "…",                 // обязателен, если pcieGen: null
    videoOut: false,
    videoOutNote: "…",             // необязательно
    nvlink: false, nvlinkNote: "…",
    rebar: "Не поддерживается"
  },

  power: {
    tdp: 250,
    tdpNote: "…",                  // отключаемые лимиты, заводские ограничения
    measuredLoad: "97 ток/с на 27B при 150–175 Вт (лимит), пики 227 Вт",
    connectors: "EPS 8-pin (а не PCIe!)",
    cooling: "Пассивная: нужен обдув 40+ CFM"
  },

  software: {
    cuda: "sm_80, CUDA 12.x", driver: "nvidia-open 610.x (патч), 580.x",
    backends: ["llama.cpp (CUDA)", "vLLM"],
    os: "Linux только", notes: "…"
  },

  mods: [                          // может быть пустым массивом
    {
      toolId: "cmpunlocker",       // обязательно существующий id из tools.js
      title: "Разблокировка через cmpunlocker",
      result: "…",                 // что получается на выходе, включая то, что осталось недоступным
      soldering: false             // true — если без паяльника не обойтись
    }
  ],

  benchmarks: [
    {
      model: "Qwen3.6-27B",
      quant: "Q4_K_M",
      ctx: 4096,                   // длина контекста, токены
      backend: "llama.cpp (CUDA)",
      rig: "1×170HX 64 ГБ, лимит 250 Вт",
      tg: 38,                      // tok/s генерации; null — если не измеряли
      pp: 2782,                    // tok/s prefill; null — если не измеряли
      ppNote: "pp512 = 2994; pp8192 = 2782",
      note: "…",
      src: "lttlabs-170hx",        // id из meta.sources; null только для confidence: "estimated"
      confidence: "measured"       // measured | reported | estimated | vendor
    }
  ],

  prices: {
    low: 250, high: 450, updated: "2026-10", currency: "USD",
    volatility: "экстремальная",   // низкая | средняя | высокая | экстремальная — влияет на цвет бейджа
    note: "…",
    history: [{ date: "2026-03", price: 120, label: "до публикации разблокировки" }]
  },

  links: [{ label: "…", url: "https://…" }]   // первоисточники именно по этой карте
}
```

### Правила для замеров

- **Никаких цифр без контекста.** Модель, квантизация, контекст, бэкенд, железо — обязательны.
- **Не смешивайте фазы.** `pp` и `tg` пишутся раздельно: это разные узкие места.
- **Не выдавайте оценку за замер.** Пересчитали по ПСП — ставьте `confidence: "estimated"` и `src: null`.
- **Один отчёт — одна строка.** Если у карты два разных владельца с разными числами, это две строки: расхождение само по себе информация.

---

## Инструмент (`BLDL.tools[]`)

```js
{
  id: "cmpunlocker",
  name: "cmpunlocker (amoghmunikote)",
  url: "https://github.com/amoghmunikote/cmpunlocker",
  author: "amoghmunikote",
  type: "unlock",                  // unlock | driver | firmware | kernel-patch | tuning | engine | runtime | hardware-mod | engine-patch
  cards: ["CMP 170HX"],            // к каким картам применим
  difficulty: "medium",            // low | medium | high | extreme
  soldering: false,                // обязательно: ключевой признак для читателя
  risk: "medium",                  // low | medium | high
  status: "active",                // active | reported | superseded | vendor
  summary: "…",
  unlocks: [{ feature: "Геометрия памяти 64 ГБ", status: "работает" }],   // status подхватывается бейджем
  requires: ["…"],                 // что нужно до запуска
  caveats: ["…"],                  // что может пойти не так и что остаётся ограничением
  appearsAs: "nvidia-smi: 65 536 MiB",   // как карта видна в системе после модификации
  sources: ["cmpunlocker", "lttlabs-170hx"]   // id из meta.sources
}
```

## Сборка (`BLDL.builds[]`)

```js
{
  id: "x99-3xp40",
  title: "X99 + 3×Tesla P40: «96 ГБ VRAM за $700»",
  author: "…", date: "2023-11", source: "https://…",
  platform: "X99, одна сокета, 40 линий PCIe",
  parts: { cpu, motherboard, ram, gpus, psu, os },       // любые ключи, выводятся человекочитаемо
  results: [{ model, quant, ctx, tg, pp, backend, note }],
  whatWorked: ["…"], whatFailed: ["…"],
  costNote: "…", tags: ["x99", "p40"]
}
```

## Гайд (`BLDL.guides[]`)

```js
{
  id: "unlock-170hx", title: "…", summary: "…",
  tags: ["cmp", "разблокировка"], minutes: 9,
  blocks: [
    { type: "h", text: "Заголовок" },
    { type: "p", text: "Абзац" },
    { type: "ul", items: ["…"] },
    { type: "ol", items: ["…"] },
    { type: "note", cls: "warn", text: "…" },     // cls: info | warn | bad | good
    { type: "code", text: "команды" },
    { type: "table", head: ["A", "B"], rows: [["1", "2"]] }
  ],
  links: [{ label: "…", url: "https://…" }]
}
```

## Источник (`BLDL.meta.sources[]`)

```js
{ id: "lttlabs-170hx", title: "LTT Labs: независимый тест", url: "https://…",
  kind: "press",        // github | issue | gist | scoreboard | reddit | forum | blog | docs | press | paper | price | git
  take: "Что именно отсюда взято — одной фразой.",
  priority: 1 }         // 1 — обязательный, 2 — полезный, 3 — вспомогательный
```

## Модель (`BLDL.meta.models[]`)

```js
{ id: "qwen3-30a3", name: "Qwen3 30B-A3B (MoE)", params: 30, active: 3, dense: false,
  bytes: { q2: 10.7, q4: 18.6, q5: 20.4, q8: 32.0, fp16: 61.0 },   // ГБ, GGUF
  kvGBper1k: 0.09 }                                                // ГБ на 1000 токенов контекста, fp16
```

---

## Как формула подбора считает скорость

```text
потолок tok/s ≈ ПСП (ГБ/с) ÷ (размер весов в ГБ × 1.15)
диапазон      = 45–72 % от потолка
```

Это физический предел декодирования: на каждый токен нужно прочитать все веса. Реальные цифры почти всегда ниже
из-за накладных расходов, KV-кэша и зрелости бэкенда. Если у карты есть замер в базе — интерфейс показывает замер,
а не оценку; иначе честно помечает цифру как оценку.
