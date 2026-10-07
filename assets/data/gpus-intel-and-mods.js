/* =========================================================================
   Intel Arc, китайские моды VRAM и «эталоны» (3060/3090/1080 Ti) — то,
   относительно чего мы считаем выгоду.
   ========================================================================= */
window.BLDL = window.BLDL || {};
BLDL.gpus = BLDL.gpus || [];

BLDL.gpus.push(

/* ------------------------------------------------------------------- A770 */
{
  id: "arc-a770",
  name: "Intel Arc A770 16 ГБ",
  short: "16 ГБ и 512 ГБ/с за ~$250, SYCL вместо CUDA",
  category: "consumer",
  arch: "Xe-HPG (Alchemist, ACM-G10)",
  year: 2022,
  formFactor: "PCIe 4.0 x16, 2 слота, активное охлаждение",
  verdict:
    "Самый дешёвый способ получить 16 ГБ с высокой ПСП, если готовы жить без CUDA. llama.cpp через SYCL даёт 40–55 ток/с на 8B и 18–22 на 14B; IPEX-LLM выжимает больше. Выбирать стоит, когда карта стоит дешевле 2080 Ti 22 ГБ и когда нет привязки к CUDA-экосистеме.",
  bestFor: ["16 ГБ VRAM за минимальные деньги под GGUF-инференс", "14B в Q4 на одной карте", "Карта вывода и инференса одновременно"],
  risks: [
    "SYCL-путь требует oneAPI-рантайма и свежих драйверов; настройка капризнее CUDA",
    "Vulkan-бэкенд отстаёт: prefill в 5–6 раз медленнее SYCL",
    "Нужен Resizable BAR — на части старых плат он не включается",
    "В bf16/fp16 часть слоёв может проваливаться в медленные пути",
    "Экосистема AMD/NVIDIA для специфических задач шире"
  ],
  memory: { stock: 16, mod: null, type: "GDDR6", busBits: 256, bandwidth: 512, ecc: false },
  compute: { cores: 4096, coreLabel: "шейдерных процессоров (32 Xe-ядер)", sms: "32 Xe-ядра", tensor: "Есть XMX-блоки (аналог тензорных ядер), поддержка INT8/INT4 в IPEX-LLM", fp32: 19.7, fp16: 39.3, int8: "157 TOPS", notes: "На практике сильно зависит от рантайма: один и тот же 8B может идти 16 и 33 ток/с в зависимости от сборки" },
  io: { pcieGen: 4, pcieLanes: 16, pcieNote: "Обязателен Resizable BAR, иначе деградация", videoOut: true, nvlink: false, rebar: "Обязателен" },
  power: { tdp: 225, connectors: "1×8-pin + 1×6-pin", cooling: "Активное", measuredLoad: "—" },
  software: {
    cuda: "—",
    driver: "Intel Compute Runtime + oneAPI (для SYCL), Mesa (для Vulkan)",
    backends: ["llama.cpp (SYCL)", "llama.cpp (Vulkan)", "Ollama (через IPEX-LLM)", "IPEX-LLM", "vLLM (XPU)"],
    os: "Ubuntu 22.04/24.04 — самая проверенная связка",
    notes: "IPEX-LLM (форк Ollama) даёт +35–50% над апстрим-SYCL — именно его имеет смысл ставить первым."
  },
  mods: [],
  benchmarks: [
    { model: "Llama 3.1 8B", quant: "Q4_K_M", ctx: 4096, backend: "llama.cpp (SYCL)", rig: "1×A770", tg: 32.7, pp: 885.9, src: "reddit-a770", confidence: "measured", note: "Тот же файл через Vulkan: 31.8 ток/с и всего 153.8 pp — разрыв в prefill почти 6×" },
    { model: "Llama 3B", quant: "Q4_K_M", ctx: 4096, backend: "llama.cpp (SYCL)", rig: "1×A770", tg: 46.8, pp: 3231, src: "reddit-a770", confidence: "measured" },
    { model: "Mistral 7B / 7–8B класс", quant: "Q4_K_M", ctx: 4096, backend: "SYCL", rig: "1×A770", tg: 40, pp: null, src: "insiderllm-arc", confidence: "reported", note: "Диапазон 40–55 ток/с по сводкам" },
    { model: "Qwen3 14B", quant: "Q4_K_M", ctx: 4096, backend: "SYCL", rig: "1×A770", tg: 20, pp: null, src: "insiderllm-arc", confidence: "reported", note: "18–22 ток/с: на 14B карта ещё рабочая" },
    { model: "30B+ на двух картах", quant: "Q4", ctx: 8192, backend: "llama.cpp (SYCL), 2×A770", rig: "2×A770, 32 ГБ", tg: 10, pp: null, src: "reddit-a770", confidence: "reported" }
  ],
  prices: { low: 200, high: 300, updated: "2026-10", currency: "USD", volatility: "средняя", note: "На вторичке $200–250. На фоне роста цен на память карта стала выглядеть выгоднее, чем год назад.", history: [{ date: "2025-07", price: 220, label: "" }, { date: "2026-10", price: 250, label: "текущий ориентир" }] },
  limits: ["Требуется ReBAR", "Префилл через Vulkan слабый", "Нет CUDA-совместимости", "Разброс результатов по сборкам"],
  links: [
    { label: "Бенчмарки A770: SYCL против Vulkan", url: "https://www.reddit.com/r/IntelArc/comments/1enunga/llamacpp_benchmarks_of_llama318b_on_arc_a770/" },
    { label: "Обзор состояния Arc для LLM", url: "https://insiderllm.com/guides/intel-arc-local-ai/" }
  ]
},

/* ------------------------------------------------------------------- B580 */
{
  id: "arc-b580",
  name: "Intel Arc B580 12 ГБ",
  short: "12 ГБ, 150 Вт, Battlemage",
  category: "consumer",
  arch: "Xe2 (Battlemage, BMG-G21)",
  year: 2024,
  formFactor: "PCIe 4.0 x16, 2 слота, активное охлаждение",
  verdict:
    "Свежий бюджетный вариант: 12 ГБ, 456 ГБ/с, 150 Вт. В IPEX-LLM 8B идёт на 42 ток/с — это уровень RTX 3060, но карта новая, с гарантией и без серверных рисков. Для 14B (10.8 ГБ) влезает впритык.",
  bestFor: ["Новый узел с гарантией, а не серверный хлам", "8B и 14B в Q4", "Тихий и экономичный домашний инференс"],
  risks: ["12 ГБ", "SYCL-экосистема: часть моделей не оптимизирована", "Нужен ReBAR"],
  memory: { stock: 12, mod: null, type: "GDDR6", busBits: 192, bandwidth: 456, ecc: false },
  compute: { cores: 2560, coreLabel: "шейдерных процессоров (20 Xe-ядер)", sms: "20 Xe2-ядер", tensor: "XMX-блоки 2-го поколения", fp32: 13.6, fp16: 27.2, int8: "108 TOPS", notes: "" },
  io: { pcieGen: 4, pcieLanes: 8, pcieNote: "Физически x8 (Gen4) — на инференс почти не влияет", videoOut: true, nvlink: false, rebar: "Обязателен" },
  power: { tdp: 190, connectors: "1×8-pin", cooling: "Активное", measuredLoad: "—" },
  software: { cuda: "—", driver: "Intel Compute Runtime + oneAPI / Mesa", backends: ["llama.cpp (SYCL)", "IPEX-LLM", "vLLM (XPU)"], os: "Ubuntu 24.04", notes: "" },
  mods: [],
  benchmarks: [
    { model: "Llama 3.1 8B", quant: "Q4_K_M", ctx: 4096, backend: "IPEX-LLM", rig: "1×B580", tg: 42, pp: null, src: "bestllmfor-arc", confidence: "measured" },
    { model: "Llama 3.1 8B", quant: "Q4_K_M", ctx: 4096, backend: "llama.cpp (SYCL)", rig: "1×B580", tg: 28, pp: null, src: "bestllmfor-arc", confidence: "measured", note: "Разница с IPEX-LLM — 1.5×. Это главный аргумент за форк." },
    { model: "Qwen3 14B", quant: "Q4_K_M (10.8 ГБ)", ctx: 4096, backend: "IPEX-LLM", rig: "1×B580", tg: 28, pp: null, src: "bestllmfor-arc", confidence: "measured", note: "Влезает в 12 ГБ, но контекст придётся держать скромным" }
  ],
  prices: { low: 230, high: 280, updated: "2026-10", currency: "USD", volatility: "средняя", note: "Новая карта в рознице. Единственный в базе вариант «купить в магазине с гарантией и не возиться».", history: [{ date: "2026-10", price: 250, label: "" }] },
  limits: ["12 ГБ", "ReBAR обязателен", "Производительность зависит от рантайма"],
  links: [{ label: "Бенчмарки Battlemage: IPEX-LLM против SYCL", url: "https://bestllmfor.com/best/intel-arc-battlemage/" }]
},

/* ------------------------------------------------------------ 2080 Ti 22GB */
{
  id: "rtx-2080ti-22g",
  name: "RTX 2080 Ti 22 ГБ (китайский мод)",
  short: "11 ГБ → 22 ГБ пайкой, 616 ГБ/с, тензорные ядра",
  category: "consumer-mod",
  arch: "Turing, TU102",
  year: "2018 (мод — с 2023)",
  formFactor: "PCIe 3.0 x16, 2 слота, активное охлаждение",
  verdict:
    "Самая «человеческая» покупка среди экзотики: полноценная CUDA-карта с рабочими тензорными ядрами, FP16, драйверами и видеовыходами — только с удвоенной памятью. 22 ГБ вмещают 27B в Q4 или 13B в Q8. Берут на eBay по $350–500, часто с историей продаж в сотни штук.",
  bestFor: [
    "CUDA без компромиссов: всё, что работает на NVIDIA, работает и здесь",
    "27B в Q4/Q5 на одной карте",
    "Две карты = 44 ГБ: 70B в Q4 с раскладкой по слоям"
  ],
  risks: [
    "Это кустарная перепайка: стабильность зависит от конкретной мастерской",
    "ПСП остаётся 616 ГБ/с — карта не быстрее обычной 2080 Ti, просто вместительнее",
    "Драйверы требует холодной прошивки VBIOS: часть экземпляров капризна",
    "Гарантии нет, ремонт сложен (BGA-пайка памяти)",
    "Переполнение VRAM на этой карте ведёт себя хуже, чем на серверных (нет ECC)"
  ],
  memory: {
    stock: 11, mod: 22,
    modNote: "Одиннадцать чипов GDDR6 по 1 ГБ заменяются на 2-ГБ (K4ZAF325BM-HC16 и аналоги). Есть вариант 44 ГБ на двойном ранге",
    type: "GDDR6", busBits: 352, bandwidth: 616, ecc: false
  },
  compute: {
    cores: 4352, coreLabel: "CUDA-ядер", sms: "68 SM",
    tensor: "544 тензорных ядра 2-го поколения — работают",
    fp32: 13.4, fp16: 26.9, int8: "≈215 TOPS", fp16Note: "FP16 с тензорными ядрами — в 8 раз быстрее FP32",
    notes: "По железу это обычная 2080 Ti: модя память, вы не получаете ни одного лишнего ядра."
  },
  io: { pcieGen: 3, pcieLanes: 16, pcieNote: "", videoOut: true, nvlink: true, nvlinkNote: "NVLink работает: две карты дают 22+22 ГБ с быстрой связью", rebar: "Не требуется" },
  power: { tdp: 250, connectors: "2×8-pin", cooling: "Активное", measuredLoad: "—" },
  software: { cuda: "sm_75, CUDA 12.x", driver: "Обычные драйверы NVIDIA: карта выглядит как стандартная 2080 Ti", backends: ["llama.cpp (CUDA)", "exllamav2", "vLLM", "Ollama"], os: "Linux / Windows", notes: "Никаких патчей и форков — главное достоинство варианта." },
  mods: [{ toolId: "vram-mod-2080ti", title: "Мод 11 → 22 ГБ", result: "Удвоение VRAM без изменения чипа", soldering: true }],
  benchmarks: [
    { model: "Qwen3.6-27B (MTP2)", quant: "Q6", ctx: 8192, backend: "llama.cpp + MTP", rig: "2×RTX 2080 Ti 22 ГБ", tg: 46, pp: null, src: "cmp170hx-bench", confidence: "measured", note: "В сравнительной таблице против 170HX (97 ток/с на W8A8) — то есть две 2080 Ti дают меньше половины" },
    { model: "Llama 3.1 8B", quant: "Q4_K_M", ctx: 8192, backend: "llama.cpp (CUDA)", rig: "1×2080 Ti (11 ГБ)", tg: 60, pp: 1400, src: null, confidence: "estimated", note: "Оценка по классу Turing: прямых замеров на 22-ГБ версии в источниках мало, потому что скорость равна обычной 2080 Ti" },
    { model: "Qwen3.6-35B-A3B (MoE)", quant: "Q8_0", ctx: 8192, backend: "llama.cpp", rig: "3×2080 Ti 22 ГБ, 47 ГБ занято", tg: 73, pp: null, src: "smzdm-2080ti-22g", confidence: "measured", note: "Контекст 256k: 73 ток/с на пустом, 72 на 20k, 52 на 50k, 36 на 100k" },
    { model: "Qwen3.6-35B-A3B (MoE)", quant: "Q4, всё на GPU", ctx: 32768, backend: "Ollama / llama.cpp", rig: "1×2080 Ti 22 ГБ", tg: 44, pp: 900, src: "smzdm-2080ti-256k", confidence: "measured", note: "Промпт до 1113 ток/с. Главный вывод автора: частичная выгрузка экспертов на CPU давала вдвое меньше — 19 ток/с" },
    { model: "Qwen3.8-27B", quant: "FP8 + MTP3", ctx: 131072, backend: "vLLM, TP2 + NVLink", rig: "2×2080 Ti 22 ГБ", tg: 80, pp: null, src: "smzdm-2080ti-price", confidence: "reported", note: "В реальных проектах владельцы получают 50–70 ток/с — цифры зависят от длины ответа" },
    { model: "Qwen3.8-27B", quant: "Q4_K_XL (17.9 ГБ)", ctx: 153600, backend: "llama.cpp", rig: "1×2080 Ti 22 ГБ", tg: 45, pp: null, src: "smzdm-2080ti-price", confidence: "reported" },
    { model: "DeepSeek-R1 671B", quant: "Q4 (404 ГБ весов)", ctx: 4096, backend: "Ollama, GGML_CUDA_ENABLE_UNIFIED_MEMORY=1", rig: "4×2080 Ti 22 ГБ + 256 ГБ RAM", tg: 2.18, pp: null, src: "csdn-2080ti-671b", confidence: "reported", note: "Гибрид VRAM и системной памяти: работает, но 2 ток/с — это демонстрация, а не рабочий режим" }
  ],
  prices: {
    low: 350, high: 520, updated: "2026-10", currency: "USD",
    volatility: "высокая",
    note: "Гонконгские продавцы на eBay — $499, китайские площадки — от $350 (без доставки и налогов). Реальная стоимость с доставкой часто ближе к $500. В Китае цена держалась на ¥2500 и подскочила до ¥3000 после вирусного видео о локальном ИИ — типичная реакция этого рынка на хайп. В 2024-м было на $100–150 дешевле.",
    history: [
      { date: "2024-02", price: 350, label: "мастерские в Шэньчжэне" },
      { date: "2026-08", price: 499, label: "волна листингов на eBay" },
      { date: "2026-09", price: 420, label: "¥2500 до вирусного видео" },
      { date: "2026-10", price: 470, label: "текущий ориентир" }
    ]
  },
  limits: [
    "ПСП 616 ГБ/с: 27B в Q4 идёт ~30–35 ток/с, 70B — уже совсем медленно",
    "Мод есть мод: стресс-тест обязателен, возврат — лотерея",
    "VRAM не ECC: редкие ошибки памяти никак не сигнализируются"
  ],
  links: [
    { label: "Tom's Hardware: как делают мод 22 ГБ", url: "https://www.tomshardware.com/pc-components/gpus/chinese-workshops-recondition-nvidias-old-flagship-gaming-gpu-for-ai-rtx-2080-ti-upgraded-to-22gb-for-dollar499" },
    { label: "Обсуждение мода в r/LocalLLaMA", url: "https://www.reddit.com/r/LocalLLaMA/comments/18kgr9m/worth_it_to_buy_a_modded_22gb_2080ti_for_llms/" },
    { label: "Разбор рисков мода", url: "https://www.itechguides.com/if-nvidia-wont-add-enough-vram-modders-will-22gb-rtx-2080-ti-cards-for-less-than-500/" },
    { label: "什么值得买: сводка замеров по 22-гигабайтным картам", url: "https://post.smzdm.com/p/anvq9ovv/" },
    { label: "知乎: 43–45 ток/с на Qwen3.6-35B-A3B", url: "https://zhuanlan.zhihu.com/p/2036104742041019044" },
    { label: "什么值得买: как хайп поднял цену и что показывают две карты", url: "https://post.smzdm.com/p/anv32g23/" },
    { label: "CSDN: 671B в Q4 на четырёх картах и системной памяти", url: "https://blog.csdn.net/xianyun_0355/article/details/145823004" }
  ]
},

/* ------------------------------------------------------------ 2080 Ti 44GB */
{
  id: "rtx-2080ti-44g",
  name: "RTX 2080 Ti 44 ГБ (двойной ранг)",
  short: "Предельная версия мода VRAM",
  category: "consumer-mod",
  arch: "Turing, TU102",
  year: "2018 (мод — позднее)",
  formFactor: "PCIe, 2 слота",
  verdict:
    "Экспериментальная крайность: 44 ГБ на потребительской плате. Встречается редко, стоит дорого, стабильность — забота владельца. Интересна как доказательство того, что 44 ГБ на Turing возможны.",
  bestFor: ["Экспериментаторов", "Тем, кому нужно именно 40+ ГБ с CUDA и NVLink"],
  risks: ["Штучный продукт: цены и стабильность непредсказуемы", "Требует пересборки VBIOS", "Ремонт за свой счёт"],
  memory: { stock: 11, mod: 44, modNote: "Чипы удвоенной плотности в двойном ранге", type: "GDDR6", busBits: 352, bandwidth: 616, ecc: false },
  compute: { cores: 4352, coreLabel: "CUDA-ядер", sms: "68 SM", tensor: "544 тензорных ядра", fp32: 13.4, fp16: 26.9, int8: "≈215 TOPS", notes: "По железу — обычная 2080 Ti" },
  io: { pcieGen: 3, pcieLanes: 16, pcieNote: "", videoOut: true, nvlink: true, rebar: "—" },
  power: { tdp: 250, connectors: "2×8-pin", cooling: "Активное", measuredLoad: "—" },
  software: { cuda: "sm_75", driver: "Обычный драйвер", backends: ["llama.cpp (CUDA)", "exllamav2"], os: "Linux / Windows", notes: "" },
  mods: [{ toolId: "vram-mod-2080ti", title: "Мод 11 → 44 ГБ", result: "Четырёхкратный объём", soldering: true }],
  benchmarks: [],
  prices: { low: 700, high: 1200, updated: "2026-10", currency: "USD", volatility: "высокая", note: "За эти деньги уже покупается V100 32 ГБ или две MI50. Смысл — только если нужен именно CUDA + 44 ГБ на одной карте.", history: [{ date: "2026-10", price: 900, label: "" }] },
  limits: ["Штучно", "ПСП прежняя", "Нет внятных публичных замеров"],
  links: [{ label: "Упоминание 44-ГБ мода", url: "https://videocardz.com/newz/geforce-rtx-2080-ti-with-upgraded-22gb-memory-for-ai-workloads-lands-on-ebay-for-500" }, { label: "Китайский рынок модов VRAM: цены и варианты", url: "https://post.smzdm.com/p/anv32g23/" } ]
},

/* ---------------------------------------------------------------- 1080 Ti */
{
  id: "gtx-1080ti",
  name: "GeForce GTX 1080 Ti",
  short: "11 ГБ, 484 ГБ/с, массовая Pascal",
  category: "consumer",
  arch: "Pascal, GP102",
  year: 2017,
  formFactor: "PCIe 3.0 x16, 2 слота, активное охлаждение",
  verdict:
    "Не нишевая, но важная точка отсчёта: 11 ГБ, 484 ГБ/с, куча карт на рынке. Для LLM это «8B в Q5 с запасом», никаких тензорных ядер и FP16. Часто оказывается выгоднее, чем майнинговая P102-100 за те же деньги — просто потому что быстрее и с видеовыходом.",
  bestFor: ["8B в Q5/Q6 с запасом по памяти", "Обычный ПК: и игры, и инференс", "Сравнение «сколько стоит гигабайт у нормальной карты»"],
  risks: ["11 ГБ", "Нет тензорных ядер и FP16", "Потребление 250 Вт", "Много карт с майнинговым прошлым"],
  memory: { stock: 11, mod: null, type: "GDDR5X", busBits: 352, bandwidth: 484, ecc: false },
  compute: { cores: 3584, coreLabel: "CUDA-ядер", sms: "28 SM", tensor: "Нет", fp32: 11.3, fp16: 0.18, int8: "≈45 TOPS (DP4A)", notes: "FP16 отсутствует — как и у P40/P102" },
  io: { pcieGen: 3, pcieLanes: 16, pcieNote: "", videoOut: true, nvlink: false, rebar: "—" },
  power: { tdp: 250, connectors: "1×8-pin + 1×6-pin", cooling: "Активное", measuredLoad: "—" },
  software: { cuda: "sm_61, CUDA 12.x", driver: "580.x — последняя ветка", backends: ["llama.cpp (CUDA)", "Ollama", "Vulkan"], os: "Linux / Windows", notes: "" },
  mods: [],
  benchmarks: [
    { model: "Llama 3.1 8B", quant: "Q4_K_M", ctx: 8192, backend: "llama.cpp (CUDA)", rig: "1×1080 Ti", tg: 40, pp: 900, src: null, confidence: "estimated", note: "Оценка: 484 ГБ/с / (4.9 × 1.15) ≈ 74 теоретического потолка, реально 35–45 ток/с. Прямые замеры сильно зависят от сборки" }
  ],
  prices: { low: 130, high: 220, updated: "2026-10", currency: "USD", volatility: "средняя", note: "Классика вторички. Если она дешевле 2080 Ti 22 ГБ втрое — это разумный компромисс по объёму.", history: [{ date: "2026-10", price: 170, label: "" }] },
  limits: ["11 ГБ", "Pascal: нет FP16/тензорных ядер", "Конец драйверной поддержки"],
  links: [{ label: "llama.cpp CUDA-скорборд", url: "https://github.com/ggml-org/llama.cpp/discussions/15013" }]
},

/* ------------------------------------------------------------------- 3060 */
{
  id: "rtx-3060-12g",
  name: "GeForce RTX 3060 12 ГБ",
  short: "12 ГБ с CUDA и тензорными ядрами — эталон бюджета",
  category: "consumer",
  arch: "Ampere, GA106",
  year: 2021,
  formFactor: "PCIe 4.0 x16, 2 слота, активное охлаждение",
  verdict:
    "Карта, относительно которой надо считать всё остальное: 12 ГБ, рабочие тензорные ядра, 360 ГБ/с, 170 Вт, полная поддержка всего современного стека. Любая экзотика должна быть дешевле или вместительнее, иначе смысла в ней нет.",
  bestFor: ["Домашняя станция «просто работает»", "8B в Q5/Q6, 14B в Q3–Q4", "Обучение и эксперименты с LoRA (12 ГБ хватает на скромные задачи)"],
  risks: ["12 ГБ — быстро становится мало", "360 ГБ/с ограничивает генерацию на 14B"],
  memory: { stock: 12, mod: null, type: "GDDR6", busBits: 192, bandwidth: 360, ecc: false },
  compute: { cores: 3584, coreLabel: "CUDA-ядер", sms: "28 SM", tensor: "112 тензорных ядер 3-го поколения — работают", fp32: 12.7, fp16: 25.5, int8: "≈205 TOPS", notes: "" },
  io: { pcieGen: 4, pcieLanes: 16, pcieNote: "", videoOut: true, nvlink: false, rebar: "Поддерживает" },
  power: { tdp: 170, connectors: "1×8-pin", cooling: "Активное", measuredLoad: "—" },
  software: { cuda: "sm_86, CUDA 12/13", driver: "Актуальные ветки — карта полностью поддерживается", backends: ["llama.cpp (CUDA)", "Ollama", "vLLM", "exllamav2", "TensorRT-LLM"], os: "Linux / Windows", notes: "Единственная карта базы без единой оговорки по поддержке." },
  mods: [],
  benchmarks: [
    { model: "Qwen2.5 7B", quant: "Q4", ctx: 4096, backend: "Ollama", rig: "1×RTX 3060 12 ГБ", tg: 52, pp: null, src: "reddit-cmp210-tc", confidence: "measured", note: "Прямое сравнение с CMP 100-210: 52 против 55 ток/с. Память HBM2 сильнее типичной GDDR6" },
    { model: "Llama 3.1 8B", quant: "Q4_K_M", ctx: 4096, backend: "Ollama/LM Studio", rig: "1×RTX 3060", tg: 45, pp: null, src: "bestllmfor-arc", confidence: "reported" }
  ],
  prices: { low: 190, high: 270, updated: "2026-10", currency: "USD", volatility: "средняя", note: "Подорожала из-за дефицита памяти: 12 ГБ на современной архитектуре больше не стоят $180.", history: [{ date: "2025-01", price: 220, label: "" }, { date: "2026-10", price: 240, label: "текущий ориентир" }] },
  limits: ["12 ГБ и 360 ГБ/с — потолок", "Дороже, чем серверные аналоги с вдвое большей памятью"],
  links: [{ label: "Сравнение с CMP 100-210", url: "https://gist.github.com/synchronic1/94d6b8c2ce89cea8f616527b5d64300a" }]
},

/* ------------------------------------------------------------------- 3090 */
{
  id: "rtx-3090",
  name: "GeForce RTX 3090 24 ГБ",
  short: "936 ГБ/с — верхняя граница «бюджета»",
  category: "consumer",
  arch: "Ampere, GA102",
  year: 2020,
  formFactor: "PCIe 4.0 x16, 3 слота, активное охлаждение",
  verdict:
    "Не бюджетная, но необходимая линейка: 24 ГБ и 936 ГБ/с — тот уровень, где 8B идёт на 80–110 ток/с, а 27B в Q4 остаётся интерактивным. Всё, что в этой базе дешевле, стоит сравнивать именно с ней по формуле «токенов в секунду на доллар».",
  bestFor: ["Быстрый интерактив на 8–27B", "Тонкая настройка LoRA", "Мультикарточные стенды: 2×3090 = 48 ГБ (или 3–4 на X99)"],
  risks: ["Цена выросла вслед за дефицитом памяти", "350 Вт и три слота", "NVLink требует специфичных мостов и только у части ревизий"],
  memory: { stock: 24, mod: null, type: "GDDR6X", busBits: 384, bandwidth: 936, ecc: false },
  compute: { cores: 10496, coreLabel: "CUDA-ядер", sms: "82 SM", tensor: "328 тензорных ядер 3-го поколения", fp32: 35.6, fp16: 71, int8: "≈285 TOPS", notes: "" },
  io: { pcieGen: 4, pcieLanes: 16, pcieNote: "", videoOut: true, nvlink: true, rebar: "Поддерживает" },
  power: { tdp: 350, connectors: "2×8-pin", cooling: "Активное", measuredLoad: "—" },
  software: { cuda: "sm_86", driver: "Актуальные", backends: ["llama.cpp (CUDA)", "vLLM", "exllamav2", "TensorRT-LLM"], os: "Linux / Windows", notes: "" },
  mods: [],
  benchmarks: [
    { model: "Qwen3.6-27B (MTP4)", quant: "IQ4_KS", ctx: 8192, backend: "llama.cpp + MTP", rig: "1×RTX 3090", tg: 80, pp: null, src: "cmp170hx-bench", confidence: "measured", note: "В той же таблице разблокированный 170HX даёт 97 ток/с при 175 Вт против 389 Вт у 3090" },
    { model: "Llama 3.1 8B", quant: "Q4_K_M", ctx: 8192, backend: "llama.cpp (CUDA)", rig: "1×RTX 3090", tg: 100, pp: 3000, src: null, confidence: "estimated", note: "Общеизвестный ориентир: 95–110 ток/с на 8B Q4. Используется здесь как эталон скорости, а не как замер из источника" },
    { model: "Qwen3 30B-A3B (MoE)", quant: "Q4_K_M", ctx: 8192, backend: "llama.cpp", rig: "1×RTX 3090", tg: 110, pp: null, src: null, confidence: "estimated", note: "MoE на 3090 идёт очень быстро — 100–130 ток/с" }
  ],
  prices: { low: 700, high: 1100, updated: "2026-10", currency: "USD", volatility: "высокая", note: "Цена сильно выросла в 2026 году из-за дефицита памяти: то, что стоило $700, теперь продаётся за $900–1100.", history: [{ date: "2025-06", price: 700, label: "" }, { date: "2026-06", price: 950, label: "дефицит памяти" }, { date: "2026-10", price: 1000, label: "текущий ориентир" }] },
  limits: ["Цена", "350 Вт на карту", "24 ГБ закончатся на 70B в Q4"],
  links: [{ label: "Сравнительная таблица 170HX против 3090 и других", url: "https://github.com/Highwayaiexpose/CMP-170hx-64gb-LLM-benchmarks" }]
}

);
